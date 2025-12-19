const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Site = require('../models/Site');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect);
router.use(authorize('Admin'));

// Get all engineers assigned by current admin
router.get('/engineers', async (req, res) => {
  try {
    const engineers = await User.find({ 
      role: 'Engineer'
    })
      .select('-password')
      .populate('assignedSites', 'name location status')
      .sort({ createdAt: -1 });

    // Filter engineers who are assigned to sites created by this admin
    const adminSites = await Site.find({ createdBy: req.user._id });
    
    const engineersWithAssignedSites = engineers.map(engineer => {
      // Find sites where this engineer is assigned AND created by this admin
      const assignedSites = adminSites.filter(site => 
        site.assignedEngineers?.some(engId => engId.toString() === engineer._id.toString())
      );
      
      return {
        ...engineer.toObject(),
        assignedSites: assignedSites,
        siteCount: assignedSites.length
      };
    });

    res.json(engineersWithAssignedSites);
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ message: 'Failed to fetch engineers' });
  }
});

// Get detailed engineer information
router.get('/engineers/:id/details', async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id)
      .select('-password');

    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    // Get sites where this engineer is assigned AND created by current admin
    const assignedSites = await Site.find({
      assignedEngineers: req.params.id,
      createdBy: req.user._id
    }).select('name location status progress startDate endDate');

    // Get reports submitted by this engineer for sites created by current admin
    const reports = await Report.find({
      inspector: req.params.id,
      site: { $in: assignedSites.map(site => site._id) }
    })
      .populate('site', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate report statistics
    const totalReports = await Report.countDocuments({
      inspector: req.params.id,
      site: { $in: assignedSites.map(site => site._id) }
    });

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const recentReports = await Report.find({
      inspector: req.params.id,
      createdAt: { $gte: thisMonth },
      site: { $in: assignedSites.map(site => site._id) }
    });

    // Calculate pass/fail statistics
    const passReports = reports.filter(r => r.testResult === 'Pass').length;
    const failReports = reports.filter(r => r.testResult === 'Fail').length;
    const pendingReports = reports.filter(r => r.status === 'Pending').length;
    const approvedReports = reports.filter(r => r.status === 'Approved').length;
    const rejectedReports = reports.filter(r => r.status === 'Rejected').length;

    const reportStats = {
      total: totalReports,
      thisMonth: recentReports.length,
      pass: passReports,
      fail: failReports,
      pending: pendingReports,
      approved: approvedReports,
      rejected: rejectedReports,
      passRate: totalReports > 0 ? ((passReports / totalReports) * 100).toFixed(1) + '%' : '0%'
    };

    // Calculate compliance score
    const compliantReports = reports.filter(r => r.complianceStatus === 'Compliant').length;
    const complianceScore = totalReports > 0 
      ? ((compliantReports / totalReports) * 100).toFixed(1) + '%' 
      : '0%';

    // Get recent activities (last 5 reports)
    const recentActivities = reports.slice(0, 5).map(report => ({
      id: report._id,
      title: report.title,
      site: report.site?.name || 'Unknown Site',
      result: report.testResult,
      status: report.status,
      date: report.createdAt,
      materialTested: report.materialTested
    }));

    res.json({
      ...engineer.toObject(),
      assignedSites,
      reports: reports.slice(0, 10),
      reportStats,
      complianceScore,
      recentActivities,
      performanceMetrics: {
        averageResponseTime: '24h',
        issueResolutionRate: '92%',
        qualityScore: complianceScore
      }
    });
  } catch (error) {
    console.error('Error fetching engineer details:', error);
    res.status(500).json({ message: 'Failed to fetch engineer details' });
  }
});

// Update engineer status (active/inactive) - LEGACY endpoint
router.put('/engineers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: 'Status must be a boolean (true/false)' });
    }

    const engineer = await User.findById(req.params.id);
    
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    if (engineer.role === 'Admin') {
      return res.status(403).json({ message: 'Cannot modify admin status' });
    }

    engineer.isActive = status;
    await engineer.save();

    res.json({
      _id: engineer._id,
      name: engineer.name,
      email: engineer.email,
      isActive: engineer.isActive,
      role: engineer.role
    });
  } catch (error) {
    console.error('Error updating engineer status:', error);
    res.status(500).json({ message: 'Failed to update engineer status' });
  }
});

// NEW: Deactivate engineer with reason
router.put('/engineers/:id/deactivate', async (req, res) => {
  try {
    const { reason, deactivatedBy } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required for deactivation' });
    }

    const engineer = await User.findById(req.params.id);
    
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    if (engineer.role === 'Admin') {
      return res.status(403).json({ message: 'Cannot deactivate admin user' });
    }

    // Update engineer status and deactivation info
    engineer.isActive = false;
    engineer.deactivationInfo = {
      reason: reason.trim(),
      deactivatedBy: req.user._id,
      deactivatedByName: req.user.name,
      deactivatedAt: new Date()
    };
    
    // Clear activation info if exists
    engineer.activationInfo = undefined;
    
    await engineer.save();

    // Log the action (you can create an AuditLog model later)
    console.log(`Engineer deactivated: ${engineer.email} by ${req.user.name}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Engineer deactivated successfully',
      engineer: {
        _id: engineer._id,
        name: engineer.name,
        email: engineer.email,
        isActive: engineer.isActive,
        deactivationInfo: engineer.deactivationInfo
      }
    });
  } catch (error) {
    console.error('Error deactivating engineer:', error);
    res.status(500).json({ message: 'Failed to deactivate engineer' });
  }
});

// NEW: Activate engineer
router.put('/engineers/:id/activate', async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id);
    
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    if (engineer.role === 'Admin') {
      return res.status(403).json({ message: 'Cannot activate admin user' });
    }

    // Update engineer status and activation info
    engineer.isActive = true;
    engineer.activationInfo = {
      activatedBy: req.user._id,
      activatedByName: req.user.name,
      activatedAt: new Date()
    };
    
    // Clear deactivation info if exists
    engineer.deactivationInfo = undefined;
    
    await engineer.save();

    // Log the action
    console.log(`Engineer activated: ${engineer.email} by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Engineer activated successfully',
      engineer: {
        _id: engineer._id,
        name: engineer.name,
        email: engineer.email,
        isActive: engineer.isActive,
        activationInfo: engineer.activationInfo
      }
    });
  } catch (error) {
    console.error('Error activating engineer:', error);
    res.status(500).json({ message: 'Failed to activate engineer' });
  }
});

// Delete engineer
router.delete('/engineers/:id', async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id);

    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    if (engineer.role === 'Admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    // Remove engineer from all assigned sites (created by this admin)
    await Site.updateMany(
      { 
        assignedEngineers: req.params.id,
        createdBy: req.user._id 
      },
      { $pull: { assignedEngineers: req.params.id } }
    );

    // Update reports to mark as archived
    await Report.updateMany(
      { inspector: req.params.id },
      { 
        $set: { 
          status: 'Rejected',
          feedback: 'Report archived - Engineer account deleted'
        }
      }
    );

    await engineer.deleteOne();

    res.json({ 
      message: 'Engineer deleted successfully',
      engineerId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting engineer:', error);
    res.status(500).json({ message: 'Failed to delete engineer' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    // Get all engineers
    const engineersCount = await User.countDocuments({ 
      role: 'Engineer',
      isActive: true
    });

    // Get sites created by this admin
    const sites = await Site.find({ 
      createdBy: req.user._id 
    });
    
    const sitesCount = sites.length;
    const activeSites = sites.filter(site => site.status === 'Active').length;

    // Get reports for sites created by this admin
    const siteIds = sites.map(site => site._id);
    const reports = await Report.find({ site: { $in: siteIds } });
    
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'Pending').length;
    const approvedReports = reports.filter(r => r.status === 'Approved').length;
    const rejectedReports = reports.filter(r => r.status === 'Rejected').length;
    const passReports = reports.filter(r => r.testResult === 'Pass').length;
    const failReports = reports.filter(r => r.testResult === 'Fail').length;
    const complianceRate = totalReports > 0 
      ? ((reports.filter(r => r.complianceStatus === 'Compliant').length / totalReports) * 100).toFixed(1) + '%'
      : '0%';

    // Get recent activities (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentActivities = await Report.find({
      site: { $in: siteIds },
      createdAt: { $gte: weekAgo }
    })
      .select('title status testResult createdAt materialTested')
      .populate('site', 'name')
      .populate('inspector', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalEngineers: engineersCount,
      totalSites: sitesCount,
      activeSites: activeSites,
      totalReports: totalReports,
      pendingReports: pendingReports,
      approvedReports: approvedReports,
      rejectedReports: rejectedReports,
      passReports: passReports,
      failReports: failReports,
      complianceRate: complianceRate,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        title: activity.title,
        status: activity.status,
        result: activity.testResult,
        material: activity.materialTested,
        date: activity.createdAt,
        site: activity.site?.name || 'Unknown Site',
        engineer: activity.inspector?.name || 'Unknown Engineer'
      }))
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get all users (for user management)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role isActive createdAt lastLogin deactivationInfo activationInfo')
      .sort({ createdAt: -1 });
    
    // Add assigned sites count for engineers
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      if (user.role === 'Engineer') {
        // Get sites where this engineer is assigned
        const assignedSites = await Site.find({
          assignedEngineers: user._id,
          createdBy: req.user._id
        });
        
        userObj.assignedSitesCount = assignedSites.length;
        userObj.reportCount = await Report.countDocuments({ inspector: user._id });
      }
      
      return userObj;
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all sites created by admin
router.get('/sites', async (req, res) => {
  try {
    const sites = await Site.find({ createdBy: req.user._id })
      .populate('assignedEngineers', 'name email')
      .sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ message: 'Failed to fetch sites' });
  }
});

// Assign site to engineer
router.post('/assign-site', async (req, res) => {
  try {
    const { siteId, engineerId } = req.body;

    const site = await Site.findById(siteId);
    const engineer = await User.findById(engineerId);

    if (!site || !engineer) {
      return res.status(404).json({ message: 'Site or engineer not found' });
    }

    // Check if admin owns the site
    if (site.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign this site' });
    }

    // Check if user is an engineer
    if (engineer.role !== 'Engineer') {
      return res.status(400).json({ message: 'Can only assign sites to engineers' });
    }

    // Check if engineer is active
    if (!engineer.isActive) {
      return res.status(400).json({ message: 'Cannot assign site to inactive engineer' });
    }

    // Add engineer to site if not already assigned
    if (!site.assignedEngineers.some(engId => engId.toString() === engineerId)) {
      site.assignedEngineers.push(engineerId);
      await site.save();
    }

    res.json({
      message: 'Site assigned successfully',
      site: {
        id: site._id,
        name: site.name,
        assignedEngineers: site.assignedEngineers
      },
      engineer: {
        id: engineer._id,
        name: engineer.name,
        email: engineer.email
      }
    });
  } catch (error) {
    console.error('Error assigning site:', error);
    res.status(500).json({ message: 'Failed to assign site' });
  }
});

// Remove engineer from site
router.post('/unassign-site', async (req, res) => {
  try {
    const { siteId, engineerId } = req.body;

    const site = await Site.findById(siteId);

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if admin owns the site
    if (site.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this site' });
    }

    // Remove engineer from site
    site.assignedEngineers = site.assignedEngineers.filter(
      engId => engId.toString() !== engineerId
    );
    
    await site.save();

    res.json({
      message: 'Engineer unassigned successfully',
      site: {
        id: site._id,
        name: site.name,
        assignedEngineers: site.assignedEngineers
      }
    });
  } catch (error) {
    console.error('Error unassigning site:', error);
    res.status(500).json({ message: 'Failed to unassign engineer from site' });
  }
});

// Update site status
router.put('/sites/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['Active', 'Paused', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if admin owns the site
    if (site.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this site' });
    }

    site.status = status;
    
    // If marking as completed, set end date
    if (status === 'Completed' && !site.endDate) {
      site.endDate = new Date();
    }
    
    await site.save();

    res.json({
      message: 'Site status updated successfully',
      site: {
        id: site._id,
        name: site.name,
        status: site.status,
        endDate: site.endDate
      }
    });
  } catch (error) {
    console.error('Error updating site status:', error);
    res.status(500).json({ message: 'Failed to update site status' });
  }
});

// Get report analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get sites created by this admin
    const sites = await Site.find({ createdBy: req.user._id });
    const siteIds = sites.map(site => site._id);

    // Get all reports for these sites
    const reports = await Report.find({ site: { $in: siteIds } });

    // Calculate monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyReports = await Report.aggregate([
      {
        $match: {
          site: { $in: siteIds },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $eq: ['$testResult', 'Pass'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$testResult', 'Fail'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate material-wise statistics
    const materialStats = await Report.aggregate([
      {
        $match: {
          site: { $in: siteIds }
        }
      },
      {
        $group: {
          _id: '$materialTested',
          total: { $sum: 1 },
          pass: { $sum: { $cond: [{ $eq: ['$testResult', 'Pass'] }, 1, 0] } },
          fail: { $sum: { $cond: [{ $eq: ['$testResult', 'Fail'] }, 1, 0] } }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Engineer performance ranking
    const engineerPerformance = await Report.aggregate([
      {
        $match: {
          site: { $in: siteIds }
        }
      },
      {
        $group: {
          _id: '$inspector',
          totalReports: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $eq: ['$testResult', 'Pass'] }, 1, 0] } },
          avgResponseTime: { $avg: { $ifNull: ['$responseTime', 24] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'engineer'
        }
      },
      {
        $unwind: '$engineer'
      },
      {
        $project: {
          engineerId: '$_id',
          engineerName: '$engineer.name',
          totalReports: 1,
          passCount: 1,
          failCount: { $subtract: ['$totalReports', '$passCount'] },
          passRate: {
            $cond: [
              { $eq: ['$totalReports', 0] },
              0,
              { $multiply: [{ $divide: ['$passCount', '$totalReports'] }, 100] }
            ]
          },
          avgResponseTime: 1
        }
      },
      {
        $sort: { passRate: -1 }
      }
    ]);

    res.json({
      summary: {
        totalReports: reports.length,
        passRate: reports.length > 0 
          ? ((reports.filter(r => r.testResult === 'Pass').length / reports.length) * 100).toFixed(1) + '%'
          : '0%',
        complianceRate: reports.length > 0
          ? ((reports.filter(r => r.complianceStatus === 'Compliant').length / reports.length) * 100).toFixed(1) + '%'
          : '0%',
        avgReportsPerDay: (reports.length / 30).toFixed(1)
      },
      monthlyTrends: monthlyReports,
      materialStats: materialStats,
      engineerPerformance: engineerPerformance,
      sitePerformance: sites.map(site => ({
        id: site._id,
        name: site.name,
        reportCount: reports.filter(r => r.site.toString() === site._id.toString()).length,
        passRate: (() => {
          const siteReports = reports.filter(r => r.site.toString() === site._id.toString());
          return siteReports.length > 0
            ? ((siteReports.filter(r => r.testResult === 'Pass').length / siteReports.length) * 100).toFixed(1) + '%'
            : '0%';
        })()
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// NEW: Get engineer's deactivation/activation history
router.get('/engineers/:id/history', async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id)
      .select('deactivationInfo activationInfo name email role');
    
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    const history = [];
    
    if (engineer.deactivationInfo) {
      history.push({
        type: 'deactivation',
        reason: engineer.deactivationInfo.reason,
        by: engineer.deactivationInfo.deactivatedByName,
        at: engineer.deactivationInfo.deactivatedAt,
        currentStatus: 'deactivated'
      });
    }
    
    if (engineer.activationInfo) {
      history.push({
        type: 'activation',
        by: engineer.activationInfo.activatedByName,
        at: engineer.activationInfo.activatedAt,
        currentStatus: 'active'
      });
    }

    res.json({
      engineer: {
        name: engineer.name,
        email: engineer.email,
        role: engineer.role,
        isActive: engineer.isActive
      },
      history: history.sort((a, b) => new Date(b.at) - new Date(a.at))
    });
  } catch (error) {
    console.error('Error fetching engineer history:', error);
    res.status(500).json({ message: 'Failed to fetch engineer history' });
  }
});

module.exports = router;