const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Site = require('../models/Site');
const User = require('../models/User');

// Create a new report
const createReport = async (req, res) => {
  try {
    const { 
      site, 
      title, 
      materialTested, 
      testResult, 
      complianceStatus, 
      description, 
      findings, 
      recommendations, 
      comments, 
      images, 
      location,
      issues 
    } = req.body;

    // Validate required fields
    if (!site || !title || !materialTested || !testResult) {
      return res.status(400).json({ 
        message: 'Site, title, material tested, and test result are required' 
      });
    }

    // Check if user is an engineer
    if (req.user.role !== 'Engineer') {
      return res.status(403).json({ 
        message: 'Only engineers can create reports' 
      });
    }

    // Check if engineer is assigned to this site
    const siteDoc = await Site.findById(site);
    if (!siteDoc) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const isAssigned = siteDoc.assignedEngineers.some(engineerId => 
      engineerId.toString() === req.user._id.toString()
    );
    
    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'You are not assigned to this site' 
      });
    }

    const report = new Report({
      site,
      title,
      materialTested,
      testResult,
      complianceStatus: complianceStatus || 'Compliant',
      description: description || '',
      findings: findings || '',
      recommendations: recommendations || '',
      comments: comments || '',
      images: images || [],
      location: location || null,
      issues: issues || [],
      inspector: req.user._id,
      status: 'Pending'
    });
    
    await report.save();

    // Populate for response
    const populatedReport = await Report.findById(report._id)
      .populate('site', 'name location')
      .populate('inspector', 'name email');

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'report_created',
      resourceType: 'Report',
      resourceId: report._id,
      details: { 
        siteName: populatedReport.site?.name,
        reportTitle: title,
        testResult: testResult
      }
    });

    // Notify admins about new report
    req.io.emit('notification', {
      type: 'new_report',
      message: `New QA report submitted: ${title}`,
      reportId: report._id,
      siteId: site,
      submittedBy: req.user.name
    });

    res.status(201).json(populatedReport);
  } catch (err) {
    console.error('Report creation error:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Failed to create report' });
  }
};

// Get reports with filters
const getReports = async (req, res) => {
  try {
    console.log('GET /reports called');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    // Make sure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { site, status, inspector } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'Engineer') {
      // Engineers can only see their own reports
      query.inspector = req.user._id;
      console.log('Filtering for engineer:', req.user._id);
    } else if (req.user.role === 'Admin') {
      // Admins can see all reports, but can filter by inspector
      if (inspector) {
        query.inspector = inspector;
      }
    }
    // Viewer sees all reports (no filter)
    
    // Additional filters
    if (site && site !== 'undefined' && site !== 'null') {
      // Check if site is a valid ObjectId
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(site)) {
        query.site = site;
      } else {
        // If not a valid ObjectId, it might be a site name string
        // Find the corresponding site by name
        const foundSite = await Site.findOne({ name: site });
        if (foundSite) {
          query.site = foundSite._id;
        } else {
          // If site not found, use the string as is
          query.site = site;
        }
      }
    }
    
    if (status && status !== 'All' && status !== 'undefined' && status !== 'null') {
      query.status = status;
    }

    console.log('Final query:', query);

    // First, get reports without population to avoid CastError
    let reports = await Report.find(query)
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${reports.length} reports (before site population)`);

    // Now manually populate site for each report
    // This handles both ObjectId and string site values
    reports = await Promise.all(reports.map(async (report) => {
      const reportObj = report.toObject();
      
      // Handle site population
      if (report.site) {
        if (typeof report.site === 'object' && report.site._id) {
          // Site is already populated
          reportObj.site = {
            _id: report.site._id,
            name: report.site.name,
            location: report.site.location
          };
        } else if (typeof report.site === 'string') {
          // Site is stored as a string (inconsistent data)
          if (require('mongoose').Types.ObjectId.isValid(report.site)) {
            // It's a valid ObjectId string, try to populate
            const siteDoc = await Site.findById(report.site);
            if (siteDoc) {
              reportObj.site = {
                _id: siteDoc._id,
                name: siteDoc.name,
                location: siteDoc.location
              };
            } else {
              // Site not found by ID, use string as name
              reportObj.site = {
                _id: report.site,
                name: report.site,
                location: 'Unknown'
              };
            }
          } else {
            // It's a site name string (like "Site A - Downtown")
            // Try to find site by name
            const siteDoc = await Site.findOne({ name: report.site });
            if (siteDoc) {
              reportObj.site = {
                _id: siteDoc._id,
                name: siteDoc.name,
                location: siteDoc.location
              };
            } else {
              // Site not found, use string as name
              reportObj.site = {
                _id: null,
                name: report.site,
                location: 'Unknown'
              };
            }
          }
        }
      } else {
        // No site reference
        reportObj.site = {
          _id: null,
          name: 'Unknown Site',
          location: 'Unknown'
        };
      }
      
      return reportObj;
    }));

    console.log(`Returning ${reports.length} reports`);
    res.json(reports);
    
  } catch (err) {
    console.error('Error in getReports:', err);
    res.status(500).json({ message: 'Failed to fetch reports', error: err.message });
  }
};

// Get single report by ID
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('site', 'name location')
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (req.user.role === 'Engineer' && 
        report.inspector._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only view your own reports' 
      });
    }

    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
};

// Update report status (Approve/Reject) - Admin only
const updateReportStatus = async (req, res) => {
  try {
    const { status, reviewComment } = req.body;
    
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Valid status (Approved/Rejected) is required' 
      });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        message: 'Only admin can approve or reject reports' 
      });
    }

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report
    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.reviewComment = reviewComment || '';
    report.feedback = reviewComment || ''; // Keep for backward compatibility
    
    await report.save();

    // Populate for response
    const populatedReport = await Report.findById(report._id)
      .populate('site', 'name location')
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name email');

    // Log activity
    const action = status === 'Approved' ? 'report_approved' : 'report_rejected';
    await AuditLog.create({
      userId: req.user._id,
      action,
      resourceType: 'Report',
      resourceId: req.params.id,
      details: { 
        reportTitle: report.title,
        reviewComment: reviewComment 
      }
    });

    // Notify the engineer
    if (req.io) {
      req.io.to(report.inspector.toString()).emit('notification', {
        type: 'report_reviewed',
        message: `Your report "${report.title}" has been ${status.toLowerCase()}`,
        reportId: report._id,
        status: report.status,
        reviewComment: report.reviewComment,
        reviewedBy: req.user.name
      });
    }

    res.json(populatedReport);
  } catch (err) {
    console.error('Error updating report status:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Failed to update report status' });
  }
};

// Update report (for engineer to edit their own reports)
const updateReport = async (req, res) => {
  try {
    const { 
      title, 
      materialTested, 
      testResult, 
      complianceStatus, 
      description, 
      findings, 
      recommendations, 
      comments, 
      images, 
      location,
      issues 
    } = req.body;
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (req.user.role === 'Engineer') {
      // Engineers can only update their own reports
      if (report.inspector.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You can only update your own reports' 
        });
      }
      
      // Engineers can only update Pending or Rejected reports
      if (!['Pending', 'Rejected'].includes(report.status)) {
        return res.status(403).json({ 
          message: 'You can only update pending or rejected reports' 
        });
      }

      // Update report fields
      report.title = title || report.title;
      report.materialTested = materialTested || report.materialTested;
      report.testResult = testResult || report.testResult;
      report.complianceStatus = complianceStatus || report.complianceStatus;
      report.description = description !== undefined ? description : report.description;
      report.findings = findings !== undefined ? findings : report.findings;
      report.recommendations = recommendations !== undefined ? recommendations : report.recommendations;
      report.comments = comments !== undefined ? comments : report.comments;
      report.images = images || report.images;
      report.location = location || report.location;
      report.issues = issues || report.issues;
      
      // If report was Rejected, change status back to Pending when updated
      if (report.status === 'Rejected') {
        report.status = 'Pending';
        report.reviewedBy = null;
        report.reviewedAt = null;
        report.reviewComment = '';
        report.feedback = '';
      }
      
    } else if (req.user.role === 'Admin') {
      // Admins can update any field except inspector
      if (title) report.title = title;
      if (materialTested) report.materialTested = materialTested;
      if (testResult) report.testResult = testResult;
      if (complianceStatus) report.complianceStatus = complianceStatus;
      if (description !== undefined) report.description = description;
      if (findings !== undefined) report.findings = findings;
      if (recommendations !== undefined) report.recommendations = recommendations;
      if (comments !== undefined) report.comments = comments;
      if (images) report.images = images;
      if (location) report.location = location;
      if (issues) report.issues = issues;
    }

    await report.save();

    // Populate for response
    const populatedReport = await Report.findById(report._id)
      .populate('site', 'name location')
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name email');

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'report_updated',
      resourceType: 'Report',
      resourceId: req.params.id,
      details: { 
        reportTitle: report.title,
        updatedBy: req.user.role 
      }
    });

    // If engineer updated a rejected report, notify admin
    if (req.user.role === 'Engineer' && report.status === 'Pending' && req.io) {
      req.io.emit('notification', {
        type: 'report_updated',
        message: `Report "${report.title}" has been updated and re-submitted`,
        reportId: report._id,
        siteId: report.site,
        submittedBy: req.user.name
      });
    }

    res.json(populatedReport);
  } catch (err) {
    console.error('Error updating report:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Failed to update report' });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (req.user.role === 'Engineer' && 
        report.inspector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only delete your own reports' 
      });
    }

    await report.deleteOne();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'report_deleted',
      resourceType: 'Report',
      resourceId: req.params.id,
      details: { reportTitle: report.title }
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ message: 'Failed to delete report' });
  }
};

// Get reports by site (for admin dashboard)
const getReportsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;
    
    // Verify site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check permissions - only admin can see all reports for a site
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        message: 'Only admin can view all reports for a site' 
      });
    }

    const reports = await Report.find({ site: siteId })
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      site: {
        name: site.name,
        location: site.location,
        status: site.status
      },
      reports
    });
  } catch (err) {
    console.error('Error fetching reports by site:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

// Get engineer's reports for a specific site
const getMySiteReports = async (req, res) => {
  try {
    const { siteId } = req.params;
    
    if (req.user.role !== 'Engineer') {
      return res.status(403).json({ 
        message: 'Only engineers can view their site reports' 
      });
    }

    // Verify engineer is assigned to this site
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const isAssigned = site.assignedEngineers.some(engineerId => 
      engineerId.toString() === req.user._id.toString()
    );
    
    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'You are not assigned to this site' 
      });
    }

    const reports = await Report.find({ 
      site: siteId, 
      inspector: req.user._id 
    })
      .populate('site', 'name location')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('Error fetching my site reports:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

module.exports = { 
  createReport, 
  getReports, 
  getReportById,
  updateReportStatus,
  updateReport, 
  deleteReport,
  getReportsBySite,
  getMySiteReports
};