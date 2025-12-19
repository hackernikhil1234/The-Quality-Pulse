import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaClipboardCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTools,
  FaHardHat,
  FaRulerCombined,
  FaIndustry,
  FaTruckLoading,
  FaPercent,
  FaFileAlt,
  FaPhone,
  FaEnvelope,
  FaUserTie
} from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function SiteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch site details
        const response = await api.get(`/sites/${id}`);
        setSite(response.data);

        // Fetch reports for this site
        const reportsResponse = await api.get(`/reports?site=${id}`);
        setReports(reportsResponse.data || []);
      } catch (error) {
        console.error('Error fetching site details:', error);
        if (error.response?.status === 403) {
          toast.error('You are not assigned to this site');
          navigate('/sites');
        } else if (error.response?.status === 404) {
          toast.error('Site not found');
          navigate('/sites');
        } else {
          toast.error('Failed to load site details');
        }
      } finally {
        setLoading(false);
        setReportsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'compliant':
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'on hold':
      case 'delayed':
      case 'rejected':
      case 'non-compliant':
      case 'inactive':
      case 'paused': // Added paused to red status
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleCreateReport = () => {
    navigate(`/reports/create?site=${id}&siteName=${encodeURIComponent(site.name)}`);
  };

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const handleBack = () => {
    navigate('/sites');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                <div className="mt-4 text-slate-600 dark:text-slate-400">Loading site details...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Navbar />
          <div className="p-6">
            <div className="text-center py-12">
              <FaBuilding className="text-4xl text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Site not found</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">The site you're looking for doesn't exist or you don't have access.</p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  bg-slate-100 dark:bg-slate-700 
                  border border-slate-300 dark:border-slate-600
                  text-slate-700 dark:text-slate-300 
                  hover:bg-slate-200 dark:hover:bg-slate-600
                  hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                  hover:text-slate-900 dark:hover:text-white"
              >
                Back to Sites
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Navbar />
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg transition-all duration-200
                  bg-white dark:bg-slate-800 
                  border border-slate-200 dark:border-slate-700
                  text-slate-600 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  hover:border-yellow-500/50 dark:hover:border-yellow-500/50"
                title="Back to Sites"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Details</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">View site information and reports</p>
              </div>
            </div>
            
            {/* Only show Submit Report button when site is Active */}
            {user.role === 'Engineer' && site.status === 'Active' && (
              <button
                onClick={handleCreateReport}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                  bg-gradient-to-r from-yellow-500 to-yellow-600 
                  text-slate-900
                  hover:from-yellow-600 hover:to-yellow-700 
                  hover:shadow-lg hover:shadow-yellow-500/25
                  active:scale-[0.99]
                  flex items-center gap-2"
              >
                <FaFileAlt />
                Submit Report
              </button>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Site Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Site Overview Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-yellow-500 p-3 rounded-sm text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                        <FaBuilding className="text-xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{site.name}</h2>
                        <p className="text-slate-600 dark:text-slate-400">{site.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(site.status)}`}>
                        {site.status || 'Active'}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Progress: {site.progress || 0}%
                      </span>
                      {site.type && (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Type: {site.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <FaCalendarAlt className="text-yellow-500" />
                      <span className="font-medium">Start Date</span>
                    </div>
                    <p className="text-slate-800 dark:text-white">{formatDate(site.startDate)}</p>
                  </div>

                  {/* Expected Completion */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <FaCalendarAlt className="text-yellow-500" />
                      <span className="font-medium">Expected Completion</span>
                    </div>
                    <p className="text-slate-800 dark:text-white">{formatDate(site.expectedCompletion)}</p>
                  </div>

                  {/* Created By */}
                  {site.createdBy && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <FaUserTie className="text-yellow-500" />
                        <span className="font-medium">Created By</span>
                      </div>
                      <p className="text-slate-800 dark:text-white">{site.createdBy.name}</p>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <FaCalendarAlt className="text-yellow-500" />
                      <span className="font-medium">Last Updated</span>
                    </div>
                    <p className="text-slate-800 dark:text-white">{formatDate(site.updatedAt)}</p>
                  </div>
                </div>

                {/* Description */}
                {site.description && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Description</h3>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{site.description}</p>
                  </div>
                )}

                {/* Material Specifications */}
                {site.materialSpecifications && site.materialSpecifications.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaTools className="text-yellow-500" />
                      Material Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {site.materialSpecifications.map((spec, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-800 dark:text-white">{spec.material || 'Material'}</h4>
                            <span className="text-sm px-2 py-1 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded">
                              {spec.grade ? `Grade ${spec.grade}` : 'Standard'}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            {spec.quantity && (
                              <div className="flex items-center gap-2">
                                <FaRulerCombined className="text-xs" />
                                <span>Quantity: {spec.quantity} {spec.unit || 'units'}</span>
                              </div>
                            )}
                            {spec.supplier && (
                              <div className="flex items-center gap-2">
                                <FaIndustry className="text-xs" />
                                <span>Supplier: {spec.supplier}</span>
                              </div>
                            )}
                            {spec.deliveryDate && (
                              <div className="flex items-center gap-2">
                                <FaTruckLoading className="text-xs" />
                                <span>Delivery: {formatDate(spec.deliveryDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Reports Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaClipboardCheck className="text-yellow-500" />
                  Recent Reports
                </h3>
                
                {reportsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Loading reports...</p>
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report._id}
                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 hover:shadow-md hover:shadow-yellow-500/10"
                        onClick={() => handleViewReport(report._id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-500 p-2 rounded-sm text-slate-900">
                              <FaFileAlt className="text-sm" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800 dark:text-white">
                                {report.title || 'Inspection Report'}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Submitted on {formatDate(report.date || report.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status || 'Pending'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.complianceStatus)}`}>
                              {report.complianceStatus || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {report.materialTested && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Material:</span> {report.materialTested}
                            </div>
                          )}
                          {report.testType && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Test Type:</span> {report.testType}
                            </div>
                          )}
                          {report.testResult?.overallScore && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Score:</span> {report.testResult.overallScore}/10
                            </div>
                          )}
                          {report.submittedBy && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-medium">By:</span> {report.submittedBy?.name || 'Engineer'}
                            </div>
                          )}
                        </div>
                        
                        {report.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {report.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaFileAlt className="text-3xl text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No reports submitted for this site yet</p>
                    {/* Only show "Submit first report" when site is Active */}
                    {user.role === 'Engineer' && site.status === 'Active' && (
                      <button
                        onClick={handleCreateReport}
                        className="mt-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm font-medium"
                      >
                        Submit first report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Stats & Information */}
            <div className="space-y-6">
              {/* Assigned Engineers */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaUsers className="text-yellow-500" />
                  Assigned Engineers
                </h3>
                {site.assignedEngineers && site.assignedEngineers.length > 0 ? (
                  <div className="space-y-4">
                    {site.assignedEngineers.map((engineer) => (
                      <div key={engineer._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                            <span className="text-slate-900 font-bold">
                              {engineer.name?.charAt(0)?.toUpperCase() || 'E'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 dark:text-white truncate">{engineer.name}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{engineer.email}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          {engineer.phone && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <FaPhone className="text-xs" />
                              <span>{engineer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <FaEnvelope className="text-xs" />
                            <span className="truncate">{engineer.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaUsers className="text-3xl text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No engineers assigned</p>
                  </div>
                )}
              </div>

              {/* Site Statistics */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaPercent className="text-yellow-500" />
                  Site Statistics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Reports</span>
                      <span className="font-medium text-slate-800 dark:text-white">
                        {reports.length}
                      </span>
                    </div>
                    {/* Removed the progress bar for total reports */}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Compliance Rate</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {site.complianceRate || '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: site.complianceRate ? 
                            `${parseInt(site.complianceRate)}%` : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Quality Score</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {site.qualityScore || '0/10'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: site.qualityScore ? 
                            `${(parseFloat(site.qualityScore.split('/')[0]) / 10) * 100}%` : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Project Progress</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                        {site.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${site.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {/* Only show Submit New Report button when site is Active */}
                  {user.role === 'Engineer' && site.status === 'Active' && (
                    <button
                      onClick={handleCreateReport}
                      className="w-full p-3 rounded-lg font-medium transition-all duration-200
                        bg-gradient-to-r from-yellow-500 to-yellow-600 
                        text-slate-900
                        hover:from-yellow-600 hover:to-yellow-700 
                        hover:shadow-lg hover:shadow-yellow-500/25
                        active:scale-[0.99]
                        flex items-center justify-center gap-2"
                    >
                      <FaFileAlt />
                      Submit New Report
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/reports?site=${id}`)}
                    className="w-full p-3 rounded-lg font-medium transition-all duration-200
                      bg-slate-100 dark:bg-slate-700 
                      border border-slate-300 dark:border-slate-600
                      text-slate-700 dark:text-slate-300 
                      hover:bg-slate-200 dark:hover:bg-slate-600
                      hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                      hover:text-slate-900 dark:hover:text-white
                      flex items-center justify-center gap-2"
                  >
                    <FaClipboardCheck />
                    View All Reports
                  </button>
                  
                  {user.role === 'Admin' && (
                    <button
                      onClick={() => navigate(`/sites/edit/${site._id}`)}
                      className="w-full p-3 rounded-lg font-medium transition-all duration-200
                        bg-slate-100 dark:bg-slate-700 
                        border border-slate-300 dark:border-slate-600
                        text-slate-700 dark:text-slate-300 
                        hover:bg-slate-200 dark:hover:bg-slate-600
                        hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                        hover:text-slate-900 dark:hover:text-white
                        flex items-center justify-center gap-2"
                    >
                      <FaTools />
                      Edit Site
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}