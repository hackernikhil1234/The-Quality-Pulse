import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

export default function ReportReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [action, setAction] = useState(''); // 'approve' or 'reject'

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
    if (user?.role !== 'Admin') {
      toast.error('Only Admin can access this page');
      navigate('/reports');
      return;
    }
    
    fetchReport();
  }, [id, user, navigate]);

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      if (res.data.status !== 'Pending') {
        toast.error('This report has already been reviewed');
        navigate(`/reports/${id}`);
        return;
      }
      setReport(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please provide a review comment');
      return;
    }
    
    if (!action) {
      toast.error('Please select an action');
      return;
    }
    
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve this report?'
      : 'Are you sure you want to reject this report?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await api.put(`/reports/${id}/status`, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        reviewComment: reviewComment,
        reviewedBy: user._id
      });
      
      toast.success(`Report ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      navigate('/reports'); // Changed to navigate to admin report list
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
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
            <div className="mt-4 text-slate-600 dark:text-slate-400">Loading report for review...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="mb-6">
            {/* Updated Back Button with Yellow Theme - Fixed to go to admin report list */}
            <button 
              onClick={() => navigate('/reports')}
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
                    Review Report: {report.title || 'Untitled Report'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Pending Review
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Engineer:</strong> {(() => {
                        // Try multiple fields for engineer name
                        if (report.inspector && typeof report.inspector === 'object') {
                          return report.inspector.name || report.inspector.email || 'Unknown Engineer';
                        }
                        if (report.createdBy && typeof report.createdBy === 'object') {
                          return report.createdBy.name || report.createdBy.email || 'Unknown Engineer';
                        }
                        if (report.engineer && typeof report.engineer === 'object') {
                          return report.engineer.name || report.engineer.email || 'Unknown Engineer';
                        }
                        return 'Unknown Engineer';
                      })()}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Site:</strong> {report.site?.name || 'Unknown Site'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Material:</strong> {report.materialTested}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Test Result:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        report.testResult === 'Pass' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {report.testResult}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Select Action</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAction('approve')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                      action === 'approve'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    <i className="fas fa-check mr-2"></i>
                    Approve Report
                  </button>
                  
                  <button
                    onClick={() => setAction('reject')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                      action === 'reject'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <i className="fas fa-times mr-2"></i>
                    Reject Report
                  </button>
                </div>
              </div>

              {/* Review Comment */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">
                  Review Comment <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter your detailed review comments here. This will be visible to the engineer."
                  className="w-full h-48 p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-800 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  required
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Please provide constructive feedback for the engineer.
                </p>
              </div>

              {/* Images Section */}
              {report.images && report.images.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Report Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.images.map((image, index) => {
                      const completeImageUrl = getCompleteImageUrl(image);
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={completeImageUrl}
                            alt={`Report image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300"
                            onError={(e) => {
                              e.target.src = getFallbackImageUrl(index);
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
              )}

              {/* Submit Review */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => navigate('/reports')}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-white dark:bg-slate-800 
                    border border-slate-200 dark:border-slate-700 
                    text-slate-700 dark:text-slate-300 
                    hover:bg-slate-100 dark:hover:bg-slate-700 
                    hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                    flex items-center"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || !action}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-slate-900
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]
                    flex items-center ${
                      (!reviewComment.trim() || !action) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}