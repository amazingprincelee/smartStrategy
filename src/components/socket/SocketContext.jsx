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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
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
      
      // Rejoin user's room and refresh data
      if (user?._id) {
        socket.emit('join-user-room', user._id);
      }
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