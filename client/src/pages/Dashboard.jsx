import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaHardHat,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserTie,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaArrowRight,
  FaChartBar,
  FaTachometerAlt,
  FaRegCalendarCheck,
  FaUserPlus,
  FaTools,
  FaIdCard,
  FaClipboardList,
  FaStar,
  FaShieldAlt,
  FaQrcode,
  FaChartPie,
  FaThumbsUp,
  FaThumbsDown,
  FaSync,
  FaCalendarWeek,
  FaUserCheck,
  FaUserClock,
  FaCheckDouble,
  FaPercentage,
  FaChartArea,
  FaHistory,
  FaClipboard,
  FaUserTimes,
  FaUserEdit,
  FaCalendarTimes,
  FaArrowUp,
  FaArrowDown,
  FaPlusCircle,
  FaEye,
  FaList,
  FaEyeSlash,
  FaCrown,
  FaCalendarCheck
} from 'react-icons/fa';

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [assignedSites, setAssignedSites] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setDashboardLoading(true);
      try {
        // Fetch dashboard statistics
        const statsResponse = await api.get('/dashboard/stats');
        setStats(statsResponse.data);

        // Fetch recent activities
        const activitiesResponse = await api.get('/dashboard/activities');
        setActivities(activitiesResponse.data);

        // Fetch engineer-specific data
        if (user.role === 'Engineer') {
          const reportsResponse = await api.get('/dashboard/recent-reports');
          setRecentReports(reportsResponse.data);
          
          const sitesResponse = await api.get('/dashboard/assigned-sites');
          setAssignedSites(sitesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
        
        // Set empty state
        setStats({
          totalSites: 0,
          totalReports: 0,
          pendingReports: 0,
          activeEngineers: 0,
          complianceRate: '0%',
          approvalRate: '0%'
        });
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getIconForActivity = (icon) => {
    const iconProps = { className: "text-xl" };
    switch(icon) {
      case 'check': return <FaCheckCircle {...iconProps} className="text-green-500" />;
      case 'times': return <FaExclamationTriangle {...iconProps} className="text-red-500" />;
      case 'clock': return <FaClock {...iconProps} className="text-yellow-500" />;
      case 'building': return <FaBuilding {...iconProps} className="text-blue-500" />;
      case 'user-plus': return <FaUserPlus {...iconProps} className="text-purple-500" />;
      case 'user-check': return <FaUserCheck {...iconProps} className="text-green-500" />;
      case 'user-times': return <FaUserTimes {...iconProps} className="text-red-500" />;
      case 'user-edit': return <FaUserEdit {...iconProps} className="text-blue-500" />;
      case 'file-alt': return <FaFileAlt {...iconProps} className="text-indigo-500" />;
      default: return <FaClipboardCheck {...iconProps} className="text-slate-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'success': return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10';
      case 'error': return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active':
      case 'Approved':
      case 'Compliant':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Rejected':
      case 'Non-Compliant':
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const handleNavigation = async (path) => {
    navigate(path);
  };

  const renderAdminDashboard = () => (
    <>
      {/* Admin Stats Cards - Modern Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sites */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaBuilding className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-500/30">
                <FaBuilding className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total Sites</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalSites || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaChartLine className="mr-2 text-blue-500" />
              <span>Managed by you</span>
            </div>
          </div>
        </div>

        {/* Total Reports */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaFileAlt className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-lg shadow-lg shadow-green-500/30">
                <FaFileAlt className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total Reports</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalReports || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaChartPie className="mr-2 text-green-500" />
              <span>All submitted reports</span>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaExclamationTriangle className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 rounded-lg shadow-lg shadow-amber-500/30">
                <FaExclamationTriangle className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Pending Reviews</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.pendingReports || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaClock className="mr-2 text-amber-500" />
              <span>Awaiting approval</span>
            </div>
          </div>
        </div>

        {/* Active Engineers */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaUserTie className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-lg shadow-lg shadow-purple-500/30">
                <FaUserTie className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Active Engineers</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.activeEngineers || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaUserCheck className="mr-2 text-purple-500" />
              <span>Currently active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance Rate */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-green-500/10">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-r-xl"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg shadow-green-500/30">
                <FaCheckDouble className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Compliance Rate</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quality standards met</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-green-600 dark:text-green-400">
                {stats?.complianceRate || '0%'}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000" 
              style={{ 
                width: stats?.complianceRate ? 
                  `min(${parseFloat(stats.complianceRate)}%, 100%)` : '0%' 
              }}
            ></div>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-blue-500/10">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-xl"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                <FaThumbsUp className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Approval Rate</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Reports approved</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {stats?.approvalRate || '0%'}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000" 
              style={{ 
                width: stats?.approvalRate ? 
                  `min(${parseFloat(stats.approvalRate)}%, 100%)` : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Manage Engineers",
            description: "View and manage all engineers",
            icon: FaUsers,
            gradient: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
            path: "/admin"
          },
          {
            title: "All Sites",
            description: "Monitor construction sites",
            icon: FaBuilding,
            gradient: "from-green-500 to-green-600",
            shadow: "shadow-green-500/20",
            path: "/sites"
          },
          {
            title: "Review Reports",
            description: "Approve or reject reports",
            icon: FaClipboardCheck,
            gradient: "from-purple-500 to-purple-600",
            shadow: "shadow-purple-500/20",
            path: "/reports"
          },
          {
            title: "Analytics",
            description: "Platform insights & trends",
            icon: FaChartBar,
            gradient: "from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
            path: "/analytics"
          }
        ].map((action, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(action.path)}
            className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30 ${action.shadow} hover:shadow-yellow-500/20`}
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
              <action.icon className="text-6xl text-slate-400 dark:text-slate-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${action.shadow}`}>
                  <action.icon className="text-2xl text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors duration-300">{action.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{action.description}</p>
                </div>
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors duration-300">
                <span>Go to Panel</span>
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activities and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                  <FaHistory className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activities</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Latest platform activities</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className={`p-4 rounded-xl ${getTypeColor(activity.type)} hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm shadow-slate-300/30 dark:shadow-slate-700/30">
                        {getIconForActivity(activity.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <FaUserTie className="text-xs" />
                            {activity.user}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-500">•</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <FaCalendarAlt className="text-xs" />
                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      {activity.details?.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.details.status)} shadow-sm`}>
                          {activity.details.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FaClipboard className="text-2xl text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">No recent activities</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Activities will appear here as they happen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-green-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg shadow-green-500/30">
                <FaTachometerAlt className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Status</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Platform performance</p>
              </div>
            </div>
            <div className="space-y-4">
              {/* Platform Status */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800/30 shadow-sm shadow-green-200/50 dark:shadow-green-800/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Platform Status</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">All systems operational</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium rounded-full shadow-sm shadow-green-200/50">
                    Online
                  </span>
                </div>
              </div>

              {/* Reports This Week */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm shadow-blue-200/50 dark:shadow-blue-800/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCalendarWeek className="text-blue-600 dark:text-blue-400 text-xl" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Reports This Week</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Last 7 days</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.thisWeekReports || 0}
                  </span>
                </div>
              </div>

              {/* Response Time */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-sm shadow-purple-200/50 dark:shadow-purple-800/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaUserClock className="text-purple-600 dark:text-purple-400 text-xl" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Avg. Response Time</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Report review</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.averageResponseTime || '24h'}
                  </span>
                </div>
              </div>

              {/* Recent Sites */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl border border-amber-200 dark:border-amber-800/30 shadow-sm shadow-amber-200/50 dark:shadow-amber-800/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaBuilding className="text-amber-600 dark:text-amber-400 text-xl" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Recent Sites</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Last 30 days</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats?.recentSites || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderEngineerDashboard = () => (
    <>
      {/* Engineer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Assigned Sites */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaHardHat className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-500/30">
                <FaHardHat className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Assigned Sites</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.assignedSites || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaMapMarkerAlt className="mr-2 text-blue-500" />
              <span>Under your supervision</span>
            </div>
          </div>
        </div>

        {/* Reports This Month */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaCalendarAlt className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-lg shadow-lg shadow-green-500/30">
                <FaCalendarAlt className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">This Month</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.thisMonthReports || 0}</h3>
                <p className="text-xs opacity-75 mt-1">
                  Today: {stats?.todaysReports || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaRegCalendarCheck className="mr-2 text-green-500" />
              <span>Reports submitted</span>
            </div>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaPercentage className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-lg shadow-lg shadow-purple-500/30">
                <FaPercentage className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Approval Rate</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.approvalRate || '0%'}</h3>
                <p className="text-xs opacity-75 mt-1">
                  {stats?.approvedReports || 0} approved | {stats?.rejectedReports || 0} rejected
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaThumbsUp className="mr-2 text-purple-500" />
              <span>Reports approved</span>
            </div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
            <FaSync className="text-6xl text-slate-400 dark:text-slate-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 rounded-lg shadow-lg shadow-amber-500/30">
                <FaSync className="text-2xl text-white" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Pending</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.pendingReports || 0}</h3>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <FaClock className="mr-2 text-amber-500" />
              <span>Awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engineer Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance Rate */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-green-500/10">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-r-xl"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg shadow-green-500/30">
                <FaCheckDouble className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Compliance Rate</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quality standards met</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-green-600 dark:text-green-400">
                {stats?.complianceRate || '0%'}
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.compliantReports || 0} compliant reports
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000" 
              style={{ 
                width: stats?.complianceRate ? 
                  `min(${parseFloat(stats.complianceRate)}%, 100%)` : '0%' 
              }}
            ></div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-blue-500/10">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-xl"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                <FaStar className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quality Score</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Based on compliance & approval</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {stats?.qualityScore || '0/10'}
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Avg response: {stats?.avgResponseTime || '24h'}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000" 
              style={{ 
                width: stats?.qualityScore ? 
                  `min(${(parseFloat(stats.qualityScore) / 10) * 100}%, 100%)` : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Engineer Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Submit Report",
            description: "Create new quality report",
            icon: FaFileAlt,
            gradient: "from-green-500 to-green-600",
            shadow: "shadow-green-500/20",
            path: "/reports/create"
          },
          {
            title: "My Sites",
            description: "View assigned sites",
            icon: FaBuilding,
            gradient: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
            path: "/sites"
          },
          {
            title: "My Reports",
            description: "View submitted reports",
            icon: FaClipboardList,
            gradient: "from-purple-500 to-purple-600",
            shadow: "shadow-purple-500/20",
            path: "/reports"
          },
          {
            title: "Profile",
            description: "Update your information",
            icon: FaIdCard,
            gradient: "from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
            path: "/profile"
          }
        ].map((action, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(action.path)}
            className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30 ${action.shadow} hover:shadow-yellow-500/20`}
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
              <action.icon className="text-6xl text-slate-400 dark:text-slate-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${action.shadow}`}>
                  <action.icon className="text-2xl text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors duration-300">{action.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{action.description}</p>
                </div>
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors duration-300">
                <span>Go to Panel</span>
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Engineer Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                  <FaHistory className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Recent Activity</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Reports submitted & site assignments</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className={`p-4 rounded-xl ${getTypeColor(activity.type)} hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-800/20 transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm shadow-slate-300/30 dark:shadow-slate-700/30">
                        {getIconForActivity(activity.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <FaCalendarAlt className="text-xs" />
                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      {activity.details?.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.details.status)} shadow-sm`}>
                          {activity.details.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FaClipboard className="text-2xl text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">No recent activities</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Submit your first report to see activities here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Sites */}
        <div>
          <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-green-500/10">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-r-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg shadow-green-500/30">
                  <FaMapMarkerAlt className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assigned Sites</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sites under your supervision</p>
                </div>
              </div>
              <div className="space-y-4">
                {assignedSites.length > 0 ? (
                  assignedSites.slice(0, 4).map((site, index) => (
                    <div key={site._id || index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-yellow-500/50 transition-colors duration-300 shadow-sm hover:shadow-md hover:shadow-yellow-200/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {site.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)} shadow-sm`}>
                          {site.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 truncate">
                        {site.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-500">
                          Progress: {site.progress || 0}%
                        </span>
                        <button
                          onClick={() => handleNavigation(`/sites/${site._id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-yellow-600 dark:hover:text-yellow-500 text-sm font-medium transition-colors duration-300"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FaBuilding className="text-3xl text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No sites assigned</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Contact admin for site assignments
                    </p>
                  </div>
                )}
                {assignedSites.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleNavigation('/sites')}
                      className="w-full text-blue-600 dark:text-blue-400 hover:text-yellow-600 dark:hover:text-yellow-500 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-1"
                    >
                      View All Sites
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (authLoading || dashboardLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto shadow-lg shadow-blue-500/30"></div>
                <div className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Navbar />
        
        <div className="p-6">
          {/* Header with Greeting */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                    <FaTachometerAlt className="text-2xl text-white" />
                  </div>
                  <p className="text-sm uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">{getGreeting()}</p>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                  Welcome back, <span className="text-blue-600 dark:text-blue-400">{user.name}</span>!
                </h1>
                <div className="flex items-center gap-3 mt-6">
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg ${
                    user.role === 'Admin' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/30' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30'
                  }`}>
                    <span className="flex items-center gap-2">
                      {user.role === 'Admin' ? <FaUsers /> : <FaUserTie />}
                      {user.role}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-300/30 dark:shadow-slate-700/30">
                    <FaCalendarAlt className="inline mr-2" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role-based Dashboard Content */}
          {user.role === 'Admin' ? renderAdminDashboard() : renderEngineerDashboard()}

          {/* Platform Health Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-green-500/50 hover:shadow-green-500/10">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-r-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <FaShieldAlt className="text-2xl text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Safety Compliance</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {user.role === 'Admin' 
                    ? 'Maintaining 100% safety standards across all sites' 
                    : 'All safety protocols are being followed on your sites'}
                </p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <FaQrcode className="text-2xl text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quality Assurance</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {user.role === 'Admin' 
                    ? 'Monitoring material quality across all projects' 
                    : 'Ensure material testing meets quality standards'}
                </p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-amber-500/10">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-600 rounded-r-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <FaTools className="text-2xl text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Resources</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  <button
                    onClick={() => handleNavigation('/resources')}
                    className="text-blue-600 dark:text-blue-400 hover:text-yellow-600 dark:hover:text-yellow-500 inline-flex items-center gap-1 transition-colors duration-300"
                  >
                    Access inspection templates and guidelines
                    <FaArrowRight className="text-xs" />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}