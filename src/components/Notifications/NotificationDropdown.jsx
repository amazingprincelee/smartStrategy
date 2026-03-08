import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, BellOff, TrendingUp, Bot, AlertTriangle, ShieldAlert, Megaphone, Landmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../redux/slices/userSlice';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get notifications from Redux store
  const { notifications, unreadCount, loading } = useSelector((state) => state.user);

  // Fetch notifications on mount
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ limit: 10 }));
    }
  }, [isOpen, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleDeleteNotification = (notificationId) => {
    dispatch(deleteNotification(notificationId));
  };

  const getNotificationMeta = (type) => {
    switch (type) {
      case 'bot_trade':
        return { Icon: Bot,           bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400' };
      case 'bot_paused':
        return { Icon: AlertTriangle,  bg: 'bg-amber-100 dark:bg-amber-900/30',  color: 'text-amber-600 dark:text-amber-400' };
      case 'bot_error':
        return { Icon: AlertTriangle,  bg: 'bg-red-100 dark:bg-red-900/30',      color: 'text-red-600 dark:text-red-400' };
      case 'arbitrage_alert':
        return { Icon: TrendingUp,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' };
      case 'security_alert':
        return { Icon: ShieldAlert,    bg: 'bg-red-100 dark:bg-red-900/30',      color: 'text-red-600 dark:text-red-400' };
      case 'platform_update':
      case 'maintenance_notice':
        return { Icon: Megaphone,      bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400' };
      default:
        return { Icon: Landmark,       bg: 'bg-gray-100 dark:bg-gray-800',       color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen
            ? 'bg-gray-200 dark:bg-dark-600'
            : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading.action}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-40"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[420px]">
            {loading.notifications ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400 dark:text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="p-4 bg-gray-100 dark:bg-dark-700 rounded-full">
                  <BellOff className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">You're all caught up</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bot trades, alerts and updates will appear here</p>
                </div>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  const { Icon, bg, color } = getNotificationMeta(notification.type);
                  const isUnread = !notification.isRead;
                  return (
                    <div
                      key={notification._id}
                      onClick={() => {
                        if (isUnread) handleMarkAsRead(notification._id);
                        if (notification.data?.actionUrl) {
                          setIsOpen(false);
                          navigate(notification.data.actionUrl);
                        }
                      }}
                      className={`group flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-dark-700/60 last:border-0 transition-colors ${
                        notification.data?.actionUrl ? 'cursor-pointer' : ''
                      } ${
                        isUnread
                          ? 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-dark-700/50'
                      }`}
                    >
                      {/* Icon bubble */}
                      <div className={`flex-shrink-0 p-2 rounded-lg ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${
                            isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-1 text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                            title="Mark as read"
                            disabled={loading.action}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Dismiss"
                          disabled={loading.action}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50">
            <button
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;