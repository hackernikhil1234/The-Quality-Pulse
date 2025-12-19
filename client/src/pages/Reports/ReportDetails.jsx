import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function for fallback image
  const getFallbackImageUrl = (index) => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#f0f0f0"/>
        <text x="150" y="100" font-family="Arial" font-size="16" text-anchor="middle" fill="#666">
        Image ${index + 1}
        </text>
        </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  };

  // Helper function to get complete image URL
  const getCompleteImageUrl = (imageUrl) => {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // If it starts with /uploads, prepend the backend URL
    if (imageUrl.startsWith('/uploads/')) {
        return `http://localhost:5000${imageUrl}`;
    }
    
    // Otherwise return as is (could be a data URL or other format)
    return imageUrl;
  };

  useEffect(() => {
    if (report) {
      console.log('Report images:', report.images);
      if (report.images && report.images.length > 0) {
        report.images.forEach((img, index) => {
          console.log(`Image ${index}:`, img);
          console.log(`Complete URL ${index}:`, getCompleteImageUrl(img));
        });
      }
    }
  }, [report]);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report details');
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <div className="mt-4 text-slate-600 dark:text-slate-400">Loading report details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8">
            <div className="card p-8 text-center">
              <div className="text-red-600 dark:text-red-400 mb-4">Report not found</div>
              <button 
                onClick={() => navigate('/reports')}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                  bg-gradient-to-r from-yellow-500 to-yellow-600 
                  text-slate-900
                  hover:from-yellow-600 hover:to-yellow-700 
                  hover:shadow-lg hover:shadow-yellow-500/25
                  active:scale-[0.99]
                  flex items-center mx-auto"
              >
                <FiArrowLeft className="mr-2" />
                Back to Reports
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
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="mb-6">
            {/* Updated Back Button with Yellow Theme */}
            <button 
              onClick={() => navigate(-1)}
              className="mb-4 p-2 rounded-lg transition-all duration-200 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                text-yellow-600 dark:text-yellow-500 
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                hover:text-yellow-700 dark:hover:text-yellow-400
                flex items-center"
            >
              <FiArrowLeft className="mr-2" />
              Back to Reports
            </button>
            
            <div className="p-6 transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              rounded-lg shadow-lg">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {report.title || 'Untitled Report'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      report.status === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : report.status === 'Approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Action buttons based on user role */}
                <div className="flex gap-2">
                  {user.role === 'Engineer' && (report.status === 'Pending' || report.status === 'Rejected') && (
                    <button
                      onClick={() => navigate(`/reports/${report._id}/edit`)}
                      className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                        bg-gradient-to-r from-yellow-500 to-yellow-600 
                        text-slate-900
                        hover:from-yellow-600 hover:to-yellow-700 
                        hover:shadow-lg hover:shadow-yellow-500/25
                        active:scale-[0.99]
                        flex items-center"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit Report
                    </button>
                  )}
                  
                  {user.role === 'Admin' && report.status === 'Pending' && (
                    <button
                      onClick={() => navigate(`/reports/${report._id}/review`)}
                      className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                        bg-gradient-to-r from-yellow-500 to-yellow-600 
                        text-slate-900
                        hover:from-yellow-600 hover:to-yellow-700 
                        hover:shadow-lg hover:shadow-yellow-500/25
                        active:scale-[0.99]
                        flex items-center"
                    >
                      <i className="fas fa-clipboard-check mr-2"></i>
                      Review Report
                    </button>
                  )}
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Material Tested</h3>
                    <p className="text-slate-800 dark:text-slate-300">{report.materialTested || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Test Standard</h3>
                    <p className="text-slate-800 dark:text-slate-300">{report.testStandard || 'N/A'}</p>
                  </div>
                </div>

                {/* Test Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Test Result</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      report.testResult === 'Pass' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {report.testResult || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Compliance Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      report.complianceStatus === 'Compliant'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {report.complianceStatus || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {report.description && (
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                    <p className="text-slate-800 dark:text-slate-300 whitespace-pre-line">
                      {report.description}
                    </p>
                  </div>
                )}

                {/* Findings */}
                {report.findings && (
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Findings</h3>
                    <p className="text-slate-800 dark:text-slate-300 whitespace-pre-line">
                      {report.findings}
                    </p>
                  </div>
                )}

                {/* Issues */}
                {report.issues && report.issues.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Issues Found</h3>
                    <div className="space-y-3">
                      {report.issues.map((issue, index) => (
                        <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                          <p className="font-medium text-red-700 dark:text-red-300">
                            {issue.description}
                          </p>
                          {issue.severity && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              Severity: {issue.severity}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images Section - UPDATED */}
                {report.images && report.images.length > 0 ? (
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Images</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {report.images.map((image, index) => {
                            const completeImageUrl = getCompleteImageUrl(image);
                            
                            return (
                            <div key={index} className="relative group">
                                <img
                                src={completeImageUrl}
                                alt={`Report image ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300"
                                onError={(e) => {
                                    console.error(`Failed to load image: ${completeImageUrl}`);
                                    e.target.src = getFallbackImageUrl(index);
                                }}
                                onLoad={() => {
                                    console.log(`Successfully loaded image: ${completeImageUrl}`);
                                }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <a 
                                    href={completeImageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-300 dark:border-slate-600"
                                >
                                    <i className="fas fa-expand text-slate-700 dark:text-slate-300"></i>
                                </a>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    </div>
                    ) : (
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Images</h3>
                        <p className="text-slate-500 dark:text-slate-400 italic">No images uploaded</p>
                    </div>
                )}

                {/* Site and Engineer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Site Information</h3>
                    <p className="text-slate-800 dark:text-slate-300">
                      {(() => {
                        // From your console log, site is an object
                        if (report.site && typeof report.site === 'object') {
                          if (report.site.name) return report.site.name;
                          if (report.site.siteName) return report.site.siteName;
                          if (report.site.title) return report.site.title;
                          if (report.site._id) return `Site ID: ${report.site._id.substring(0, 8)}...`;
                        }
                        if (report.siteName) return report.siteName;
                        if (report.site && typeof report.site === 'string') {
                          return `Site ID: ${report.site.substring(0, 8)}...`;
                        }
                        return 'Unknown Site';
                      })()}
                    </p>
                    {report.site?.location && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Location: {report.site.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Engineer Information</h3>
                    <p className="text-slate-800 dark:text-slate-300">
                      {(() => {
                        // From your console log, inspector has the engineer info
                        if (report.inspector && typeof report.inspector === 'object') {
                          if (report.inspector.name) return report.inspector.name;
                          if (report.inspector.email) return report.inspector.email;
                        }
                        if (report.createdBy && typeof report.createdBy === 'object') {
                          if (report.createdBy.name) return report.createdBy.name;
                          if (report.createdBy.email) return report.createdBy.email;
                        }
                        if (report.inspector && typeof report.inspector === 'string') {
                          return `Engineer ID: ${report.inspector.substring(0, 8)}...`;
                        }
                        return 'Unknown Engineer';
                      })()}
                    </p>
                    {report.inspector?.email && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Email: {report.inspector.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Review Information (if reviewed) */}
                {report.status !== 'Pending' && (report.reviewedBy || report.reviewComment) && (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Review Details</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            <strong>Reviewer:</strong> {report.reviewedBy?.name || 'Admin'}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                            <strong>Reviewed on:</strong> {new Date(report.reviewedAt || report.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-700 dark:text-slate-300">
                            <strong>Comment:</strong> {report.reviewComment || 'No comment provided'}
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
      </div>
    </div>
  );
}