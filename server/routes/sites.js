const express = require('express');
const AuditLog = require('../models/AuditLog');
const NotificationService = require('../services/notificationService');
const router = express.Router();
const { 
  createSite, 
  getSites, 
  getSiteById, 
  updateSite, 
  archiveSite,
  restoreSite,
  deleteSite,
  getSiteStats 
} = require('../controllers/siteController');
const { protect, authorize } = require('../middleware/auth');
const Site = require('../models/Site'); // Import Site model for custom routes
const User = require('../models/User');

// All routes require authentication
router.use(protect);

// ====================
// PUBLIC ROUTES (For authenticated users)
// ====================

// Get site statistics
router.get('/stats', getSiteStats);

// Get all sites (filtered by role)
router.get('/', getSites);

// Get single site by ID
router.get('/:id', getSiteById);

// Get sites for specific engineer
router.get('/engineer/:engineerId', async (req, res) => {
  try {
    // Only allow if user is admin, or requesting their own sites
    if (req.user.role !== 'Admin' && req.params.engineerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sites = await Site.find({ 
      assignedEngineers: req.params.engineerId,
      isArchived: false 
    })
      .populate('assignedEngineers', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(sites);
  } catch (error) {
    console.error('Error fetching engineer sites:', error);
    res.status(500).json({ message: 'Failed to load sites' });
  }
});

// Assign engineer to site with notification
router.post('/:siteId/assign', authorize('Admin'), async (req, res) => {
  try {
    const { engineerIds } = req.body;
    const site = await Site.findById(req.params.siteId);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Validate engineer IDs
    const engineers = await User.find({ 
      _id: { $in: engineerIds },
      role: 'Engineer'
    });

    if (engineers.length !== engineerIds.length) {
      return res.status(400).json({ message: 'One or more engineer IDs are invalid' });
    }

    // Add engineers if not already assigned
    const newEngineers = engineerIds.filter(id => 
      !site.assignedEngineers.includes(id)
    );
    
    site.assignedEngineers = [...new Set([...site.assignedEngineers, ...engineerIds])];
    await site.save();

    // Send notifications to each newly assigned engineer
    const io = req.app.get('io');
    for (const engineerId of newEngineers) {
      await NotificationService.notifyEngineerAssignedToSite(engineerId, site._id, io);
    }

    res.json({ 
      success: true, 
      site,
      assignedEngineers: site.assignedEngineers.length,
      newAssignments: newEngineers.length
    });
  } catch (error) {
    console.error('Error assigning engineers:', error);
    res.status(500).json({ message: 'Failed to assign engineers' });
  }
});

// Remove engineer from site
router.delete('/:siteId/remove-engineer/:engineerId', authorize('Admin'), async (req, res) => {
  try {
    const site = await Site.findById(req.params.siteId);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    site.assignedEngineers = site.assignedEngineers.filter(
      id => id.toString() !== req.params.engineerId
    );
    
    await site.save();

    res.json({ 
      success: true, 
      site,
      message: 'Engineer removed from site'
    });
  } catch (error) {
    console.error('Error removing engineer:', error);
    res.status(500).json({ message: 'Failed to remove engineer' });
  }
});


// ====================
// ADMIN-ONLY ROUTES
// ====================

// Create new site
router.post('/', authorize('Admin'), createSite);

// Update site
router.put('/:id', authorize('Admin'), updateSite);

// Archive site (soft delete)
router.put('/:id/archive', authorize('Admin'), archiveSite);

// Restore archived site
router.put('/:id/restore', authorize('Admin'), restoreSite);

// Delete site permanently
router.delete('/:id', authorize('Admin'), deleteSite);

// ====================
// ADDITIONAL ADMIN ROUTES
// ====================

// Get all archived sites (admin only)
router.get('/admin/archived', authorize('Admin'), async (req, res) => {
  try {
    const sites = await Site.find({ isArchived: true })
      .populate('assignedEngineers', 'name email')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    
    res.json(sites);
  } catch (error) {
    console.error('Error fetching archived sites:', error);
    res.status(500).json({ message: 'Failed to load archived sites' });
  }
});

// Get sites by status (admin only)
router.get('/admin/status/:status', authorize('Admin'), async (req, res) => {
  try {
    const sites = await Site.find({ 
      status: req.params.status,
      isArchived: false 
    })
      .populate('assignedEngineers', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites by status:', error);
    res.status(500).json({ message: 'Failed to load sites' });
  }
});

// Search sites (admin only - more advanced search)
router.get('/admin/search', authorize('Admin'), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const searchRegex = new RegExp(query, 'i');
    
    const sites = await Site.find({
      $or: [
        { name: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { country: searchRegex },
        { exactAddress: searchRegex },
        { description: searchRegex },
        { 'siteManager.name': searchRegex },
        { 'siteManager.email': searchRegex }
      ],
      isArchived: false
    })
      .populate('assignedEngineers', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      results: sites,
      count: sites.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching sites:', error);
    res.status(500).json({ message: 'Failed to search sites' });
  }
});

// ====================
// BULK OPERATIONS (Admin only)
// ====================

// Bulk update site status
router.put('/admin/bulk/status', authorize('Admin'), async (req, res) => {
  try {
    const { siteIds, status } = req.body;
    
    if (!siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
      return res.status(400).json({ message: 'Site IDs array is required' });
    }
    
    if (!status || !['Active', 'Completed', 'Paused', 'In Progress', 'On Hold', 'Delayed', 'Planning'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }
    
    const result = await Site.updateMany(
      { _id: { $in: siteIds } },
      { $set: { status: status, updatedAt: new Date() } }
    );
    
    // Log bulk operation
    await AuditLog.create({
      userId: req.user._id,
      action: 'bulk_status_update',
      resourceType: 'Site',
      details: {
        siteCount: result.modifiedCount,
        status: status,
        updatedBy: req.user.name
      }
    });
    
    res.json({
      message: `Updated ${result.modifiedCount} sites to ${status} status`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating site status:', error);
    res.status(500).json({ message: 'Failed to bulk update sites' });
  }
});

// Bulk archive sites
router.put('/admin/bulk/archive', authorize('Admin'), async (req, res) => {
  try {
    const { siteIds } = req.body;
    
    if (!siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
      return res.status(400).json({ message: 'Site IDs array is required' });
    }
    
    const result = await Site.updateMany(
      { _id: { $in: siteIds } },
      { 
        $set: { 
          isArchived: true,
          isActive: false,
          status: 'Completed',
          updatedAt: new Date() 
        } 
      }
    );
    
    // Log bulk operation
    await AuditLog.create({
      userId: req.user._id,
      action: 'bulk_archive_sites',
      resourceType: 'Site',
      details: {
        siteCount: result.modifiedCount,
        updatedBy: req.user.name
      }
    });
    
    res.json({
      message: `Archived ${result.modifiedCount} sites`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk archiving sites:', error);
    res.status(500).json({ message: 'Failed to bulk archive sites' });
  }
});

// Assign engineer to site with notification (NEW IMPLEMENTATION)
router.post('/:siteId/assign-engineers', authorize('Admin'), async (req, res) => {
  try {
    console.log('\n🔔 SITE ASSIGNMENT REQUEST RECEIVED');
    console.log('   Site ID:', req.params.siteId);
    console.log('   Engineer IDs:', req.body.engineerIds);
    console.log('   Admin ID:', req.user._id);
    console.log('   Admin Name:', req.user.name);
    
    const { engineerIds } = req.body;
    const site = await Site.findById(req.params.siteId);
    
    if (!site) {
      console.log('❌ Site not found');
      return res.status(404).json({ message: 'Site not found' });
    }

    // Validate engineer IDs
    const engineers = await User.find({ 
      _id: { $in: engineerIds },
      role: 'Engineer'
    });

    console.log('   Found engineers:', engineers.map(e => ({ id: e._id, name: e.name })));

    if (engineers.length !== engineerIds.length) {
      console.log('❌ Invalid engineer IDs');
      return res.status(400).json({ 
        message: 'One or more engineer IDs are invalid or not engineers' 
      });
    }

    // Get current assigned engineers
    const currentEngineerIds = site.assignedEngineers.map(id => id.toString());
    
    // Find new engineers being assigned
    const newEngineerIds = engineerIds.filter(id => 
      !currentEngineerIds.includes(id.toString())
    );

    console.log('   Current engineers:', currentEngineerIds.length);
    console.log('   New engineers to assign:', newEngineerIds.length);
    console.log('   New engineer IDs:', newEngineerIds);

    // Update site with assigned engineers
    site.assignedEngineers = [...new Set([...site.assignedEngineers, ...engineerIds])];
    await site.save();

    console.log('   Site updated successfully');

    // Send notifications to each newly assigned engineer
    if (newEngineerIds.length > 0) {
      const io = req.app.get('io');
      console.log(`   🔔 Sending notifications to ${newEngineerIds.length} engineers`);
      console.log('   IO instance available:', !!io);
      
      for (const engineerId of newEngineerIds) {
        try {
          console.log(`   📨 Creating notification for engineer ${engineerId}`);
          const notification = await NotificationService.notifyEngineerAssignedToSite(
            engineerId, 
            site._id, 
            req.user._id, 
            io
          );
          
          if (notification) {
            console.log(`   ✅ Notification created: ${notification._id}`);
          } else {
            console.log(`   ❌ Failed to create notification for ${engineerId}`);
          }
        } catch (notifyError) {
          console.error(`   ❌ Error notifying engineer ${engineerId}:`, notifyError.message);
        }
      }
    } else {
      console.log('   ℹ️ No new engineers to notify (already assigned)');
    }

    res.json({ 
      success: true, 
      message: `Assigned ${engineers.length} engineers to site`,
      site: {
        id: site._id,
        name: site.name,
        assignedEngineers: site.assignedEngineers.length
      },
      notificationsSent: newEngineerIds.length
    });
    
    console.log('✅ Assignment completed successfully\n');
  } catch (error) {
    console.error('❌ Error assigning engineers:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to assign engineers', 
      error: error.message 
    });
  }
});

// Add specific engineer to site (alternative endpoint)
router.post('/:siteId/assign/:engineerId', authorize('Admin'), async (req, res) => {
  try {
    const site = await Site.findById(req.params.siteId);
    const engineer = await User.findById(req.params.engineerId);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!engineer || engineer.role !== 'Engineer') {
      return res.status(400).json({ message: 'Invalid engineer ID or not an engineer' });
    }

    // Check if already assigned
    const isAlreadyAssigned = site.assignedEngineers.some(id => 
      id.toString() === req.params.engineerId
    );

    if (isAlreadyAssigned) {
      return res.status(400).json({ message: 'Engineer is already assigned to this site' });
    }

    // Add engineer to site
    site.assignedEngineers.push(req.params.engineerId);
    await site.save();

    // Send notification to engineer
    const io = req.app.get('io');
    const notification = await NotificationService.notifyEngineerAssignedToSite(
      engineer._id, 
      site._id, 
      req.user._id, 
      io
    );

    res.json({ 
      success: true, 
      message: `Engineer ${engineer.name} assigned to site ${site.name}`,
      site: {
        id: site._id,
        name: site.name,
        assignedEngineers: site.assignedEngineers.length
      },
      notification: notification ? 'Sent' : 'Failed to send'
    });
  } catch (error) {
    console.error('Error assigning engineer:', error);
    res.status(500).json({ message: 'Failed to assign engineer', error: error.message });
  }
});

module.exports = router;