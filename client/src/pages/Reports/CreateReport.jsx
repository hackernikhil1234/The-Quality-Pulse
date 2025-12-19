// pages/Reports/CreateReport.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { FiArrowLeft } from 'react-icons/fi';

export default function CreateReport() {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  
  const siteId = searchParams.get('site');
  const siteName = searchParams.get('siteName');
  const editReportId = searchParams.get('edit');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    site: siteId || '',
    title: '',
    materialTested: '',
    testResult: 'Pass',
    complianceStatus: 'Compliant',
    description: '',
    findings: '',
    recommendations: '',
    comments: '',
    images: [],
    issues: []
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sites, setSites] = useState([]);
  const [newIssue, setNewIssue] = useState({ description: '', severity: 'Medium' });
  const [imageFiles, setImageFiles] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalReport, setOriginalReport] = useState(null);
  const [isFormHovered, setIsFormHovered] = useState(false);

  // Load sites assigned to the engineer
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.get('/sites');
        
        // Filter sites assigned to this engineer
        const assignedSites = res.data.filter(site => {
          if (!site.assignedEngineers || !Array.isArray(site.assignedEngineers)) {
            return false;
          }
          
          return site.assignedEngineers.some(engineer => {
            const engineerId = typeof engineer === 'object' ? engineer._id : engineer;
            const userId = user?._id;
            return engineerId === userId;
          });
        });
        
        setSites(assignedSites);
        
        // If siteId is provided in URL, set it
        if (siteId && !formData.site) {
          setFormData(prev => ({ ...prev, site: siteId }));
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
        toast.error('Failed to load sites');
      }
    };

    // Load existing report data if in edit mode
    const loadExistingReport = async () => {
      const reportId = id || editReportId;
      if (reportId) {
        try {
          setIsEditMode(true);
          const res = await api.get(`/reports/${reportId}`);
          const report = res.data;
          setOriginalReport(report);
          
          // Pre-fill form with existing report data
          // Make sure image URLs are complete
          const completeImages = report.images ? report.images.map(img => 
            img.startsWith('/uploads/') ? `http://localhost:5000${img}` : img
          ) : [];
          
          setFormData({
            site: report.site?._id || report.site || '',
            title: report.title || '',
            materialTested: report.materialTested || '',
            testResult: report.testResult || 'Pass',
            complianceStatus: report.complianceStatus || 'Compliant',
            description: report.description || '',
            findings: report.findings || '',
            recommendations: report.recommendations || '',
            comments: report.comments || '',
            images: report.images || [],
            issues: report.issues || []
          });
          
          toast.success('Loaded existing report for editing');
        } catch (error) {
          console.error('Error loading report:', error);
          toast.error('Failed to load report data');
          navigate('/reports');
        }
      }
    };

    if (user?.role === 'Engineer') {
      fetchSites();
      loadExistingReport();
    }
  }, [user, siteId, formData.site, id, editReportId, navigate]);

  // Common materials for dropdown
  const materials = [
    'Concrete Strength Test',
    'Steel Reinforcement',
    'Brickwork Quality',
    'Welding Inspection',
    'Soil Compaction',
    'Paint Application',
    'Electrical Wiring',
    'Plumbing Installation',
    'Structural Steel',
    'Foundation Work',
    'Roofing Material',
    'Window Installation',
    'HVAC System',
    'Fire Safety System'
  ];

  // Add a new issue
  const addIssue = () => {
    if (!newIssue.description.trim()) {
      toast.error('Issue description is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      issues: [...prev.issues, { 
        description: newIssue.description.trim(),
        severity: newIssue.severity 
      }]
    }));
    setNewIssue({ description: '', severity: 'Medium' });
  };

  // Remove an issue
  const removeIssue = (index) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  // Upload images to server
  const uploadImages = async (files) => {
    if (files.length === 0) return [];
    
    try {
      setUploadingImages(true);
      const formData = new FormData();
      
      // Add each file to FormData
      files.forEach(file => {
        formData.append('images', file);
      });
      
      // Upload to server
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.files || [];
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form data:', formData);
    
    if (!formData.site) {
      toast.error('Please select a site');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Report title is required');
      return;
    }
    
    if (!formData.materialTested.trim()) {
      toast.error('Material tested is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload new images if any
      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        toast.loading('Uploading images...');
        uploadedImageUrls = await uploadImages(imageFiles);
        toast.dismiss();
        
        if (uploadedImageUrls.length === 0) {
          toast.error('Failed to upload images');
          setLoading(false);
          return;
        }
      }
      
      // Combine existing images with newly uploaded ones
      const existingImages = formData.images.filter(img => 
        typeof img === 'string' && !img.startsWith('blob:')
      );
      
      const allImages = [...existingImages, ...uploadedImageUrls];
      
      const reportData = {
        site: formData.site,
        title: formData.title.trim(),
        materialTested: formData.materialTested.trim(),
        testResult: formData.testResult,
        complianceStatus: formData.complianceStatus,
        description: formData.description.trim(),
        findings: formData.findings.trim(),
        recommendations: formData.recommendations.trim(),
        comments: formData.comments.trim(),
        issues: formData.issues.map(issue => ({
          description: issue.description,
          severity: issue.severity
        })),
        images: allImages
      };
      
      console.log('Submitting report data:', reportData);
      
      let response;
      
      if (isEditMode && (id || editReportId)) {
        // Update existing report
        const reportId = id || editReportId;
        console.log('Updating report:', reportId, reportData);
        response = await api.put(`/reports/${reportId}`, reportData);
        console.log('Report updated successfully:', response.data);
        toast.success('Report updated successfully!');
      } else {
        // Create new report
        console.log('Creating new report:', reportData);
        response = await api.post('/reports', reportData);
        console.log('Report created successfully:', response.data);
        toast.success('Report created successfully!');
      }
      
      navigate('/reports');
    } catch (err) {
      console.error('Report submission error:', err);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 images
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    // Check file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Some images exceed 5MB limit');
      return;
    }
    
    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs for display
    const newImagePreviews = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImagePreviews]
    }));
  };

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

  // If not engineer, redirect
  if (user?.role !== 'Engineer') {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8 text-center">
            <div className="text-gray-600 dark:text-gray-400">
              Only engineers can create reports
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-6 flex items-start gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-shrink-0 mt-1 p-2 rounded-lg transition-all duration-200 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700
                text-yellow-600 dark:text-yellow-500  
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                hover:text-yellow-700 dark:hover:text-yellow-400"
              title="Back to Dashboard"
            >
              <FiArrowLeft className="text-lg" />
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {isEditMode ? 'Edit QA Report' : 'Create QA Report'}
                </h1>
                {originalReport?.status === 'Rejected' && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded uppercase font-bold tracking-wider">
                    Re-submitting Rejected Report
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {siteName ? `For site: ${siteName}` : isEditMode ? 'Edit existing report' : 'Create a new quality assurance report'}
              </p>
              {originalReport && (
                <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
                  {originalReport.status === 'Rejected' 
                    ? 'This report was rejected. Please review and update the information before re-submitting.'
                    : 'Editing existing report. Changes will update the current report.'}
                </div>
              )}
            </div>
          </div>
          
          <form 
            onSubmit={handleSubmit} 
            onMouseEnter={() => setIsFormHovered(true)}
            onMouseLeave={() => setIsFormHovered(false)}
            className={`space-y-6 p-4 md:p-6 transition-all duration-300
              bg-white dark:bg-slate-800 
              border border-slate-200 dark:border-slate-700 
              rounded-lg 
              ${isFormHovered 
                ? 'shadow-xl shadow-yellow-500/50 border-yellow-500/30' 
                : 'shadow-lg'
              }`}
          >
            <div className="space-y-4">
              {/* Site Selection */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Site *
                </label>
                <select
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30
                    disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500"
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  required
                  disabled={!!siteId || isEditMode}
                >
                  <option value="">Select Site</option>
                  {sites.map(site => (
                    <option key={site._id} value={site._id}>
                      {site.name} - {site.location || `${site.city}, ${site.country}`}
                    </option>
                  ))}
                </select>
                {sites.length === 0 && user?.role === 'Engineer' && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    No sites assigned to you. Please contact your administrator.
                  </p>
                )}
              </div>

              {/* Report Title */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  placeholder="Enter report title (e.g., Concrete Strength Test - Block A)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Material Tested */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Material/Test Performed *
                </label>
                <select
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  value={formData.materialTested}
                  onChange={(e) => setFormData({ ...formData, materialTested: e.target.value })}
                  required
                >
                  <option value="">Select Material/Test</option>
                  {materials.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              {/* Test Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Test Result *
                  </label>
                  <select
                    className="w-full p-3 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-900 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    value={formData.testResult}
                    onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                    required
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Compliance Status
                  </label>
                  <select
                    className="w-full p-3 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-900 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    value={formData.complianceStatus}
                    onChange={(e) => setFormData({ ...formData, complianceStatus: e.target.value })}
                  >
                    <option value="Compliant">Compliant</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  placeholder="Describe the test performed, location, and conditions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              {/* Findings */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Findings
                </label>
                <textarea
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  placeholder="Record your observations and findings..."
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  rows="3"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recommendations
                </label>
                <textarea
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  placeholder="Provide recommendations for corrective actions..."
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows="3"
                />
              </div>

              {/* Issues Section */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Issues Found (Optional)
                </label>
                <div className="space-y-3 mb-4">
                  {formData.issues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 
                      bg-red-500/10 dark:bg-red-500/20 
                      border border-red-500/20 dark:border-red-500/30 
                      rounded-lg">
                      <div>
                        <p className="font-medium text-red-700 dark:text-red-300">
                          {issue.description}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Severity: {issue.severity}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIssue(index)}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400
                          hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded"
                        title="Remove issue"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Issue Form */}
                <div className="space-y-3 p-3 
                  border border-slate-300 dark:border-slate-700 
                  rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <textarea
                    className="w-full p-3 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-800 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    placeholder="Describe the issue..."
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    rows="2"
                  />
                  <div className="flex items-center gap-4">
                    <select
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-800 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                      value={newIssue.severity}
                      onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <button
                      type="button"
                      onClick={addIssue}
                      className="px-4 py-3 rounded-lg font-medium transition-all duration-200
                        bg-slate-100 dark:bg-slate-700 
                        border border-slate-300 dark:border-slate-600
                        text-slate-700 dark:text-slate-300 
                        hover:bg-slate-200 dark:hover:bg-slate-600
                        hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                        hover:text-slate-900 dark:hover:text-white"
                    >
                      Add Issue
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  className="w-full p-3 rounded-lg transition-all duration-200
                    bg-white dark:bg-slate-900 
                    border border-slate-300 dark:border-slate-600 
                    text-slate-700 dark:text-slate-300
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                  placeholder="Any additional comments or notes..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows="3"
                />
              </div>

              {/* Images Upload and Preview */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Upload Images (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full p-3 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-900 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      file:mr-4 file:py-2.5 file:px-4 file:rounded-md
                      file:border-0 file:font-medium file:text-sm
                      file:bg-slate-100 dark:file:bg-slate-800
                      file:text-slate-700 dark:file:text-slate-300
                      file:border-slate-300 dark:file:border-slate-600
                      hover:file:bg-slate-200 dark:hover:file:bg-slate-700
                      hover:file:border-yellow-500/50 dark:hover:file:border-yellow-500/50
                      hover:file:text-slate-900 dark:hover:file:text-white
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    disabled={uploadingImages}
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Upload photos related to the test/issue (max 5 images, 5MB each)
                </p>

                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isEditMode ? 'Current Images' : 'Image Previews'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => {
                        // Check if it's a blob URL (preview) or server URL
                        const isBlobUrl = image.startsWith('blob:');
                        
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                              onError={(e) => {
                                // If it's a server URL that fails, try to construct full URL
                                if (!isBlobUrl && !image.startsWith('http')) {
                                  e.target.src = `http://localhost:5000${image}`;
                                } else {
                                  e.target.src = getFallbackImageUrl(index);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                // Remove image preview
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index)
                                }));
                                
                                // Also remove from imageFiles if it's a new file (blob URL)
                                if (isBlobUrl) {
                                  setImageFiles(prev => {
                                    const newFiles = [...prev];
                                    newFiles.splice(index, 1);
                                    return newFiles;
                                  });
                                }
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="w-full py-3 text-lg font-medium rounded-lg transition-all duration-200
                  bg-gradient-to-r from-yellow-500 to-yellow-600 
                  text-slate-900
                  hover:from-yellow-600 hover:to-yellow-700 
                  hover:shadow-lg hover:shadow-yellow-500/25
                  active:scale-[0.99] 
                  disabled:from-yellow-300 disabled:to-yellow-400 disabled:cursor-not-allowed
                  disabled:shadow-none
                  flex items-center justify-center"
              >
                {(loading || uploadingImages) ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadingImages ? 'Uploading Images...' : isEditMode ? 'Updating Report...' : 'Creating Report...'}
                  </>
                ) : (
                  isEditMode ? 'Update Report' : 'Submit Report'
                )}
              </button>
              
              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200
                    text-yellow-600 dark:text-yellow-500 
                    hover:text-yellow-700 dark:hover:text-yellow-400
                    hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                >
                  Cancel and return to reports
                </button>
                {isEditMode && originalReport && (
                  <a 
                    href={`/reports/${originalReport._id}`}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200
                      text-slate-600 dark:text-slate-400 
                      hover:text-slate-800 dark:hover:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  >
                    View original report
                  </a>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}