// routes/dashboard.js - UPDATED quality score calculation
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Site = require('../models/Site');
const Report = require('../models/Report');

// Get dashboard statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'Admin') {
      // ... (admin code remains the same) ...
      // Get all sites (admin can see all)
      const sites = await Site.find({});
      const siteIds = sites.map(site => site._id);
      
      // Get all reports
      const totalReports = await Report.countDocuments({});
      
      // Get pending reports
      const pendingReports = await Report.countDocuments({ 
        status: 'Pending'
      });
      
      // Get reports submitted in last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekReports = await Report.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });
      
      // Get active engineers (all engineers that are active)
      const activeEngineers = await User.countDocuments({
        role: 'Engineer',
        isActive: true
      });
      
      // Calculate compliance rate
      const compliantReports = await Report.countDocuments({
        complianceStatus: 'Compliant'
      });
      
      const complianceRate = totalReports > 0 
        ? Math.round((compliantReports / totalReports) * 100) 
        : 0;
      
      // Calculate approval rate
      const approvedReports = await Report.countDocuments({
        status: 'Approved'
      });
      
      const approvalRate = totalReports > 0 
        ? Math.round((approvedReports / totalReports) * 100) 
        : 0;
      
      // Calculate rejection rate
      const rejectedReports = await Report.countDocuments({
        status: 'Rejected'
      });
      
      // Calculate average response time
      const approvedReportsWithTimestamps = await Report.find({
        status: 'Approved',
        approvedAt: { $exists: true },
        createdAt: { $exists: true }
      }).select('createdAt approvedAt');
      
      let totalResponseHours = 0;
      let countWithResponse = 0;
      
      approvedReportsWithTimestamps.forEach(report => {
        if (report.approvedAt && report.createdAt) {
          const responseTimeMs = report.approvedAt - report.createdAt;
          const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
          totalResponseHours += responseTimeHours;
          countWithResponse++;
        }
      });
      
      const averageResponseTime = countWithResponse > 0 
        ? Math.round(totalResponseHours / countWithResponse) 
        : 24;
      
      // Get sites created by admin in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSites = await Site.countDocuments({
        createdBy: user._id,
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      // Get engineers deactivated in last 30 days
      const deactivatedEngineers = await User.countDocuments({
        role: 'Engineer',
        isActive: false,
        updatedAt: { $gte: thirtyDaysAgo }
      });
      
      res.json({
        totalSites: sites.length,
        totalReports,
        pendingReports,
        thisWeekReports,
        activeEngineers,
        complianceRate: `${complianceRate}%`,
        approvalRate: `${approvalRate}%`,
        compliantReports,
        approvedReports,
        rejectedReports,
        averageResponseTime: `${averageResponseTime}h`,
        recentSites,
        deactivatedEngineers,
        totalEngineers: await User.countDocuments({ role: 'Engineer' })
      });
      
    } else if (user.role === 'Engineer') {
      // Get assigned sites
      const assignedSites = await Site.find({ 
        assignedEngineers: user._id 
      });
      const siteIds = assignedSites.map(site => site._id);
      
      // Get reports for this engineer
      const totalReports = await Report.countDocuments({ 
        inspector: user._id 
      });
      
      // This month's reports
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const thisMonthReports = await Report.countDocuments({
        inspector: user._id,
        createdAt: { $gte: oneMonthAgo }
      });
      
      // Get pending reports
      const pendingReports = await Report.countDocuments({
        inspector: user._id,
        status: 'Pending'
      });
      
      // Get approved reports
      const approvedReports = await Report.countDocuments({
        inspector: user._id,
        status: 'Approved'
      });
      
      // Get rejected reports
      const rejectedReports = await Report.countDocuments({
        inspector: user._id,
        status: 'Rejected'
      });
      
      // Calculate approval rate
      const approvalRate = totalReports > 0 
        ? Math.round((approvedReports / totalReports) * 100) 
        : 0;
      
      // Calculate compliance rate for engineer's reports
      const compliantReports = await Report.countDocuments({
        inspector: user._id,
        complianceStatus: 'Compliant'
      });
      
      const complianceRate = totalReports > 0 
        ? Math.round((compliantReports / totalReports) * 100) 
        : 0;
      
      // Calculate average response time for this engineer
      const engineerApprovedReports = await Report.find({
        inspector: user._id,
        status: 'Approved',
        approvedAt: { $exists: true }
      }).select('createdAt approvedAt');
      
      let totalResponseHours = 0;
      let countWithResponse = 0;
      
      engineerApprovedReports.forEach(report => {
        if (report.approvedAt && report.createdAt) {
          const responseTimeMs = report.approvedAt - report.createdAt;
          const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
          totalResponseHours += responseTimeHours;
          countWithResponse++;
        }
      });
      
      const avgResponseTime = countWithResponse > 0 
        ? Math.round(totalResponseHours / countWithResponse)
        : 24;
      
      // FIXED: Calculate quality score properly (0-10 scale)
      // Weighted average: 70% compliance rate + 30% approval rate, scaled to 0-10
      let qualityScore = 0;
      if (totalReports > 0) {
        const weightedScore = (complianceRate * 0.7) + (approvalRate * 0.3);
        qualityScore = Math.round((weightedScore / 100) * 10 * 10) / 10; // 0-10 scale with 1 decimal
      }
      
      // Ensure quality score doesn't exceed 10
      qualityScore = Math.min(qualityScore, 10);
      
      // Get today's reports
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysReports = await Report.countDocuments({
        inspector: user._id,
        createdAt: { 
          $gte: today,
          $lt: tomorrow
        }
      });
      
      // Calculate completion percentage based on expected reports (1 per site per week)
      const weeksInMonth = 4.33; // Average weeks in a month
      const expectedReports = Math.ceil(assignedSites.length * weeksInMonth);
      const completionRate = expectedReports > 0 
        ? Math.min(Math.round((thisMonthReports / expectedReports) * 100), 100)
        : 0;
      
      // Calculate on-time submission rate
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const reportsWithDeadlines = await Report.find({
        inspector: user._id,
        createdAt: { $gte: lastMonth },
        dueDate: { $exists: true }
      }).select('createdAt dueDate');
      
      let onTimeReports = 0;
      reportsWithDeadlines.forEach(report => {
        if (report.createdAt <= report.dueDate) {
          onTimeReports++;
        }
      });
      
      const onTimeRate = reportsWithDeadlines.length > 0 
        ? Math.round((onTimeReports / reportsWithDeadlines.length) * 100)
        : 100;
      
      res.json({
        assignedSites: assignedSites.length,
        thisMonthReports,
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
        approvalRate: `${approvalRate}%`,
        complianceRate: `${complianceRate}%`,
        completionRate: `${completionRate}%`,
        avgResponseTime: `${avgResponseTime}h`,
        qualityScore: `${qualityScore}/10`, // Changed from /5 to /10
        todaysReports,
        compliantReports,
        onTimeRate: `${onTimeRate}%`,
        expectedReports
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to load dashboard statistics' });
  }
});

// Get recent activities - UPDATED with more activity types
router.get('/activities', protect, async (req, res) => {
  try {
    const user = req.user;
    let activities = [];
    
    if (user.role === 'Admin') {
      // 1. Get report review activities
      const reviewedReports = await Report.find({
        reviewedBy: user._id
      })
        .select('title status createdAt inspector site reviewedAt reviewNotes')
        .populate('inspector', 'name')
        .populate('site', 'name')
        .sort({ reviewedAt: -1 })
        .limit(10);
      
      const reportActivities = reviewedReports.map(report => ({
        id: report._id,
        action: `Report "${report.title}" ${report.status.toLowerCase()}`,
        user: user.name,
        timestamp: report.reviewedAt || report.updatedAt,
        icon: report.status === 'Approved' ? 'check' : 
              report.status === 'Rejected' ? 'times' : 'clock',
        type: report.status === 'Approved' ? 'success' : 
              report.status === 'Rejected' ? 'error' : 'warning',
        category: 'report_review',
        details: {
          status: report.status,
          reviewNotes: report.reviewNotes,
          reportId: report._id,
          siteId: report.site?._id,
          engineerName: report.inspector?.name
        }
      }));
      
      // 2. Get site creation activities
      const createdSites = await Site.find({ createdBy: user._id })
        .select('name createdAt status location')
        .sort({ createdAt: -1 })
        .limit(10);
      
      const siteActivities = createdSites.map(site => ({
        id: site._id,
        action: `Site "${site.name}" created`,
        user: user.name,
        timestamp: site.createdAt,
        icon: 'building',
        type: 'info',
        category: 'site_creation',
        details: {
          status: site.status,
          location: site.location,
          siteId: site._id
        }
      }));
      
      // 3. Get engineer management activities
      const managedEngineers = await User.find({
        role: 'Engineer',
        $or: [
          { createdBy: user._id },
          { updatedBy: user._id }
        ]
      })
        .select('name email isActive createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(10);
      
      const engineerActivities = managedEngineers.map(engineer => ({
        id: engineer._id,
        action: `Engineer ${engineer.name} ${engineer.isActive ? 'activated' : 'deactivated'}`,
        user: user.name,
        timestamp: engineer.updatedAt || engineer.createdAt,
        icon: engineer.isActive ? 'user-check' : 'user-times',
        type: engineer.isActive ? 'success' : 'error',
        category: 'engineer_management',
        details: {
          engineerId: engineer._id,
          engineerName: engineer.name,
          isActive: engineer.isActive,
          email: engineer.email
        }
      }));
      
      // 4. Get recent report submissions (even if not reviewed yet)
      const recentReports = await Report.find({})
        .select('title status createdAt inspector site complianceStatus')
        .populate('inspector', 'name')
        .populate('site', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
      
      const submissionActivities = recentReports.map(report => ({
        id: report._id,
        action: `Report "${report.title}" submitted for ${report.site?.name || 'Unknown Site'}`,
        user: report.inspector?.name || 'Unknown Engineer',
        timestamp: report.createdAt,
        icon: 'file-alt',
        type: 'info',
        category: 'report_submission',
        details: {
          status: report.status,
          compliance: report.complianceStatus,
          reportId: report._id,
          siteId: report.site?._id
        }
      }));
      
      // Combine all activities and sort by timestamp
      activities = [
        ...reportActivities,
        ...siteActivities,
        ...engineerActivities,
        ...submissionActivities
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15);
      
    } else if (user.role === 'Engineer') {
      // 1. Get engineer's report submissions
      const recentReports = await Report.find({
        inspector: user._id
      })
        .select('title status createdAt site complianceStatus testResult reviewedAt')
        .populate('site', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
      
      const reportActivities = recentReports.map(report => ({
        id: report._id,
        action: `Report "${report.title}" ${report.status === 'Pending' ? 'submitted' : report.status.toLowerCase()} for ${report.site?.name || 'Unknown Site'}`,
        user: user.name,
        timestamp: report.status === 'Pending' ? report.createdAt : (report.reviewedAt || report.updatedAt),
        icon: report.status === 'Approved' ? 'check' : 
              report.status === 'Rejected' ? 'times' : 
              report.status === 'Pending' ? 'clock' : 'file-alt',
        type: report.status === 'Approved' ? 'success' : 
              report.status === 'Rejected' ? 'error' : 
              report.status === 'Pending' ? 'warning' : 'info',
        category: 'report_submission',
        details: {
          status: report.status,
          result: report.testResult,
          compliance: report.complianceStatus,
          reportId: report._id,
          siteName: report.site?.name,
          reviewedAt: report.reviewedAt
        }
      }));
      
      // 2. Get site assignments
      const recentAssignments = await Site.find({
        assignedEngineers: user._id
      })
        .select('name createdAt status location')
        .sort({ createdAt: -1 })
        .limit(5);
      
      const assignmentActivities = recentAssignments.map(site => ({
        id: site._id,
        action: `Assigned to site "${site.name}"`,
        user: 'System',
        timestamp: site.createdAt,
        icon: 'user-plus',
        type: 'info',
        category: 'site_assignment',
        details: {
          status: site.status,
          location: site.location,
          siteId: site._id
        }
      }));
      
      // 3. Get profile updates
      const profileUpdates = [{
        id: user._id,
        action: 'Profile updated',
        user: user.name,
        timestamp: user.updatedAt || user.createdAt,
        icon: 'user-edit',
        type: 'info',
        category: 'profile_update',
        details: {
          lastLogin: user.lastLogin,
          email: user.email
        }
      }];
      
      activities = [
        ...reportActivities,
        ...assignmentActivities,
        ...profileUpdates
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    }
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

// Get engineer's recent reports
router.get('/recent-reports', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Engineer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const recentReports = await Report.find({
      inspector: req.user._id
    })
      .select('title status createdAt site testResult complianceStatus materialTested reviewedAt reviewNotes')
      .populate('site', 'name location')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(recentReports);
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    res.status(500).json({ message: 'Failed to load recent reports' });
  }
});

// Get engineer's assigned sites
router.get('/assigned-sites', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Engineer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const assignedSites = await Site.find({
      assignedEngineers: req.user._id
    })
      .select('name location status progress startDate lastInspection')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(assignedSites);
  } catch (error) {
    console.error('Error fetching assigned sites:', error);
    res.status(500).json({ message: 'Failed to load assigned sites' });
  }
});

module.exports = router;