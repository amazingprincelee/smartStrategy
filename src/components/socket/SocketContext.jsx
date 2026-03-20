import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import {
  addNotification,
  updateNotification,
  removeNotification,
  fetchUnreadCount,
} from '../../redux/slices/userSlice';
import { updateBotRealtime, updatePositionPrice } from '../../redux/slices/botSlice';
import { addLiveSignal } from '../../redux/slices/signalSlice';
import { setLiveArbitrageOpportunities, setLiveTriangularOpportunities } from '../../redux/slices/arbitrageslice';
import { updateAlphaLivePrices } from '../../redux/slices/alphaSlice';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔄 Initializing socket connection...');

    const socketUrl = import.meta.env.VITE_SOCKET_URL; 
      
   // const socketUrl =  'http://localhost:5000'

    // Connect for everyone — anonymous users get public signal feed,
    // authenticated users additionally get notifications, bots, arbitrage.

    // const socket = io(socketUrl, {
    //   path: '/socket.io/',
    //   auth: token ? { token } : {},
    //   transports: ['polling'],
    //   upgrade: false,
    //   reconnection: true,
    //   reconnectionDelay: 2000,
    //   reconnectionDelayMax: 10000,
    //   reconnectionAttempts: 10,
    //   timeout: 20000,
    //   autoConnect: true,
    // });

    const socket = io(socketUrl, {
  auth: token ? { token } : {},
  transports: ['websocket', 'polling'],  // Prefer WS, fallback to polling
  withCredentials: true,  // Enables credentials for CORS
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
  timeout: 60000,  // Increase to match backend/proxy (was 20000)
  autoConnect: true,
});

    socketRef.current = socket;

    // ── Connection ──────────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);

      // Join the correct signal room — anonymous always gets 'free'
      const role = localStorage.getItem('role') || 'user';
      const tier = token && (role === 'premium' || role === 'admin') ? 'premium' : 'free';
      socket.emit('join-signals', { tier });
      console.log(`📡 Joined signal room: signals:${tier}`);

      // Authenticated-only: personal room + unread count
      if (token && user?._id) {
        socket.emit('join-user-room', user._id);
        console.log(`📨 Joined room for user: ${user._id}`);
        dispatch(fetchUnreadCount());
      }
    });

   

    socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message, error.type, error.description);
});

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') socket.connect();
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');

      const role = localStorage.getItem('role') || 'user';
      const tier = token && (role === 'premium' || role === 'admin') ? 'premium' : 'free';
      socket.emit('join-signals', { tier });

      if (token && user?._id) {
        socket.emit('join-user-room', user._id);
        dispatch(fetchUnreadCount());
      }
    });

    socket.on('reconnect_attempt', (n) => console.log('🔄 Reconnection attempt:', n));
    socket.on('reconnect_error',   (e) => console.error('❌ Reconnection error:', e.message));
    socket.on('reconnect_failed',  ()  => console.error('❌ Reconnection failed'));
    socket.on('error',             (e) => console.error('❌ Socket error:', e));

    // ── Public signal events — always active (anonymous + authenticated) ────
    socket.on('new-signal', (signal) => {
      console.log('📡 New signal received:', signal.pair, signal.type);
      dispatch(addLiveSignal(signal));

      const isLong = signal.type === 'LONG';
      const pair   = (signal.pair || '').replace('USDT', '/USDT');
      const conf   = signal.confidenceScore ? Math.round(signal.confidenceScore * 100) : null;
      const market = signal.marketType ? ` · ${signal.marketType}` : '';

      const content = (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            {isLong ? '▲' : '▼'} {pair}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
            {signal.type}{market}{conf ? ` · ${conf}% conf` : ''}
          </div>
          {signal.delayedBy > 0 && (
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '3px' }}>
              ⚡ Upgrade for instant access
            </div>
          )}
        </div>
      );

      const toastOpts = { autoClose: 7000, toastId: `sig-${signal.pair}`, onClick: () => navigate('/signals'), style: { cursor: 'pointer' } };
      if (isLong) {
        toast.success(content, { ...toastOpts, icon: '📈' });
      } else {
        toast.error(content, { ...toastOpts, icon: '📉' });
      }
    });

    // Alpha live price broadcast — server pushes every 30s (replaces per-client HTTP polling)
    socket.on('alpha:prices', (prices) => {
      if (prices && typeof prices === 'object') {
        dispatch(updateAlphaLivePrices(prices));
      }
    });

    // Background TA sweep — populates Spot/Futures signal lists in real time
    socket.on('signals:sweep', (signals) => {
      if (!Array.isArray(signals) || signals.length === 0) return;
      console.log(`📡 Sweep: ${signals.length} signal(s) received`);
      signals.forEach(signal => dispatch(addLiveSignal(signal)));
      toast.info(
        `${signals.length} new signal${signals.length > 1 ? 's' : ''} — market sweep`,
        { autoClose: 4000, toastId: 'sweep-update', icon: '📊', onClick: () => navigate('/signals'), style: { cursor: 'pointer' } }
      );
    });

    // ── Authenticated-only events ───────────────────────────────────────────
    if (token && user) {
      socket.on('notification:new', (notification) => {
        console.log('🔔 New notification:', notification);
        dispatch(addNotification(notification));

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            badge: '/logo.png',
          });
        }
      });

      socket.on('notification:update', (notification) => {
        dispatch(updateNotification(notification));
      });

      socket.on('notification:delete', (notificationId) => {
        dispatch(removeNotification(notificationId));
      });

      socket.on('notification:read', ({ notificationId }) => {
        dispatch(updateNotification({ _id: notificationId, isRead: true }));
      });

      socket.on('notification:allRead', () => {
        dispatch(fetchUnreadCount());
      });

      // Arbitrage real-time updates
      socket.on('arbitrage:update', (data) => {
        dispatch(setLiveArbitrageOpportunities(data.opportunities || []));

        const opps = data.opportunities || [];
        const highProfit = opps.filter(o => (o.netProfitPercent || 0) >= 1);

        if (highProfit.length > 0) {
          const best = highProfit[0];
          toast.success(
            `🚨 ${best.symbol}: ${best.netProfitPercent.toFixed(2)}% profit — ${best.buyExchange} → ${best.sellExchange}`,
            { autoClose: 8000, toastId: 'arb-high-profit', onClick: () => navigate('/arbitrage'), style: { cursor: 'pointer' } }
          );
        } else if (opps.length > 0) {
          toast.info(
            `Arbitrage: ${opps.length} opportunit${opps.length === 1 ? 'y' : 'ies'} found`,
            { autoClose: 4000, toastId: 'arb-update', onClick: () => navigate('/arbitrage'), style: { cursor: 'pointer' } }
          );
        }
      });

      // Triangular arbitrage real-time updates
      socket.on('triangular:update', (data) => {
        dispatch(setLiveTriangularOpportunities(data));
        const opps = data.opportunities || [];
        if (opps.length > 0 && opps[0].netProfitPercent >= 0.5) {
          toast.info(
            `🔺 Triangular: ${opps[0].path?.join('→')} — ${opps[0].netProfitPercent.toFixed(3)}% net`,
            { autoClose: 5000, toastId: 'tri-arb-update', onClick: () => navigate('/arbitrage'), style: { cursor: 'pointer' } }
          );
        }
      });

      // Bot event handlers
      socket.on('bot:tick', (data) => {
        dispatch(updateBotRealtime(data));
      });

      socket.on('bot:trade', (data) => {
        const priceStr = data.price != null ? ` @ $${Number(data.price).toFixed(2)}` : '';
        const msg = `${data.botName}: ${(data.side || '').toUpperCase()} ${data.symbol}${priceStr}`;

        const botPath = data.botId ? `/bots/${data.botId}` : '/bots';
        const botOpts = { onClick: () => navigate(botPath), style: { cursor: 'pointer' } };
        if (data.triggerReason === 'entry') {
          toast.info(msg, { autoClose: 4000, ...botOpts });
        } else if (data.pnl != null) {
          if (data.pnl >= 0) {
            toast.success(`${msg} · PnL: +$${Number(data.pnl).toFixed(2)}`, { autoClose: 5000, ...botOpts });
          } else {
            toast.error(`${msg} · PnL: -$${Math.abs(data.pnl).toFixed(2)}`, { autoClose: 5000, ...botOpts });
          }
        } else {
          toast.info(msg, { autoClose: 4000, ...botOpts });
        }
      });

      socket.on('bot:paused', (data) => {
        const pausedPath = data.botId ? `/bots/${data.botId}` : '/bots';
        toast.warn(`Bot "${data.botName}" paused: ${data.reason}`, { autoClose: 8000, onClick: () => navigate(pausedPath), style: { cursor: 'pointer' } });
      });

      socket.on('bot:error', (data) => {
        const errPath = data.botId ? `/bots/${data.botId}` : '/bots';
        toast.error(`Bot "${data.botName}" error: ${data.error}`, { autoClose: 8000, onClick: () => navigate(errPath), style: { cursor: 'pointer' } });
      });
    }

    // Cleanup on unmount or auth change
    return () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up socket connection...');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user?._id, dispatch]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
