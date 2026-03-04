import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'vault_created':
        return '🏦';
      case 'deposit':
      case 'deposit_confirmed':
        return '💰';
      case 'withdrawal':
      case 'withdrawal_confirmed':
        return '💸';
      case 'vault_unlocked':
      case 'vault_matured':
        return '🔓';
      case 'system':
      case 'system_maintenance':
        return '⚙️';
      case 'security_alert':
        return '🔒';
      case 'announcement':
        return '📢';
      case 'arbitrage_alert':
        return '📈';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'vault_created':
        return 'text-blue-600';
      case 'deposit':
      case 'deposit_confirmed':
        return 'text-green-600';
      case 'withdrawal':
      case 'withdrawal_confirmed':
        return 'text-orange-600';
      case 'vault_unlocked':
      case 'vault_matured':
        return 'text-purple-600';
      case 'system':
      case 'system_maintenance':
        return 'text-gray-600';
      case 'security_alert':
        return 'text-red-600';
      case 'announcement':
        return 'text-blue-600';
      case 'arbitrage_alert':
        return 'text-emerald-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 transition-colors bg-gray-100 rounded-lg dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80 dark:bg-dark-800 dark:border-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                disabled={loading.action}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-96">
            {loading.notifications ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 mx-auto border-2 rounded-full spinner border-primary-600 border-t-transparent animate-spin" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      if (!notification.read) handleMarkAsRead(notification._id);
                      if (notification.actionUrl) {
                        setIsOpen(false);
                        navigate(notification.actionUrl);
                      }
                    }}
                    className={`p-4 transition-colors ${
                      notification.actionUrl ? 'cursor-pointer' : ''
                    } hover:bg-gray-50 dark:hover:bg-dark-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-900 dark:text-white ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-1 text-gray-400 transition-colors hover:text-green-600 disabled:opacity-50"
                            title="Mark as read"
                            disabled={loading.action}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="p-1 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                          title="Delete notification"
                          disabled={loading.action}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-dark-700 flex items-center justify-between gap-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all notifications
            </Link>
            {notifications.length > 0 && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;