import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaUserTie,
  FaHardHat,
  FaChartBar,
  FaEye,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFileAlt,
  FaSearch,
  FaFilter,
  FaExclamationCircle,
  FaCheck,
  FaTimes,
  FaUserCheck,
  FaUserTimes,
  FaBuilding,
  FaClipboardCheck,
  FaChartLine,
  FaIdBadge,
  FaStar,
  FaDownload,
  FaInfoCircle,
  FaExclamationTriangle,
  FaExpandAlt,
  FaList,
  FaCalendarTimes,
  FaArrowLeft
} from 'react-icons/fa';

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalEngineers: 0,
    activeSites: 0,
    totalReports: 0,
    pendingReports: 0
  });
  
  // Modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [selectedEngineerForAction, setSelectedEngineerForAction] = useState(null);
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [showEngineerDetailsModal, setShowEngineerDetailsModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      toast.error('Please login first');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }
    
    if (user.role !== 'Admin') {
      toast.error('Access denied. Admin privileges required.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      fetchEngineers();
      fetchStats();
    }
  }, [user, loading]);

  const fetchEngineers = async () => {
    try {
      setDataLoading(true);
      const response = await api.get('/admin/engineers');
      setEngineers(response.data);
      setStats(prev => ({ ...prev, totalEngineers: response.data.length }));
    } catch (error) {
      console.error('Error fetching engineers:', error);
      toast.error('Failed to load engineers');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEngineerSelect = async (engineer) => {
    try {
      const response = await api.get(`/admin/engineers/${engineer._id}/details`);
      setSelectedEngineer(response.data);
      setShowEngineerDetailsModal(true);
    } catch (error) {
      console.error('Error fetching engineer details:', error);
      toast.error('Failed to load engineer details');
    }
  };

  const openDeactivateModal = (engineer, e) => {
    if (e) e.stopPropagation();
    setSelectedEngineerForAction(engineer);
    setDeactivateReason('');
    setShowDeactivateModal(true);
  };

  const handleDeactivateEngineer = async () => {
    if (!selectedEngineerForAction) return;
    
    if (!deactivateReason.trim()) {
      toast.error('Please provide a reason for deactivation');
      return;
    }

    try {
      const engineerId = selectedEngineerForAction._id;
      
      // Call API to deactivate with reason
      await api.put(`/admin/engineers/${engineerId}/deactivate`, { 
        reason: deactivateReason,
        deactivatedBy: user._id
      });
      
      // Send notification to engineer
      await api.post('/notifications/send', {
        userId: engineerId,
        title: 'Account Deactivated',
        message: `Your account has been deactivated by ${user.name}. Reason: ${deactivateReason}`,
        type: 'warning',
        priority: 'high'
      });
      
      // Update local state
      setEngineers(engineers.map(e => 
        e._id === engineerId ? { ...e, isActive: false } : e
      ));
      
      if (selectedEngineer && selectedEngineer._id === engineerId) {
        setSelectedEngineer({ ...selectedEngineer, isActive: false });
      }
      
      toast.success(`Engineer deactivated successfully. Notification sent.`);
      setShowDeactivateModal(false);
      setDeactivateReason('');
      setSelectedEngineerForAction(null);
    } catch (error) {
      console.error('Error deactivating engineer:', error);
      toast.error('Failed to deactivate engineer');
    }
  };

  const handleActivateEngineer = async (engineerId, e) => {
    if (e) e.stopPropagation();
    
    try {
      await api.put(`/admin/engineers/${engineerId}/activate`, { 
        activatedBy: user._id
      });
      
      // Send notification to engineer
      await api.post('/notifications/send', {
        userId: engineerId,
        title: 'Account Activated',
        message: `Your account has been activated by ${user.name}. You can now access all features.`,
        type: 'success',
        priority: 'high'
      });
      
      setEngineers(engineers.map(e => 
        e._id === engineerId ? { ...e, isActive: true } : e
      ));
      
      if (selectedEngineer && selectedEngineer._id === engineerId) {
        setSelectedEngineer({ ...selectedEngineer, isActive: true });
      }
      
      toast.success(`Engineer activated successfully. Notification sent.`);
    } catch (error) {
      console.error('Error activating engineer:', error);
      toast.error('Failed to activate engineer');
    }
  };

  const handleDeleteEngineer = async (engineerId, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this engineer? This will:\n• Remove them from all assigned sites\n• Archive their reports\n• Permanently delete their account\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/engineers/${engineerId}`);
      setEngineers(engineers.filter(e => e._id !== engineerId));
      
      if (selectedEngineer && selectedEngineer._id === engineerId) {
        setSelectedEngineer(null);
        setShowEngineerDetailsModal(false);
      }
      
      toast.success('Engineer deleted successfully');
    } catch (error) {
      console.error('Error deleting engineer:', error);
      toast.error('Failed to delete engineer');
    }
  };

  const viewAllSites = (engineer, e) => {
    if (e) e.stopPropagation();
    setSelectedEngineer(engineer);
    setShowSitesModal(true);
  };

  const filteredEngineers = engineers.filter(engineer => {
    const matchesSearch = 
      engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && engineer.isActive) ||
      (statusFilter === 'inactive' && !engineer.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[isActive ? 'active' : 'inactive']}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getDefaultAvatar = (name) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-red-500 to-red-600',
      'bg-gradient-to-r from-yellow-500 to-yellow-600'
    ];
    const colorIndex = name?.charCodeAt(0) % colors.length || 0;
    return colors[colorIndex];
  };

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <div className="mt-4 text-gray-600 dark:text-gray-400">Loading authentication...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is logged in and is admin
  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 text-xl mb-4">Please login to access this page</div>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'Admin') {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 text-xl mb-4">Access Denied</div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  Admin privileges are required to access this page
                </div>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Navbar />
        
        <div className="p-6">
          {/* Header with Back Button */}
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 mt-6 p-2 rounded-lg transition-all duration-200 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                text-yellow-600 dark:text-yellow-500 
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                hover:text-yellow-700 dark:hover:text-yellow-400"
              title="Go back"
            >
              <FaArrowLeft className="text-lg" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                  <FaUsers className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Panel</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage engineers, sites, and monitor platform activities
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Logged in as: {user.name} ({user.email}) - Role: {user.role}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Engineers',
                value: stats.totalEngineers,
                icon: FaUserTie,
                gradient: "from-blue-500 via-blue-600 to-blue-700",
                shadow: "shadow-blue-500/30",
                hoverShadow: "hover:shadow-blue-500/40",
                lightShadow: "shadow-lg shadow-blue-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-blue-500/30",
                trend: `${engineers.length > 0 ? Math.round((engineers.filter(e => e.isActive).length / engineers.length) * 100) : 0}% active`,
                subtext: 'Managing quality assurance'
              },
              {
                title: 'Active Sites',
                value: stats.activeSites,
                icon: FaHardHat,
                gradient: "from-green-500 via-green-600 to-emerald-700",
                shadow: "shadow-green-500/30",
                hoverShadow: "hover:shadow-green-500/40",
                lightShadow: "shadow-lg shadow-green-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-green-500/30",
                trend: 'Active',
                subtext: 'Currently operational'
              },
              {
                title: 'Total Reports',
                value: stats.totalReports,
                icon: FaFileAlt,
                gradient: "from-purple-500 via-purple-600 to-purple-700",
                shadow: "shadow-purple-500/30",
                hoverShadow: "hover:shadow-purple-500/40",
                lightShadow: "shadow-lg shadow-purple-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-purple-500/30",
                trend: 'All time',
                subtext: 'Quality reports generated'
              },
              {
                title: 'Pending Reports',
                value: stats.pendingReports,
                icon: FaExclamationCircle,
                gradient: "from-amber-500 via-amber-600 to-orange-700",
                shadow: "shadow-amber-500/30",
                hoverShadow: "hover:shadow-amber-500/40",
                lightShadow: "shadow-lg shadow-amber-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-amber-500/30",
                trend: stats.pendingReports > 0 ? 'Attention' : 'Clear',
                subtext: 'Awaiting review'
              }
            ].map((kpi, index) => (
              <div 
                key={kpi.title} 
                className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 ${kpi.lightShadow} hover:${kpi.lightHoverShadow} transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30`}
              >
                {/* Enhanced gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                  <kpi.icon className="text-6xl text-slate-400 dark:text-slate-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">{kpi.title}</p>
                      <h3 className="text-3xl font-bold mt-2">{kpi.value}</h3>
                    </div>
                    <div className={`p-3 bg-gradient-to-br ${kpi.gradient} rounded-xl ${kpi.lightShadow}`}>
                      <kpi.icon className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Engineers List */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Assigned Engineers</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search engineers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredEngineers.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No engineers found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Engineer</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Contact</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Sites</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEngineers.map((engineer) => (
                          <tr 
                            key={engineer._id}
                            className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                              selectedEngineer?._id === engineer._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => handleEngineerSelect(engineer)}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {engineer.avatar ? (
                                  <img
                                    src={engineer.avatar}
                                    alt={engineer.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getDefaultAvatar(engineer.name)}`}>
                                    {engineer.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">{engineer.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{engineer.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-800 dark:text-white">{engineer.email}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{engineer.phone || 'No phone'}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <FaBuilding className="text-gray-400" />
                                <span className="text-gray-800 dark:text-white">
                                  {engineer.assignedSites?.length || engineer.siteCount || 0}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(engineer.isActive)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEngineerSelect(engineer);
                                  }}
                                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                
                                {engineer.isActive ? (
                                  <button
                                    onClick={(e) => openDeactivateModal(engineer, e)}
                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                    title="Deactivate Engineer"
                                  >
                                    <FaUserTimes />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => handleActivateEngineer(engineer._id, e)}
                                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                    title="Activate Engineer"
                                  >
                                    <FaUserCheck />
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => handleDeleteEngineer(engineer._id, e)}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                  title="Delete Engineer"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Audit Logs Section */}
              <div className="card p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Activities</h2>
                <div className="space-y-4">
                  {stats.recentActivities?.slice(0, 3).map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FaClipboardCheck className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-800 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.engineer} • {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        activity.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No recent activities</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.href = '/engineers/add'}
                    className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FaUserTie />
                    Add New Engineer
                  </button>
                  <button 
                    onClick={() => window.location.href = '/sites'}
                    className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FaHardHat />
                    Manage Sites
                  </button>
                  <button 
                    onClick={() => window.location.href = '/reports'}
                    className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FaChartBar />
                    View All Reports
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">System Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <FaCheckCircle className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Platform Status</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">All systems operational</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm">
                      Online
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FaUsers className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Active Engineers</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {engineers.filter(e => e.isActive).length} of {engineers.length}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm">
                      {engineers.length > 0 ? Math.round((engineers.filter(e => e.isActive).length / engineers.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engineer Details Modal */}
      {showEngineerDetailsModal && selectedEngineer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <FaUserTie className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Engineer Details</h2>
                  <p className="text-gray-600 dark:text-gray-400">Complete information and statistics</p>
                </div>
              </div>
              <button
                onClick={() => setShowEngineerDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Profile Section */}
                <div className="md:col-span-1">
                  <div className="text-center">
                    {selectedEngineer.avatar ? (
                      <img
                        src={selectedEngineer.avatar}
                        alt={selectedEngineer.name}
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl ${getDefaultAvatar(selectedEngineer.name)}`}>
                        {selectedEngineer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{selectedEngineer.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedEngineer.role}</p>
                    {getStatusBadge(selectedEngineer.isActive)}
                    
                    {!selectedEngineer.isActive && selectedEngineer.deactivationInfo && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <FaExclamationTriangle />
                          <span className="text-sm font-medium">Account Deactivated</span>
                        </div>
                        <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                          Reason: {selectedEngineer.deactivationInfo.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          By: {selectedEngineer.deactivationInfo.deactivatedByName} • {new Date(selectedEngineer.deactivationInfo.deactivatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaEnvelope className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
                          <p className="text-gray-800 dark:text-white font-medium">{selectedEngineer.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaPhone className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                          <p className="text-gray-800 dark:text-white font-medium">{selectedEngineer.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                          <p className="text-gray-800 dark:text-white font-medium">
                            {new Date(selectedEngineer.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaIdBadge className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                          <p className="text-gray-800 dark:text-white font-medium">
                            {selectedEngineer.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Sites Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">Assigned Sites</h4>
                  {selectedEngineer.assignedSites?.length > 6 && (
                    <button
                      onClick={() => {
                        setShowEngineerDetailsModal(false);
                        setShowSitesModal(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <FaExpandAlt />
                      View All Sites
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedEngineer.assignedSites?.slice(0, 6).map((site, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-bold text-gray-800 dark:text-white">{site.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{site.location}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          site.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          site.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {site.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Site</span>
                        </div>
                        {site.progress !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${site.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-800 dark:text-white font-medium">{site.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedEngineer.assignedSites?.length > 6 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        setShowEngineerDetailsModal(false);
                        setShowSitesModal(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2 mx-auto"
                    >
                      <FaList />
                      Show {selectedEngineer.assignedSites.length - 6} more sites
                    </button>
                  </div>
                )}
              </div>

              {/* Report Statistics */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Performance Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      title: 'Total Reports',
                      value: selectedEngineer.reportStats?.total || 0,
                      icon: FaFileAlt,
                      gradient: "from-blue-500 via-blue-600 to-blue-700",
                      lightShadow: "shadow-lg shadow-blue-500/20",
                      lightHoverShadow: "hover:shadow-2xl hover:shadow-blue-500/30"
                    },
                    {
                      title: 'This Month',
                      value: selectedEngineer.reportStats?.thisMonth || 0,
                      icon: FaCalendarAlt,
                      gradient: "from-green-500 via-green-600 to-emerald-700",
                      lightShadow: "shadow-lg shadow-green-500/20",
                      lightHoverShadow: "hover:shadow-2xl hover:shadow-green-500/30"
                    },
                    {
                      title: 'Pass Rate',
                      value: selectedEngineer.reportStats?.passRate || '0%',
                      icon: FaChartLine,
                      gradient: "from-amber-500 via-amber-600 to-orange-700",
                      lightShadow: "shadow-lg shadow-amber-500/20",
                      lightHoverShadow: "hover:shadow-2xl hover:shadow-amber-500/30"
                    },
                    {
                      title: 'Compliance',
                      value: selectedEngineer.complianceScore || '0%',
                      icon: FaCheckCircle,
                      gradient: "from-purple-500 via-purple-600 to-purple-700",
                      lightShadow: "shadow-lg shadow-purple-500/20",
                      lightHoverShadow: "hover:shadow-2xl hover:shadow-purple-500/30"
                    }
                  ].map((stat, index) => (
                    <div 
                      key={stat.title} 
                      className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 ${stat.lightShadow} hover:${stat.lightHoverShadow} transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30`}
                    >
                      {/* Enhanced gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
                      <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                        <stat.icon className="text-4xl text-slate-400 dark:text-slate-600" />
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-sm opacity-90">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent Reports</h4>
                <div className="space-y-3">
                  {selectedEngineer.recentActivities?.slice(0, 5).map((activity, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.site}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(activity.date).toLocaleDateString()} • {activity.materialTested}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            activity.result === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {activity.result}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            activity.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No recent reports</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEngineerDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              {selectedEngineer.isActive ? (
                <button
                  onClick={() => {
                    setShowEngineerDetailsModal(false);
                    openDeactivateModal(selectedEngineer);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <FaUserTimes />
                  Deactivate Engineer
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    setShowEngineerDetailsModal(false);
                    handleActivateEngineer(selectedEngineer._id, e);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FaUserCheck />
                  Activate Engineer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Engineer Modal */}
      {showDeactivateModal && selectedEngineerForAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Deactivate Engineer</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Are you sure you want to deactivate this engineer?</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {selectedEngineerForAction.avatar ? (
                    <img
                      src={selectedEngineerForAction.avatar}
                      alt={selectedEngineerForAction.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getDefaultAvatar(selectedEngineerForAction.name)}`}>
                      {selectedEngineerForAction.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedEngineerForAction.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEngineerForAction.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for deactivation *
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Provide a reason for deactivation..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">What happens when deactivated:</p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 space-y-1">
                      <li>• Engineer cannot log into the platform</li>
                      <li>• Access to assigned sites will be suspended</li>
                      <li>• Cannot submit new reports</li>
                      <li>• Engineer will receive a notification</li>
                      <li>• Account can be reactivated anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateReason('');
                  setSelectedEngineerForAction(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateEngineer}
                disabled={!deactivateReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaUserTimes />
                Deactivate Engineer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Sites Modal */}
      {showSitesModal && selectedEngineer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <FaBuilding className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Assigned Sites</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedEngineer.name} is assigned to {selectedEngineer.assignedSites?.length || 0} sites
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSitesModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {selectedEngineer.assignedSites?.map((site, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/10 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{site.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{site.location}</p>
                        {site.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{site.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        site.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        site.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {site.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                        <p className="text-gray-800 dark:text-white font-medium">
                          {new Date(site.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {site.endDate && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">End Date</p>
                          <p className="text-gray-800 dark:text-white font-medium">
                            {new Date(site.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {site.progress !== undefined && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${site.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-800 dark:text-white font-medium">{site.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
              <button
                onClick={() => setShowSitesModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}