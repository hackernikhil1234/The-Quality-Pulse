// client/src/pages/Notifications.jsx - FIXED
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { 
  FaBell,
  FaEnvelope,
  FaExclamationCircle,
  FaCheckCircle,
  FaTrash,
  FaRedo,
  FaTimes,
  FaCheck,
  FaArrowLeft,
  FaCalendarAlt
} from 'react-icons/fa';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notifications/user/${user._id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      setNotifications([]);
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
      console.error('Error marking notification as read:', error);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
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

  const handleNotificationClick = async (notification) => {
    if (!notification.read && notification._id) {
      await markAsRead(notification._id);
    }
    
    // FIXED: Report notifications should go to ReportDetails.jsx
    if (notification.metadata?.reportId) {
      navigate(`/reports/${notification.metadata.reportId}`);
    } else if (notification.metadata?.siteId) {
      navigate(`/sites/${notification.metadata.siteId}`);
    } else if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const deleteNotification = async () => {
    if (!notificationToDelete?._id) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${notificationToDelete._id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationToDelete._id));
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/user/${user._id}/clear-all`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      alert('Failed to clear all notifications. Please try again.');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Navbar />
        
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Simple back button like in SiteDetails.jsx */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
              </div>
              
              {/* Actions moved to top */}
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 
                  text-white
                  hover:from-yellow-600 hover:to-yellow-700 
                  hover:shadow-lg hover:shadow-yellow-500/25
                  active:scale-[0.99] rounded-lg"
                >
                  <FaRedo />
                  Refresh
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FaCheckCircle />
                    Mark All as Read
                  </button>
                )}
                
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FaTrash />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards - Enhanced Gradient Backgrounds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Notifications Card */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm opacity-90 text-slate-700 dark:text-slate-300">Total Notifications</p>
                  <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{notifications.length}</p>
                </div>
                <FaBell className="text-3xl opacity-80 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            {/* Unread Notifications Card */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm opacity-90 text-slate-700 dark:text-slate-300">Unread</p>
                  <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{unreadCount}</p>
                </div>
                <FaEnvelope className="text-3xl opacity-80 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            {/* Read Notifications Card */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm opacity-90 text-slate-700 dark:text-slate-300">Read</p>
                  <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{readCount}</p>
                </div>
                <FaCheckCircle className="text-3xl opacity-80 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Filters Only */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Filters
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setFilter('all')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      filter === 'all' 
                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <span className="text-gray-700 dark:text-gray-300">All Notifications</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                      {notifications.length}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setFilter('unread')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      filter === 'unread' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Unread</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                      {unreadCount}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setFilter('read')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      filter === 'read' 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">Read</span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm rounded-full">
                      {readCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Notifications List */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {filter === 'all' ? 'All Notifications' : 
                     filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Showing {filteredNotifications.length} of {notifications.length} notifications
                  </p>
                </div>
                
                {/* Notifications List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                      <button
                        onClick={fetchNotifications}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaBell className="w-10 h-10 text-purple-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {filter === 'all' ? 'No notifications yet' : 
                         filter === 'unread' ? 'No unread notifications' : 'No read notifications'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        {filter === 'all' 
                          ? 'When you receive notifications, they will appear here.' 
                          : 'Try changing your filter to see more notifications.'}
                      </p>
                      {filter !== 'all' && (
                        <button
                          onClick={() => setFilter('all')}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
                        >
                          View all notifications
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                          !notification.read 
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Notification Content - Clickable area */}
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800 dark:text-white">
                                  {notification.title || 'Notification'}
                                </h4>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <FaCalendarAlt className="text-xs" />
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Simple Action Buttons */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="p-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow hover:shadow-lg transition-all duration-300"
                                title="Mark as read"
                              >
                                <FaCheck className="text-sm" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotificationToDelete(notification);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow hover:shadow-lg transition-all duration-300"
                              title="Delete notification"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Simple Bottom Info */}
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Notifications are automatically cleared after 30 days.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && notificationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FaTrash className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Delete Notification
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this notification?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setNotificationToDelete(null);
                  }}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteNotification}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}