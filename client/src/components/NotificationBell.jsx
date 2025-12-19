// client/src/components/NotificationBell.jsx - FIXED NAVIGATION
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaCheckCircle, FaRedo } from 'react-icons/fa';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user && user._id) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notifications/user/${user._id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/user/${user._id}/mark-all-read`, {}, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  // FIXED NAVIGATION: Report notifications go to ReportDetails.jsx
  const handleNotificationClick = async (notification) => {
    if (!notification.read && notification._id) {
      await markAsRead(notification._id);
    }
    
    setOpen(false);
    
    if (notification.metadata?.reportId) {
      navigate(`/reports/${notification.metadata.reportId}`);
    } else if (notification.metadata?.siteId) {
      navigate(`/sites/${notification.metadata.siteId}`);
    } else if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (notification) => {
    const type = notification.type || '';
    
    if (type.includes('site')) {
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      );
    }
    
    if (type.includes('report')) {
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      </div>
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors group"
        aria-label="Notifications"
      >
        <div className="relative">
          <FaBell className="w-6 h-6 transition-transform group-hover:scale-110" />
          
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium border-2 border-white dark:border-gray-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </div>
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transform transition-all duration-200 origin-top-right">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchNotifications}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Refresh"
                >
                  <FaRedo className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBell className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">No notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentNotifications.map((notification, index) => (
                  <div
                    key={notification._id || index}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      {getNotificationIcon(notification)}
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {notification.title || 'Notification'}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                            aria-label="Mark as read"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="text-sm font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                View all notifications
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {notifications.length} total
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}