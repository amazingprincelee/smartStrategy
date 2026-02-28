import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { setLiveArbitrageOpportunities } from '../../redux/slices/arbitrageslice';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!token || !user) {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket - no auth');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    console.log('🔄 Initializing socket connection...');

    // Derive socket server origin (strip /api suffix if present)
    const apiUrl = import.meta.env.VITE_LOCAL_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = new URL(apiUrl).origin;

    // Initialize socket connection
    const socket = io(socketUrl, {
      path: '/socket.io/', // Default Socket.io path
      auth: {
        token,
      },
      transports: ['polling', 'websocket'], // polling first — avoids WS upgrade spam in dev
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);

      // Join user's personal room
      if (user?._id) {
        socket.emit('join-user-room', user._id);
        console.log(`📨 Joined room for user: ${user._id}`);
      }

      // Join the correct signal tier room
      // Premium / Admin users get instant signals; others get 5-min delayed
      const role = localStorage.getItem('role') || 'user';
      const tier = (role === 'premium' || role === 'admin') ? 'premium' : 'free';
      socket.emit('join-signals', { tier });
      console.log(`📡 Joined signal room: signals:${tier}`);

      // Fetch initial unread count
      dispatch(fetchUnreadCount());
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      
      // More detailed error logging
      if (error.message.includes('Invalid namespace')) {
        console.error('⚠️ Invalid namespace error - check backend Socket.io setup');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');

      // Rejoin user's personal room
      if (user?._id) {
        socket.emit('join-user-room', user._id);
      }

      // Rejoin signal tier room
      const role = localStorage.getItem('role') || 'user';
      const tier = (role === 'premium' || role === 'admin') ? 'premium' : 'free';
      socket.emit('join-signals', { tier });

      dispatch(fetchUnreadCount());
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - max attempts reached');
    });

    // Notification event handlers
    socket.on('notification:new', (notification) => {
      console.log('🔔 New notification:', notification);
      dispatch(addNotification(notification));
      
      // Optional: Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      }
    });

    socket.on('notification:update', (notification) => {
      console.log('🔄 Notification updated:', notification);
      dispatch(updateNotification(notification));
    });

    socket.on('notification:delete', (notificationId) => {
      console.log('🗑️ Notification deleted:', notificationId);
      dispatch(removeNotification(notificationId));
    });

    socket.on('notification:read', ({ notificationId }) => {
      console.log('✅ Notification marked as read:', notificationId);
      dispatch(updateNotification({ _id: notificationId, read: true }));
    });

    socket.on('notification:allRead', () => {
      console.log('✅ All notifications marked as read');
      dispatch(fetchUnreadCount());
    });

    // Live signal events
    socket.on('new-signal', (signal) => {
      console.log('📡 New signal received:', signal.pair, signal.type);

      // Add to the redux store
      dispatch(addLiveSignal(signal));

      // Show toast notification
      const isLong  = signal.type === 'LONG';
      const icon    = isLong ? '📈' : '📉';
      const conf    = signal.confidenceScore ? ` (${(signal.confidenceScore * 100).toFixed(0)}%)` : '';
      const delayed = signal.delayedBy > 0 ? ' — upgrade for instant signals' : '';
      const msg     = `${icon} ${signal.type} ${signal.pair}${conf}${delayed}`;

      if (isLong) {
        toast.success(msg, { autoClose: 8000 });
      } else {
        toast.error(msg, { autoClose: 8000 });
      }
    });

    // Background TA sweep results — populate Spot/Futures signal tabs
    socket.on('signals:sweep', (signals) => {
      if (!Array.isArray(signals) || signals.length === 0) return;
      console.log(`📡 Sweep: ${signals.length} signal(s) received`);
      signals.forEach(signal => dispatch(addLiveSignal(signal)));
      toast.info(
        `${signals.length} new signal${signals.length > 1 ? 's' : ''} from market sweep`,
        { autoClose: 5000, toastId: 'sweep-update' }
      );
    });

    // Arbitrage real-time updates (pushed after every background scan)
    socket.on('arbitrage:update', (data) => {
      dispatch(setLiveArbitrageOpportunities(data.opportunities || []));
      if ((data.opportunities?.length || 0) > 0) {
        toast.info(
          `Arbitrage: ${data.opportunities.length} opportunit${data.opportunities.length === 1 ? 'y' : 'ies'} found`,
          { autoClose: 4000, toastId: 'arb-update' } // toastId prevents spam
        );
      }
    });

    // Bot event handlers
    socket.on('bot:tick', (data) => {
      // data: { botId, botName, symbol, currentPrice, openPositions, stats, status }
      dispatch(updateBotRealtime(data));
    });

    socket.on('bot:trade', (data) => {
      // data: { botId, botName, symbol, side, price, amount, pnl, triggerReason }
      const priceStr = data.price != null ? ` @ $${Number(data.price).toFixed(2)}` : '';
      const msg = `${data.botName}: ${(data.side || '').toUpperCase()} ${data.symbol}${priceStr}`;

      if (data.triggerReason === 'entry') {
        toast.info(msg, { autoClose: 4000 });
      } else if (data.pnl != null) {
        if (data.pnl >= 0) {
          toast.success(`${msg} · PnL: +$${Number(data.pnl).toFixed(2)}`, { autoClose: 5000 });
        } else {
          toast.error(`${msg} · PnL: -$${Math.abs(data.pnl).toFixed(2)}`, { autoClose: 5000 });
        }
      } else {
        toast.info(msg, { autoClose: 4000 });
      }
    });

    socket.on('bot:paused', (data) => {
      // data: { botId, botName, reason }
      toast.warn(`Bot "${data.botName}" paused: ${data.reason}`, { autoClose: 8000 });
    });

    socket.on('bot:error', (data) => {
      // data: { botId, botName, error }
      toast.error(`Bot "${data.botName}" error: ${data.error}`, { autoClose: 8000 });
    });

    // Error handler
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Cleanup on unmount or when dependencies change
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