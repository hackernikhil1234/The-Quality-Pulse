//SiteList.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiUsers, FiMapPin, FiFileText, FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi';

export default function SiteList() {
  const { user } = useAuth();
  const [allSites, setAllSites] = useState([]); // All sites from API
  const [displaySites, setDisplaySites] = useState([]); // Sites after filtering
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormHovered, setIsFormHovered] = useState(false);
  const navigate = useNavigate();

  // Fetch all sites
  const fetchSites = async () => {
    try {
      const res = await api.get('/sites');
      const sitesData = Array.isArray(res.data) ? res.data : [];
      setAllSites(sitesData);
      applyFilters(sitesData, 'All', '', user);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to load sites');
      setAllSites([]);
      setDisplaySites([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = (sites, status, search, currentUser) => {
    let filtered = [...sites];
    
    // 1. Role-based filtering
    if (currentUser?.role === 'Admin') {
      // Admin sees sites they created OR all sites if createdBy doesn't exist
      filtered = filtered.filter(site => {
        // If site has createdBy field and it matches admin, OR if no createdBy field
        return !site.createdBy || site.createdBy._id === currentUser._id;
      });
    } else if (currentUser?.role === 'Engineer') {
      // Engineers see sites they're assigned to
      filtered = filtered.filter(site => 
        site.assignedEngineers && 
        site.assignedEngineers.some(engineer => 
          (engineer._id === currentUser._id) || (engineer === currentUser._id)
        )
      );
    }
    // Viewer sees all sites (no role filtering)
    
    // 2. Status filtering
    if (status !== 'All') {
      filtered = filtered.filter(site => site.status === status);
    }
    
    // 3. Search filtering
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(site =>
        site.name?.toLowerCase().includes(searchLower) ||
        (site.location?.toLowerCase().includes(searchLower)) ||
        (site.description?.toLowerCase().includes(searchLower))
      );
    }
    
    setDisplaySites(filtered);
  };

  useEffect(() => {
    if (user) {
      fetchSites();
    }
  }, [user]);

  useEffect(() => {
    applyFilters(allSites, statusFilter, searchTerm, user);
  }, [statusFilter, searchTerm, allSites, user]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/sites/${id}`, { status });
      setAllSites(prev => prev.map(s => s._id === id ? { ...s, status } : s));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    try {
      await api.delete(`/sites/${id}`);
      setAllSites(prev => prev.filter(s => s._id !== id));
      toast.success('Site deleted successfully');
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Failed to delete site');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8 text-center">
          <div className="text-slate-600 dark:text-slate-400">Loading sites...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          {/* Header with Back Button */}
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-shrink-0 mt-1 p-2 rounded-lg transition-all duration-200 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                text-yellow-600 dark:text-yellow-500  
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                hover:text-yellow-600 dark:hover:text-yellow-500"
              title="Go Back to Dashboard"
            >
              <FiArrowLeft className="text-lg" />
            </button>
            
            <div className="flex-1 flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {user.role === 'Admin' 
                    ? 'All Construction Sites' 
                    : user.role === 'Engineer'
                    ? 'My Assigned Sites'
                    : 'Construction Sites'
                  }
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {user.role === 'Admin' 
                    ? 'Manage and monitor all construction sites under your supervision'
                    : user.role === 'Engineer'
                    ? 'Sites assigned to you for quality inspection'
                    : 'View all construction sites'
                  }
                </p>
              </div>
              
              {user.role === 'Admin' && (
                <Link 
                  to="/sites/create" 
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-slate-900
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]
                    flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Create New Site
                </Link>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div 
            onMouseEnter={() => setIsFormHovered(true)}
            onMouseLeave={() => setIsFormHovered(false)}
            className={`p-6 mb-8 transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              rounded-lg
              ${isFormHovered 
                ? 'shadow-xl shadow-yellow-500/20 border-yellow-500/30' 
                : 'shadow-lg'
              }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  <FiSearch className="mr-2" />
                  Search Sites
                </label>
                <input
                  type="text"
                  placeholder="Search by name, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Filter by Status
                </label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Stats */}
              <div className="flex flex-col justify-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {displaySites.length} of {allSites.length} sites
                </div>
              </div>
            </div>
          </div>

          {displaySites.length === 0 ? (
            <div className="p-8 text-center rounded-lg transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              shadow-lg">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {allSites.length === 0 
                  ? user.role === 'Engineer'
                    ? 'No sites have been assigned to you yet.'
                    : 'No sites available.'
                  : 'No sites match your current filters.'
                }
              </p>
              {user.role === 'Admin' && allSites.length === 0 && (
                <Link 
                  to="/sites/create" 
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-block
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-slate-900
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]"
                >
                  <FiPlus className="inline mr-2" />
                  Create Your First Site
                </Link>
              )}
              {allSites.length > 0 && (
                <button 
                  onClick={() => { setStatusFilter('All'); setSearchTerm(''); }}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-slate-100 dark:bg-slate-700 
                    border border-slate-300 dark:border-slate-600
                    text-slate-700 dark:text-slate-300 
                    hover:bg-slate-200 dark:hover:bg-slate-600
                    hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                    hover:text-slate-900 dark:hover:text-white"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Showing {displaySites.length} site{displaySites.length !== 1 ? 's' : ''}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displaySites.map(site => (
                  <div 
                    key={site._id} 
                    className="relative p-6 transition-all duration-300
                      bg-white dark:bg-slate-800 
                      border border-slate-200 dark:border-slate-700 
                      rounded-lg 
                      hover:shadow-xl hover:shadow-yellow-500/20
                      hover:border-yellow-500/30"
                  >
                    {/* Action buttons section - similar to ReportList */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${getStatusBadgeColor(site.status || 'Active')}`}>
                        {site.status || 'Active'}
                      </span>
                      
                      {/* View Button */}
                      <Link
                        to={`/sites/${site._id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-all duration-200"
                        title="View Site Details"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </Link>
                    </div>

                    <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-3 pr-28">
                      {site.name}
                    </h3>
                    
                    <div className="mb-4">
                      {site.location && (
                        <p className="text-slate-600 dark:text-slate-400 mb-3 flex items-center">
                          <FiMapPin className="mr-2 text-slate-500" />
                          {site.location}
                        </p>
                      )}
                      
                      {site.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2 mb-4">
                          {site.description}
                        </p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold">{site.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getProgressColor(site.progress || 0)}`}
                            style={{ width: `${site.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Assigned Engineers */}
                      {site.assignedEngineers && site.assignedEngineers.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                            <FiUsers className="mr-2 text-slate-500" />
                            Assigned Engineers:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {site.assignedEngineers.map((engineer, index) => (
                              <span key={index} className="text-xs px-2 py-1 rounded
                                bg-slate-100 dark:bg-slate-700 
                                text-slate-600 dark:text-slate-400 
                                border border-slate-200 dark:border-slate-600">
                                {typeof engineer === 'object' ? engineer.name : 'Engineer'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                      {/* Admin View Reports Button */}
                      {user.role === 'Admin' && (
                        <Link 
                          to={`/admin/reports?site=${site._id}&siteName=${encodeURIComponent(site.name)}`} 
                          className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center
                            bg-gradient-to-r from-yellow-500 to-yellow-600 
                            text-slate-900
                            hover:from-yellow-600 hover:to-yellow-700 
                            hover:shadow-lg hover:shadow-yellow-500/25
                            active:scale-[0.99]
                            flex items-center justify-center"
                        >
                          <FiFileText className="mr-2" />
                          View All Reports
                        </Link>
                      )}

                      {/* Engineer Buttons */}
                      {user.role === 'Engineer' && (
                        <div className="flex flex-col gap-2">
                          <Link 
                            to={`/reports?site=${site._id}`}
                            className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center
                              bg-gradient-to-r from-yellow-500 to-yellow-600 
                              text-slate-900
                              hover:from-yellow-600 hover:to-yellow-700 
                              hover:shadow-lg hover:shadow-yellow-500/25
                              active:scale-[0.99]
                              flex items-center justify-center"
                          >
                            <FiFileText className="mr-2" />
                            View My Reports
                          </Link>
                          
                          {site.status !== 'Completed' && (
                            <Link 
                              to={`/reports/create?site=${site._id}&siteName=${encodeURIComponent(site.name)}`}
                              className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center
                                bg-slate-100 dark:bg-slate-700 
                                border border-slate-300 dark:border-slate-600
                                text-slate-700 dark:text-slate-300 
                                hover:bg-slate-200 dark:hover:bg-slate-600
                                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                                hover:text-slate-900 dark:hover:text-white
                                flex items-center justify-center"
                            >
                              <FiPlus className="mr-2" />
                              Create New Report
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Admin Controls */}
                      {user.role === 'Admin' && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <select 
                            value={site.status || 'Active'} 
                            onChange={e => handleStatusChange(site._id, e.target.value)}
                            className="w-full p-2.5 rounded-lg transition-all duration-200 text-sm
                              bg-white dark:bg-slate-900 
                              border border-slate-300 dark:border-slate-600 
                              text-slate-700 dark:text-slate-300
                              focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                              focus:ring-1 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                          >
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Completed">Completed</option>
                          </select>
                          
                          <Link 
                            to={`/sites/edit/${site._id}`}
                            className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center text-sm
                              bg-slate-100 dark:bg-slate-700 
                              border border-slate-300 dark:border-slate-600
                              text-slate-700 dark:text-slate-300 
                              hover:bg-slate-200 dark:hover:bg-slate-600
                              hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                              hover:text-slate-900 dark:hover:text-white
                              flex items-center justify-center"
                          >
                            <FiEdit className="mr-2" />
                            Edit
                          </Link>
                          
                          <button 
                            onClick={() => handleDelete(site._id)} 
                            className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center text-sm
                              bg-red-500/10 dark:bg-red-500/20 
                              border border-red-500/20 dark:border-red-500/30
                              text-red-600 dark:text-red-400 
                              hover:bg-red-500/20 dark:hover:bg-red-500/30
                              hover:border-red-500/40 dark:hover:border-red-500/50
                              hover:text-red-700 dark:hover:text-red-300
                              flex items-center justify-center"
                          >
                            <FiTrash2 className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}