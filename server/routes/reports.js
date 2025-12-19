const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');
const Report = require('../models/Report');
const Site = require('../models/Site');
const User = require('../models/User');

// All routes require authentication
router.use(protect);

// Create report - Engineer only
router.post('/', authorize('Engineer'), async (req, res) => {
  try {
    console.log('Creating report with data:', req.body);
    console.log('User ID:', req.user._id);
    console.log('User role:', req.user.role);

    // Validate required fields
    if (!req.body.site) {
      return res.status(400).json({ message: 'Site is required' });
    }

    if (!req.body.title) {
      return res.status(400).json({ message: 'Report title is required' });
    }

    if (!req.body.materialTested) {
      return res.status(400).json({ message: 'Material tested is required' });
    }

    if (!req.body.testResult) {
      return res.status(400).json({ message: 'Test result is required' });
    }

    // Validate site exists
    const site = await Site.findById(req.body.site);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    console.log('Site found:', site.name);
    console.log('Assigned engineers:', site.assignedEngineers);

    // Verify engineer is assigned to this site
    const isAssigned = site.assignedEngineers.some(engineerId => {
      const engineerIdStr = engineerId.toString();
      const userIdStr = req.user._id.toString();
      console.log(`Comparing engineerId: ${engineerIdStr} with userId: ${userIdStr}`);
      return engineerIdStr === userIdStr;
    });
    
    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'You are not assigned to this site. Please contact your administrator.' 
      });
    }

    // Prepare report data with proper status
    const reportData = {
      ...req.body,
      inspector: req.user._id,
      status: 'Pending' // Use 'Pending' to match the enum
    };

    console.log('Creating report with data:', reportData);

    // Create report
    const report = await Report.create(reportData);

    console.log('Report created successfully:', report._id);

    // Populate for response
    const populatedReport = await Report.findById(report._id)
      .populate('site', 'name location city country')
      .populate('inspector', 'name email');

    // Get io instance
    const io = req.app.get('io');
    console.log('IO instance available for notifications:', !!io);

    // Notify admin about new report
    try {
      if (io) {
        await NotificationService.notifyAdminNewReport(report._id, io);
        console.log('✅ Admin notification sent via socket');
      } else {
        console.warn('⚠️ Cannot send notification: io instance not available');
      }
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
      // Don't fail the report creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report: populatedReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: messages 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Duplicate report found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all reports (filtered by role)
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'Engineer') {
      // Engineers can only see their own reports
      query.inspector = req.user._id;
    } else if (req.user.role === 'Admin') {
      // Admins can see all reports
      // No filter needed
    }
    
    // Optional filters
    if (req.query.site) {
      query.site = req.query.site;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const reports = await Report.find(query)
      .populate('site', 'name location')
      .populate('inspector', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('site', 'name location city country exactAddress')
      .populate('inspector', 'name email avatar')
      .populate('reviewedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check permissions
    if (req.user.role === 'Engineer' && report.inspector._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
});

// Update report status (Approve/Reject) - Admin only
router.put('/:id/status', authorize('Admin'), async (req, res) => {
  try {
    const { status, reviewComment } = req.body;
    
    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either "Approved" or "Rejected"' });
    }

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report
    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.reviewComment = reviewComment;
    
    await report.save();

    // Notify engineer about review
    try {
      const io = req.app.get('io');
      await NotificationService.notifyReportReviewed(report._id, status.toLowerCase(), req.user._id, io);
      console.log('Engineer notification sent');
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }

    res.json({
      success: true,
      message: `Report ${status.toLowerCase()} successfully`,
      report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Failed to update report status' });
  }
});

// Update report content (Engineer can update their own, Admin can update any)
router.put('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check permissions
    if (req.user.role === 'Engineer' && report.inspector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own reports' });
    }
    
    // Update report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('site', 'name location')
      .populate('inspector', 'name email');
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check permissions
    if (req.user.role === 'Engineer' && report.inspector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reports' });
    }
    
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Report deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

// Get reports by site ID (Admin only - all reports for a site)
router.get('/site/:siteId', authorize('Admin'), async (req, res) => {
  try {
    const reports = await Report.find({ site: req.params.siteId })
      .populate('inspector', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching site reports:', error);
    res.status(500).json({ message: 'Failed to fetch site reports' });
  }
});

// Get engineer's reports for a specific site
router.get('/mysite/:siteId', authorize('Engineer'), async (req, res) => {
  try {
    const reports = await Report.find({ 
      site: req.params.siteId,
      inspector: req.user._id 
    })
      .populate('site', 'name location')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching my site reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports for this site' });
  }
});

module.exports = router;