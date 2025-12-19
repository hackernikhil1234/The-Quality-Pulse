import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAnalyticsData } from '../services/analyticsService';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { 
  FaChartPie, 
  FaChartLine, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaHardHat, 
  FaClipboardList, 
  FaUserTie,
  FaRegCalendarAlt,
  FaDownload,
  FaExclamationTriangle,
  FaDatabase,
  FaInfoCircle,
  FaSync,
  FaFileExcel,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaCog,
  FaChartBar,
  FaBuilding,
  FaMapMarkerAlt,
  FaTachometerAlt,
  FaArrowLeft
} from 'react-icons/fa';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('overview');
  const navigate = useNavigate();
  const exportRef = useRef(null);

  useEffect(() => {
    fetchAnalyticsDataHandler();
  }, [timeRange]);

  const fetchAnalyticsDataHandler = async () => {
    try {
      setLoading(true);
      const data = await fetchAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Failed to load analytics data');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    
    const csvContent = generateCSVContent(analyticsData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      toast.success('Analytics exported successfully!');
      setExporting(false);
    }, 1000);
  };

  const generateCSVContent = (data) => {
    if (!data) return '';
    
    const headers = [
      'Metric,Value',
      `Generated,${new Date().toLocaleString()}`,
      `Time Range,${timeRange}`,
      `Data Source,${data.source}`,
      ''
    ];
    
    const kpiData = [
      'Key Performance Indicators',
      `Compliance Rate,${data.complianceRate}%`,
      `Total Reports,${data.totalReports}`,
      `Total Sites,${data.totalSites}`,
      `Total Engineers,${data.totalEngineers}`,
      `Pending Reports,${data.pendingReports}`,
      `Approved Reports,${data.approvedReports}`,
      `Rejected Reports,${data.rejectedReports}`,
      `Pass Rate,${data.passRate}%`,
      `Fail Rate,${data.failRate}%`,
      `Avg Resolution Time,${data.avgResolutionTime} days`,
      ''
    ];
    
    const siteData = ['Site Performance'];
    data.sitePerformance.forEach(site => {
      siteData.push(`${site.site},${site.compliance}%,${site.reports} reports`);
    });
    siteData.push('');
    
    const materialData = ['Material Compliance'];
    data.materialCompliance.forEach(mat => {
      materialData.push(`${mat.material},${mat.passRate}%,${mat.totalTests} tests`);
    });
    
    return [...headers, ...kpiData, ...siteData, ...materialData].join('\n');
  };

  const refreshData = () => {
    fetchAnalyticsDataHandler();
    toast.success('Data refreshed successfully!');
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];
  const MATERIAL_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8">
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto shadow-lg shadow-blue-500/30"></div>
                  <FaChartLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xl" />
                </div>
                <div className="mt-6">
                  <div className="text-slate-800 dark:text-white text-lg font-medium">Loading Analytics Dashboard</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-2">Crunching the numbers...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8">
            <div className="max-w-md mx-auto">
              <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-lg shadow-blue-500/5 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 hover:border-yellow-500/30">
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                  <FaExclamationTriangle className="text-6xl text-slate-400 dark:text-slate-600" />
                </div>
                <div className="relative z-10">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping shadow-inner shadow-red-500/20"></div>
                    <FaExclamationTriangle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-4xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Unable to Load Analytics
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    There was an error loading analytics data. Please try again.
                  </p>
                  <button
                    onClick={fetchAnalyticsDataHandler}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 shadow-sm shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-yellow-500/30"
                  >
                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500">
                      Try Again
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const complianceData = [
    { name: 'Pass', value: analyticsData.passRate },
    { name: 'Fail', value: analyticsData.failRate }
  ];

  const statusData = [
    { name: 'Approved', value: analyticsData.approvedReports },
    { name: 'Pending', value: analyticsData.pendingReports },
    { name: 'Rejected', value: analyticsData.rejectedReports }
  ];

  const trendData = timeRange === 'day' 
    ? analyticsData.trends.daily 
    : analyticsData.trends.monthly;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                      <FaChartLine className="text-2xl text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                        Analytics <span className="text-blue-600 dark:text-blue-400">Dashboard</span>
                      </h1>
                      <p className="text-sm uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {analyticsData.isDemo 
                          ? 'Preview analytics capabilities with sample data' 
                          : 'Real-time insights from your quality assurance data'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {/* Time Filter Dropdown */}
                  <div className="group relative">
                    <select 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/50 transition-all duration-200"
                    >
                      <option value="day">Last 24 Hours</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-600 dark:text-yellow-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Refresh Button */}
                    <button
                      onClick={refreshData}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-yellow-500/50 dark:hover:border-yellow-500/30 hover:text-yellow-600 dark:hover:text-yellow-500 transition-all duration-200"
                    >
                      <FaSync className={`text-yellow-600 dark:text-yellow-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-yellow-600 dark:text-yellow-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                        Refresh
                      </span>
                    </button>
                    
                    {/* Export CSV Button */}
                    <button
                      onClick={exportToCSV}
                      disabled={exporting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-yellow-500/50 dark:hover:border-yellow-500/30 hover:text-yellow-600 dark:hover:text-yellow-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaFileExcel className={`text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400 ${exporting ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400">
                        {exporting ? 'Exporting...' : 'Export CSV'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards with Enhanced Shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Compliance Rate',
                value: `${analyticsData.complianceRate}%`,
                icon: FaCheckCircle,
                gradient: "from-blue-500 via-blue-600 to-blue-700",
                shadow: "shadow-blue-500/30",
                hoverShadow: "hover:shadow-blue-500/40",
                lightShadow: "shadow-lg shadow-blue-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-blue-500/30",
                trend: '+2.3%',
                subtext: `${analyticsData.totalReports} reports analyzed`
              },
              {
                title: 'Total Reports',
                value: analyticsData.totalReports,
                icon: FaClipboardList,
                gradient: "from-green-500 via-green-600 to-emerald-700",
                shadow: "shadow-green-500/30",
                hoverShadow: "hover:shadow-green-500/40",
                lightShadow: "shadow-lg shadow-green-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-green-500/30",
                trend: '+12',
                subtext: `Across ${analyticsData.totalSites} sites`
              },
              {
                title: 'Pending Review',
                value: analyticsData.pendingReports,
                icon: FaClock,
                gradient: "from-amber-500 via-amber-600 to-orange-700",
                shadow: "shadow-amber-500/30",
                hoverShadow: "hover:shadow-amber-500/40",
                lightShadow: "shadow-lg shadow-amber-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-amber-500/30",
                trend: analyticsData.pendingReports > 0 ? 'Attention' : 'Clear',
                subtext: `${Math.round((analyticsData.pendingReports / analyticsData.totalReports) * 100)}% of total`
              },
              {
                title: 'Active Engineers',
                value: analyticsData.totalEngineers,
                icon: FaUserTie,
                gradient: "from-purple-500 via-purple-600 to-purple-700",
                shadow: "shadow-purple-500/30",
                hoverShadow: "hover:shadow-purple-500/40",
                lightShadow: "shadow-lg shadow-purple-500/20",
                lightHoverShadow: "hover:shadow-2xl hover:shadow-purple-500/30",
                trend: `${Math.round(analyticsData.totalReports / Math.max(analyticsData.totalEngineers, 1))} avg`,
                subtext: 'Generating quality reports'
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
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 bg-gradient-to-br ${kpi.gradient} rounded-xl ${kpi.lightShadow}`}>
                      <kpi.icon className="text-2xl text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">{kpi.value}</h3>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <span className="truncate">{kpi.subtext}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-500">Trend</span>
                      <span className={`text-sm font-semibold ${kpi.trend.includes('+') ? 'text-green-600 dark:text-green-400' : kpi.trend === 'Attention' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Charts Section - Matching Dashboard Card Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Compliance Pie Chart */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                <FaChartPie className="text-6xl text-slate-400 dark:text-slate-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                    <FaChartPie className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Test Results Overview</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pass vs Fail distribution</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{analyticsData.passRate}%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Pass Rate</div>
                  </div>
                </div>
                
                <div className="h-72">
                  {analyticsData.totalReports > 0 ? (
                    <div className="relative h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={complianceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {complianceData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                strokeWidth={0}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Percentage']}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '10px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Center metric */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                          {analyticsData.complianceRate}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Compliance</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner shadow-slate-400/20">
                          <FaChartPie className="text-4xl text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">No test data available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-green-500/10">
                    <div className="text-2xl font-black text-green-600 dark:text-green-400 text-center">
                      {analyticsData.passRate}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center mt-1">Pass Rate</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-red-500/10">
                    <div className="text-2xl font-black text-red-600 dark:text-red-400 text-center">
                      {analyticsData.failRate}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center mt-1">Fail Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Status Chart */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                <FaClipboardList className="text-6xl text-slate-400 dark:text-slate-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/30">
                    <FaClipboardList className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Report Status</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Approval workflow progress</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{analyticsData.totalReports}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Reports</div>
                  </div>
                </div>
                
                <div className="h-72">
                  {analyticsData.totalReports > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value) => [value, 'Reports']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          name="Reports" 
                          radius={[8, 8, 0, 0]}
                          barSize={40}
                        >
                          {statusData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner shadow-slate-400/20">
                          <FaClipboardList className="text-4xl text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">No reports data available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {statusData.map((status, index) => (
                    <div key={status.name} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" style={{ boxShadow: `0 2px 8px 0 ${COLORS[index]}30` }}>
                      <div className={`text-2xl font-black`} style={{ color: COLORS[index] }}>
                        {status.value}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{status.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Site Performance */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                <FaHardHat className="text-6xl text-slate-400 dark:text-slate-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                    <FaHardHat className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Site Performance</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Compliance rate by site</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Top {analyticsData.sitePerformance.length} sites
                    </div>
                  </div>
                </div>
                
                <div className="h-72">
                  {analyticsData.sitePerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analyticsData.sitePerformance}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          stroke="#9CA3AF"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="site" 
                          stroke="#9CA3AF"
                          width={90}
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'compliance') return [`${value}%`, 'Compliance Rate'];
                            return [value, 'Reports'];
                          }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="compliance" 
                          name="Compliance Rate" 
                          fill="#6366F1" 
                          radius={[0, 8, 8, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner shadow-slate-400/20">
                          <FaHardHat className="text-4xl text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">No site performance data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Material Compliance */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                <FaChartLine className="text-6xl text-slate-400 dark:text-slate-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                    <FaChartLine className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Material Analysis</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pass rate by material type</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {analyticsData.materialCompliance.length} materials
                    </div>
                  </div>
                </div>
                
                <div className="h-72">
                  {analyticsData.materialCompliance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={analyticsData.materialCompliance} 
                        margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="material" 
                          stroke="#9CA3AF"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'passRate') return [`${value}%`, 'Pass Rate'];
                            return [value, 'Total Tests'];
                          }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="passRate" 
                          name="Pass Rate" 
                          stroke="#8B5CF6" 
                          fill="url(#materialGradient)" 
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient id="materialGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner shadow-slate-400/20">
                          <FaChartLine className="text-4xl text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">No material data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Trend Chart */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-8 shadow-lg shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:border-yellow-500/30">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
              <FaRegCalendarAlt className="text-6xl text-slate-400 dark:text-slate-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                  <FaRegCalendarAlt className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Compliance Trend</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Performance over selected period</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Compliance</span>
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey={timeRange === 'day' ? 'date' : 'month'} 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#9CA3AF"
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'compliance') return [`${value}%`, 'Compliance Rate'];
                          if (name === 'reports') return [value, 'Reports Count'];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '10px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="reports"
                        name="Reports Count"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="compliance"
                        name="Compliance Rate %"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10B981', strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner shadow-slate-400/20">
                      <FaRegCalendarAlt className="text-4xl text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">No trend data available</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-md">
                      {analyticsData.isDemo 
                        ? 'Demo trend data will appear when you select a time range' 
                        : 'Create more reports over time to see trends'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Source Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${analyticsData.isDemo ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30' : 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30'}`}>
                  {analyticsData.isDemo ? (
                    <FaInfoCircle className="text-2xl text-white" />
                  ) : (
                    <FaDatabase className="text-2xl text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.isDemo ? 'Demo Analytics Dashboard' : 'Real-time Analytics'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {analyticsData.isDemo 
                      ? 'Showing sample data to demonstrate analytics capabilities'
                      : `Analyzing ${analyticsData.totalReports} reports from your database`
                    }
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-right">
                <p>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs mt-1">Data refreshes automatically every 5 minutes</p>
              </div>
            </div>
            
            {analyticsData.isDemo && (
              <div className="mt-6 group relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-4 shadow-lg shadow-amber-500/10">
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                  <FaExclamationTriangle className="text-6xl text-slate-400 dark:text-slate-600" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/30">
                      <FaExclamationTriangle className="text-xl text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Note:</strong> This dashboard is showing sample data. 
                        {analyticsData.source === 'hybrid' && analyticsData.totalReports > 0 
                          ? ` It includes ${analyticsData.totalReports} real reports from your database.` 
                          : ' Create real reports to see your actual analytics data.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}