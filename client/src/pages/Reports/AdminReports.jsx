// pages/Reports/AdminReports.jsx - CORRECTED VERSION
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'; // ADD useNavigate
import api from '../../services/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AdminReports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // ADD THIS LINE
  const siteId = searchParams.get('site');
  const siteName = searchParams.get('siteName') || 'Site';
  
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [comment, setComment] = useState('');

  useEffect(() => {
    console.log('AdminReports - User:', user);
    console.log('AdminReports - Site ID:', siteId);
    
    if (!user) {
      console.log('No user found');
      return;
    }

    if (user?.role !== 'Admin') {
      toast.error('Only Admin can access this page');
      navigate('/sites'); // Changed from window.location.href to navigate
      return;
    }

    if (siteId) {
      fetchReports();
    } else {
      toast.error('No site specified');
      navigate('/sites');
    }
  }, [siteId, user, navigate]);

  const fetchReports = async () => {
    try {
      console.log('AdminReports - Fetching reports for site:', siteId);
      const res = await api.get(`/reports?site=${siteId}`);
      console.log('Fetched reports:', res.data);
      setReports(res.data || []);
      
      // Auto-select first report if available
      if (res.data && res.data.length > 0) {
        setSelectedReport(res.data[0]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view these reports');
      } else {
        toast.error('Failed to load reports: ' + (error.response?.data?.message || error.message));
      }
      
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter === 'All') return true;
    return report.status === statusFilter;
  });

  const handleApprove = async (reportId) => {
    if (!window.confirm('Approve this report?')) return;
    
    if (!comment.trim()) {
      toast.error('Please provide a review comment');
      return;
    }
    
    try {
      await api.put(`/reports/${reportId}/status`, {
        status: 'Approved',
        reviewComment: comment
      });
      
      toast.success('Report approved');
      setSelectedReport(null);
      setComment('');
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
    }
  };

  const handleReject = async (reportId) => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    if (!window.confirm('Reject this report?')) return;
    
    try {
      await api.put(`/reports/${reportId}/status`, {
        status: 'Rejected',
        reviewComment: comment
      });
      
      toast.success('Report rejected');
      setSelectedReport(null);
      setComment('');
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8 text-center">
          <div className="text-gray-600 dark:text-gray-400">Loading reports...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Reports for {siteName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Review and approve/reject reports submitted by engineers
              </p>
            </div>
            <button 
              onClick={() => navigate('/sites')} 
              className="btn-secondary"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Sites
            </button>
          </div>

          {/* Filters */}
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300">Filter by status:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="All">All Reports</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Showing {filteredReports.length} of {reports.length} reports
              </div>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {reports.length === 0 ? 'No reports found for this site.' : `No ${statusFilter.toLowerCase()} reports.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-1">
                <div className="card p-4">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                    Reports List
                  </h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredReports.map(report => (
                      <div
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedReport?._id === report._id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-white">
                              {report.title || 'Untitled Report'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              By: {report.inspector?.name || report.inspector?.email || 'Unknown Engineer'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Material: {report.materialTested}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <div className="card p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                          {selectedReport.title || 'Untitled Report'}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedReport.status)}`}>
                            {selectedReport.status}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Submitted: {new Date(selectedReport.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          By: {selectedReport.inspector?.name || selectedReport.inspector?.email || 'Unknown Engineer'}
                        </p>
                      </div>
                      {selectedReport.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(selectedReport._id)}
                            className="btn-primary text-sm"
                          >
                            <i className="fas fa-check mr-2"></i>
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(selectedReport._id)}
                            className="btn-danger text-sm"
                          >
                            <i className="fas fa-times mr-2"></i>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Report Details */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Material Tested</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedReport.materialTested}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Test Result</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedReport.testResult === 'Pass' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {selectedReport.testResult}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Compliance Status</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedReport.complianceStatus === 'Compliant'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {selectedReport.complianceStatus}
                          </span>
                        </div>
                      </div>

                      {selectedReport.description && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {selectedReport.description}
                          </p>
                        </div>
                      )}

                      {selectedReport.findings && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Findings</h3>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {selectedReport.findings}
                          </p>
                        </div>
                      )}

                      {selectedReport.recommendations && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Recommendations</h3>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {selectedReport.recommendations}
                          </p>
                        </div>
                      )}

                      {selectedReport.comments && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Additional Comments</h3>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {selectedReport.comments}
                          </p>
                        </div>
                      )}

                      {selectedReport.issues && selectedReport.issues.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Issues Found</h3>
                          <div className="space-y-3">
                            {selectedReport.issues.map((issue, index) => (
                              <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
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

                      {selectedReport.images && selectedReport.images.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Images</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedReport.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Report image ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Comment Input */}
                      {selectedReport.status === 'Pending' && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Review Comment
                          </h3>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Enter your review comments here..."
                            className="input w-full h-32"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            This comment will be visible to the engineer
                          </p>
                        </div>
                      )}

                      {/* Previous Reviews */}
                      {(selectedReport.reviewedBy || selectedReport.feedback || selectedReport.reviewComment) && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Review Details
                          </h3>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            {selectedReport.reviewedBy && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <strong>Reviewer:</strong> {selectedReport.reviewedBy?.name || 'Admin'}
                              </p>
                            )}
                            {(selectedReport.reviewComment || selectedReport.feedback) && (
                              <p className="text-gray-700 dark:text-gray-300 mt-1">
                                <strong>Comment:</strong> {selectedReport.reviewComment || selectedReport.feedback || 'No comment'}
                              </p>
                            )}
                            {selectedReport.reviewedAt && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                Reviewed on: {new Date(selectedReport.reviewedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a report from the list to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}