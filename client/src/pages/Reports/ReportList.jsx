// pages/Reports/ReportList.jsx - UPDATED FIX
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ReportList() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const siteId = searchParams.get('site');
  const siteName = searchParams.get('siteName');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [allSites, setAllSites] = useState([]); // Store all sites for name mapping

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch all sites for site name mapping - FIXED
  useEffect(() => {
    const fetchAllSites = async () => {
      try {
        const res = await api.get('/sites');
        console.log('Sites API response:', res.data);
        if (Array.isArray(res.data)) {
          setAllSites(res.data);
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };

    if (user) {
      fetchAllSites();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        search: searchTerm,
      };

      if (siteId) {
        params.site = siteId;
      }

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      // For engineers, only fetch their own reports
      if (user?.role === 'Engineer') {
        params.engineer = user._id || user.id;
      }

      console.log('Fetching reports with params:', params);
      const res = await api.get('/reports', { params });
      console.log('Reports data received:', res.data);

      let reportsData = [];
      if (Array.isArray(res.data)) {
        reportsData = res.data;
        setTotalReports(res.data.length);
        setTotalPages(1);
      } else if (res.data?.reports && Array.isArray(res.data.reports)) {
        reportsData = res.data.reports;
        setTotalReports(res.data.pagination?.total || reportsData.length);
        setTotalPages(res.data.pagination?.pages || 1);
      }

      // Log first report for debugging
      if (reportsData.length > 0) {
        console.log('First report structure:', reportsData[0]);
        console.log('Site in report:', reportsData[0].site);
        console.log('Inspector in report:', reportsData[0].inspector);
        console.log('All sites available:', allSites);
      }

      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      return;
    }

    fetchReports();
  }, [user, authLoading, siteId, statusFilter, page, limit, searchTerm]);

  // Get site name - SIMPLIFIED VERSION
  const getSiteName = (report) => {
    if (!report) return 'Unknown Site';

    console.log('Getting site name for report:', report._id, report.site);

    // If site is populated as an object with name
    if (report.site && typeof report.site === 'object') {
      if (report.site.name) return report.site.name;
      if (report.site.siteName) return report.site.siteName;
      if (report.site.title) return report.site.title;

      // If site object has _id but no name, try to find in allSites
      if (report.site._id && allSites.length > 0) {
        const foundSite = allSites.find((s) => s._id === report.site._id);
        if (foundSite) return foundSite.name || `Site ${report.site._id.substring(0, 8)}...`;
      }
    }

    // If site is just an ID string
    if (report.site && typeof report.site === 'string' && allSites.length > 0) {
      const foundSite = allSites.find((s) => s._id === report.site);
      if (foundSite) return foundSite.name || `Site ${report.site.substring(0, 8)}...`;
    }

    // Try other possible field names
    if (report.siteName) return report.siteName;
    if (report.projectSite?.name) return report.projectSite.name;
    if (report.location) return report.location;

    return 'Unknown Site';
  };

  // Get engineer name - SIMPLIFIED VERSION
  const getEngineerName = (report) => {
    if (!report) return 'Unknown Engineer';

    console.log(
      'Getting engineer name for report:',
      report._id,
      report.inspector,
      report.createdBy
    );

    // From your console log, it looks like engineer info is in 'inspector' field
    if (report.inspector && typeof report.inspector === 'object') {
      if (report.inspector.name) return report.inspector.name;
      if (report.inspector.email) return report.inspector.email;
    }

    // Try createdBy field
    if (report.createdBy && typeof report.createdBy === 'object') {
      if (report.createdBy.name) return report.createdBy.name;
      if (report.createdBy.email) return report.createdBy.email;
    }

    // Try engineer field
    if (report.engineer && typeof report.engineer === 'object') {
      if (report.engineer.name) return report.engineer.name;
      if (report.engineer.email) return report.engineer.email;
    }

    // If it's a string ID and it's the current user
    if (
      report.inspector &&
      typeof report.inspector === 'string' &&
      user?._id === report.inspector
    ) {
      return user.name || user.email || 'You';
    }

    // If it's a string ID
    if (report.inspector && typeof report.inspector === 'string') {
      return `Engineer ${report.inspector.substring(0, 8)}...`;
    }

    return 'Unknown Engineer';
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await api.delete(`/reports/${reportId}`);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleRecreateReport = (report) => {
    // Check if report is rejected
    if (report.status !== 'Rejected') {
      toast.error('Only rejected reports can be re-created');
      return;
    }

    // Navigate to create report page with report data for pre-filling
    navigate(
      `/reports/create?edit=${report._id}&site=${report.site?._id || report.site}&siteName=${encodeURIComponent(getSiteName(report))}`
    );
  };

  // Helper functions for badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getResultBadge = (result) => {
    switch (result) {
      case 'Pass':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8 space-y-6">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <SkeletonTable rows={10} columns={7} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          {/* Debug Info
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded">
            Debug: Loaded {allSites.length} sites and {reports.length} reports
          </div> */}

          {/* Header with Back Arrow for normal report list */}
          <div className="flex items-start gap-4 mb-8">
            {/* Back Arrow for normal report list (without siteId) */}
            {!siteId && (
              <button
                onClick={() => navigate(-1)}
                className="flex-shrink-0 mt-1 p-2 rounded-lg transition-all duration-200 
                  bg-white dark:bg-slate-800 
                  border border-slate-200 dark:border-slate-700 
                  text-yellow-600 dark:text-yellow-500 
                  hover:bg-slate-100 dark:hover:bg-slate-700 
                  hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                  hover:text-yellow-700 dark:hover:text-yellow-400"
                title="Go Back"
              >
                <FiArrowLeft className="text-lg" />
              </button>
            )}

            <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {siteName
                    ? `Reports - ${decodeURIComponent(siteName)}`
                    : user.role === 'Admin'
                      ? 'All QA Reports'
                      : 'My QA Reports'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Showing {reports.length} of {totalReports} report{totalReports !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-900 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={fetchReports}
                  className="px-4 py-3 rounded-lg font-medium transition-all duration-200
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-slate-900
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]
                    flex items-center"
                  title="Refresh Reports"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </button>

                {/* Create Report Button for Engineers when viewing specific site */}
                {user.role === 'Engineer' && siteId && (
                  <Link
                    to={`/reports/create?site=${siteId}&siteName=${encodeURIComponent(siteName || 'Site')}`}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                      bg-gradient-to-r from-yellow-500 to-yellow-600 
                      text-slate-900
                      hover:from-yellow-600 hover:to-yellow-700 
                      hover:shadow-lg hover:shadow-yellow-500/25
                      active:scale-[0.99]
                      flex items-center"
                  >
                    <span className="mr-2">+</span>
                    Create Report
                  </Link>
                )}

                {/* Back to Sites Button when viewing specific site - Updated to navigate(-1) */}
                {siteId && (
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                      bg-white dark:bg-slate-800 
                      border border-slate-200 dark:border-slate-700 
                      text-yellow-600 dark:text-yellow-500 
                      hover:bg-slate-100 dark:hover:bg-slate-700 
                      hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                      hover:text-yellow-700 dark:hover:text-yellow-400
                      flex items-center"
                  >
                    <span className="mr-2">←</span>
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reports Table */}
          {reports.length === 0 ? (
            <div
              className="p-8 text-center rounded-lg transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              shadow-lg"
            >
              <div className="text-slate-400 dark:text-slate-500 mb-4 text-6xl">📋</div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Reports Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {statusFilter !== 'All'
                  ? `No ${statusFilter.toLowerCase()} reports found.`
                  : user.role === 'Engineer'
                    ? 'You have not created any reports yet.'
                    : 'No reports available.'}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={fetchReports}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-white
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]
                    flex items-center"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </button>
                {user.role === 'Engineer' && !siteId && (
                  <Link
                    to="/reports/create"
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                      bg-gradient-to-r from-yellow-500 to-yellow-600 
                      text-slate-900
                      hover:from-yellow-600 hover:to-yellow-700 
                      hover:shadow-lg hover:shadow-yellow-500/25
                      active:scale-[0.99]
                      flex items-center"
                  >
                    <span className="mr-2">+</span>
                    Create Report
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div
              className="p-6 transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              rounded-lg shadow-lg"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Result
                      </th>
                      {user.role === 'Admin' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Engineer
                        </th>
                      )}
                      {!siteId && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Site
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {reports.map((report) => (
                      <tr
                        key={report._id || report.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.title || 'Untitled Report'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {report.description
                              ? report.description.substring(0, 50) + '...'
                              : 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {report.materialTested || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(report.status)}`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultBadge(report.testResult)}`}
                          >
                            {report.testResult || 'N/A'}
                          </span>
                        </td>
                        {user.role === 'Admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getEngineerName(report)}
                          </td>
                        )}
                        {!siteId && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getSiteName(report)}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* View Button - ALWAYS VISIBLE */}
                            <button
                              onClick={() => navigate(`/reports/${report._id || report.id}`)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-all duration-200"
                              title="View Report"
                            >
                              <i className="fas fa-eye text-sm"></i>
                            </button>

                            {/* Engineer-specific actions */}
                            {user.role === 'Engineer' && (
                              <>
                                {/* Edit button for pending reports */}
                                {report.status === 'Pending' && (
                                  <button
                                    onClick={() =>
                                      navigate(`/reports/${report._id || report.id}/edit`)
                                    }
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-all duration-200"
                                    title="Edit Report"
                                  >
                                    <i className="fas fa-edit text-sm"></i>
                                  </button>
                                )}

                                {/* Re-create button for rejected reports */}
                                {report.status === 'Rejected' && (
                                  <button
                                    onClick={() => handleRecreateReport(report)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 transition-all duration-200"
                                    title="Re-create Report"
                                  >
                                    <i className="fas fa-redo text-sm"></i>
                                  </button>
                                )}

                                {/* Delete button for engineer's own reports (pending only) */}
                                {report.status === 'Pending' && (
                                  <button
                                    onClick={() => handleDeleteReport(report._id || report.id)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-all duration-200"
                                    title="Delete Report"
                                  >
                                    <i className="fas fa-trash text-sm"></i>
                                  </button>
                                )}
                              </>
                            )}

                            {/* Admin-specific actions */}
                            {user.role === 'Admin' && (
                              <>
                                {/* Review button for pending reports */}
                                {report.status === 'Pending' && (
                                  <button
                                    onClick={() =>
                                      navigate(`/reports/${report._id || report.id}/review`)
                                    }
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-all duration-200"
                                    title="Review Report"
                                  >
                                    <i className="fas fa-clipboard-check text-sm"></i>
                                  </button>
                                )}

                                {/* Delete button for any report */}
                                <button
                                  onClick={() => handleDeleteReport(report._id || report.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-all duration-200"
                                  title="Delete Report"
                                >
                                  <i className="fas fa-trash text-sm"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Page <span className="text-slate-900 dark:text-white font-bold">{page}</span> of{' '}
                    <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center"
                    >
                      <FiChevronLeft className="mr-1" />
                      Prev
                    </button>

                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Only show a few page numbers around the current page
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${
                              page === pageNum
                                ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/25'
                                : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        (pageNum === 2 && page > 3) ||
                        (pageNum === totalPages - 1 && page < totalPages - 2)
                      ) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center"
                    >
                      Next
                      <FiChevronRight className="ml-1" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Show:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
