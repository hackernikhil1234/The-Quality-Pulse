const Site = require('../models/Site');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Report = require('../models/Report');
const NotificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

const createSite = async (req, res) => {
  try {
    console.log('🔔 Creating new site with assigned engineers:', req.body.assignedEngineers);

    const { 
      name, 
      country, 
      city, 
      description, 
      exactAddress, 
      coordinates, 
      assignedEngineers,
      type,
      startDate,
      expectedCompletion,
      status,
      progress,
      category,
      materialSpecifications,
      siteManager,
      budget,
      safetyMetrics,
      notes
    } = req.body;
    
    console.log('Creating site for user:', req.user._id, req.user.name);

    if (!name) {
      return res.status(400).json({ message: 'Site name is required' });
    }

    // Prepare material specifications if provided
    let materialSpecs = [];
    if (materialSpecifications && Array.isArray(materialSpecifications)) {
      materialSpecs = materialSpecifications.map(spec => ({
        material: spec.material || '',
        grade: spec.grade || '',
        quantity: spec.quantity || 0,
        unit: spec.unit || 'units',
        supplier: spec.supplier || '',
        deliveryDate: spec.deliveryDate || null,
        notes: spec.notes || ''
      }));
    }

    // Prepare notes array if provided
    let siteNotes = [];
    if (notes && Array.isArray(notes)) {
      siteNotes = notes.map(note => ({
        content: note.content || '',
        createdBy: req.user._id,
        createdAt: new Date()
      }));
    }

    const site = new Site({
      name,
      location: exactAddress || `${city}, ${country}`,
      country: country || '',
      city: city || '',
      description: description || '',
      exactAddress: exactAddress || '',
      coordinates: coordinates || { lat: 0, lng: 0 },
      assignedEngineers: assignedEngineers || [],
      type: type || 'Construction Site',
      category: category || 'General',
      startDate: startDate || new Date(),
      expectedCompletion: expectedCompletion || null,
      endDate: expectedCompletion || null, // For backward compatibility
      progress: progress || 0,
      status: status || 'Active',
      createdBy: req.user._id,
      materialSpecifications: materialSpecs,
      siteManager: siteManager || {},
      budget: budget || { allocated: 0, spent: 0, currency: 'USD' },
      safetyMetrics: safetyMetrics || { totalIncidents: 0, safetyRating: 'A' },
      qualityMetrics: {
        complianceRate: '0%',
        qualityScore: '0/10',
        lastUpdated: new Date(),
        totalReports: 0,
        approvedReports: 0,
        pendingReports: 0
      },
      notes: siteNotes,
      isActive: true,
      isArchived: false
    });
    
    await site.save();

    // Populate the site with all details
    const populatedSite = await Site.findById(site._id)
      .populate('assignedEngineers', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name')
      .lean();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'site_created',
      resourceType: 'Site',
      resourceId: site._id,
      details: { 
        siteName: name,
        createdBy: req.user.name 
      }
    });

    // Send notifications to assigned engineers
    if (req.body.assignedEngineers && req.body.assignedEngineers.length > 0) {
      const io = req.app.get('io');
      const NotificationService = require('../services/notificationService');
      
      console.log(`📨 Sending notifications to ${req.body.assignedEngineers.length} engineers`);
      
      for (const engineerId of req.body.assignedEngineers) {
        try {
          console.log(`   Creating notification for engineer ${engineerId}`);
          const notification = await NotificationService.notifyEngineerAssignedToSite(
            engineerId,
            site._id,
            req.user._id,
            io
          );
          
          if (notification) {
            console.log(`   ✅ Notification sent: ${notification._id}`);
          } else {
            console.log(`   ❌ Failed to send notification to ${engineerId}`);
          }
        } catch (notifyError) {
          console.error(`   ❌ Error notifying engineer ${engineerId}:`, notifyError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      site: populatedSite,
      notificationsSent: req.body.assignedEngineers?.length || 0
    });
  } catch (err) {
    console.error('Site creation error:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ success: false,
      message: 'Failed to create site',
      error: error.message 
    });
  }
};

const getSites = async (req, res) => {
  try {
    let query = {};
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'Admin') {
      // Smart filtering: Check if createdBy field exists in documents
      // For now, show all sites to admin
      query = {};
    } else if (role === 'Engineer') {
      query.assignedEngineers = userId; // Only assigned to this engineer
    } // Viewer sees all sites (no filter)

    const sites = await Site.find(query)
      .populate('assignedEngineers', 'name email')
      .sort({ createdAt: -1 });

    // Add createdBy info where available
    const sitesWithCreator = await Promise.all(sites.map(async (site) => {
      const siteObj = site.toObject();
      
      // Try to populate createdBy if it exists
      if (site.createdBy) {
        try {
          await site.populate('createdBy', 'name email');
          siteObj.createdBy = site.createdBy;
        } catch (err) {
          // If population fails, just keep the ID
          siteObj.createdBy = { _id: site.createdBy };
        }
      }
      
      return siteObj;
    }));

    res.json(sitesWithCreator);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ message: 'Failed to fetch sites' });
  }
};

const getSiteById = async (req, res) => {
  try {
    console.log('Fetching site by ID:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);

    const site = await Site.findById(req.params.id)
      .populate('assignedEngineers', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name')
      .populate('lastInspection.inspector', 'name')
      .lean();

    if (!site) {
      console.log('Site not found:', req.params.id);
      return res.status(404).json({ message: 'Site not found' });
    }

    console.log('Site found:', site.name);
    console.log('Assigned engineers:', site.assignedEngineers);

    // Check access permissions for engineers
    if (req.user.role === 'Engineer') {
      console.log('Checking engineer access...');
      
      // Check if engineer is assigned to this site
      const isAssigned = site.assignedEngineers && site.assignedEngineers.some(
        engineer => engineer && engineer._id && engineer._id.toString() === req.user._id.toString()
      );
      
      if (!isAssigned) {
        console.log('Access denied: Engineer not assigned to site');
        return res.status(403).json({ 
          message: 'Access denied. You are not assigned to this site.' 
        });
      }
      console.log('Engineer access granted');
    }

    // Calculate detailed statistics
    try {
      const reports = await Report.find({ site: req.params.id })
        .populate('inspector', 'name email')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 });
      
      console.log('Found reports for site:', reports.length);
      
      // Calculate comprehensive statistics
      if (reports.length > 0) {
        const compliantReports = reports.filter(r => r.complianceStatus === 'Compliant').length;
        site.complianceRate = Math.round((compliantReports / reports.length) * 100) + '%';
        
        const approvedReports = reports.filter(r => r.status === 'Approved').length;
        const pendingReports = reports.filter(r => r.status === 'Pending').length;
        const rejectedReports = reports.filter(r => r.status === 'Rejected').length;
        
        site.approvalRate = Math.round((approvedReports / reports.length) * 100) + '%';
        
        // Calculate quality score from test results
        const validScores = reports
          .map(r => {
            if (r.testResult && typeof r.testResult === 'object') {
              if (r.testResult.overallScore !== undefined) {
                return parseFloat(r.testResult.overallScore);
              } else if (r.testResult.score !== undefined) {
                return parseFloat(r.testResult.score);
              }
            }
            if (typeof r.testResult === 'string') {
              const num = parseFloat(r.testResult);
              if (!isNaN(num)) return num;
            }
            return null;
          })
          .filter(score => score !== null && score >= 0 && score <= 10);
        
        console.log('Valid scores:', validScores);
        
        if (validScores.length > 0) {
          const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
          site.qualityScore = avgScore.toFixed(1) + '/10';
        } else {
          site.qualityScore = '0/10';
        }
        
        // Add comprehensive report statistics
        site.reportStats = {
          total: reports.length,
          approved: approvedReports,
          pending: pendingReports,
          rejected: rejectedReports,
          compliant: compliantReports,
          nonCompliant: reports.filter(r => r.complianceStatus === 'Non-Compliant').length,
          recent: reports.slice(0, 5).map(r => ({
            _id: r._id,
            title: r.title,
            status: r.status,
            complianceStatus: r.complianceStatus,
            date: r.date || r.createdAt,
            inspector: r.inspector?.name
          }))
        };
        
        // Calculate average response time for approved reports
        const approvedWithDates = reports.filter(r => 
          r.status === 'Approved' && 
          r.createdAt && 
          r.reviewedAt
        );
        
        if (approvedWithDates.length > 0) {
          const totalResponseTime = approvedWithDates.reduce((sum, report) => {
            return sum + (new Date(report.reviewedAt) - new Date(report.createdAt));
          }, 0);
          
          const avgResponseHours = totalResponseTime / (approvedWithDates.length * 1000 * 60 * 60);
          site.avgResponseTime = Math.round(avgResponseHours) + 'h';
        }
        
        // Update the site's quality metrics
        await Site.findByIdAndUpdate(req.params.id, {
          'qualityMetrics.complianceRate': site.complianceRate,
          'qualityMetrics.qualityScore': site.qualityScore,
          'qualityMetrics.totalReports': reports.length,
          'qualityMetrics.approvedReports': approvedReports,
          'qualityMetrics.pendingReports': pendingReports,
          'qualityMetrics.lastUpdated': new Date()
        });
        
        // Store reports for the frontend
        site.reports = reports.slice(0, 10); // Limit to 10 most recent
      } else {
        site.complianceRate = '0%';
        site.qualityScore = '0/10';
        site.approvalRate = '0%';
        site.reportStats = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          compliant: 0,
          nonCompliant: 0,
          recent: []
        };
        site.progress = site.progress || 0;
      }
    } catch (reportError) {
      console.error('Error calculating site statistics:', reportError);
      // Set default values if report calculation fails
      site.complianceRate = '0%';
      site.qualityScore = '0/10';
      site.approvalRate = '0%';
      site.progress = site.progress || 0;
    }

    // Format dates for better display
    if (site.startDate) {
      site.formattedStartDate = new Date(site.startDate).toISOString();
      site.displayStartDate = new Date(site.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (site.expectedCompletion) {
      site.formattedExpectedCompletion = new Date(site.expectedCompletion).toISOString();
      site.displayExpectedCompletion = new Date(site.expectedCompletion).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Calculate days remaining
      const today = new Date();
      const completionDate = new Date(site.expectedCompletion);
      const diffTime = completionDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      site.daysRemaining = diffDays > 0 ? diffDays : 0;
    }
    
    // Add created and updated dates
    if (site.createdAt) {
      site.formattedCreatedAt = new Date(site.createdAt).toISOString();
      site.displayCreatedAt = new Date(site.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (site.updatedAt) {
      site.formattedUpdatedAt = new Date(site.updatedAt).toISOString();
    }

    // Add location details if not present
    if (!site.location && (site.country || site.city || site.exactAddress)) {
      site.location = [site.exactAddress, site.city, site.country]
        .filter(Boolean)
        .join(', ');
    }

    // Ensure quality metrics exist
    if (!site.qualityMetrics) {
      site.qualityMetrics = {
        complianceRate: site.complianceRate || '0%',
        qualityScore: site.qualityScore || '0/10',
        lastUpdated: new Date(),
        totalReports: site.reportStats?.total || 0,
        approvedReports: site.reportStats?.approved || 0,
        pendingReports: site.reportStats?.pending || 0
      };
    }

    // Add budget utilization percentage
    if (site.budget && site.budget.allocated > 0) {
      site.budget.utilization = Math.round((site.budget.spent / site.budget.allocated) * 100);
      site.budget.remaining = site.budget.allocated - site.budget.spent;
    }

    console.log('Returning site data with statistics');
    res.json(site);
  } catch (err) {
    console.error('Error fetching site:', err);
    
    // Handle specific errors
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }
    
    res.status(500).json({ message: 'Failed to fetch site details' });
  }
};

// Update site
const updateSite = async (req, res) => {
  try {
    const { 
      name, 
      location, 
      status, 
      assignedEngineers, 
      progress, 
      country, 
      city, 
      description,
      exactAddress,
      type,
      category,
      startDate,
      expectedCompletion,
      materialSpecifications,
      siteManager,
      budget,
      safetyMetrics,
      lastInspection,
      photos,
      documents,
      notes,
      isActive,
      isArchived
    } = req.body;
    
    // Get the current site before update to compare changes
    const currentSite = await Site.findById(req.params.id);
    if (!currentSite) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Track what fields are being updated
    const updatedFields = [];
    const updateData = {};
    
    // Check each field and add to updateData if provided
    const fieldsToCheck = {
      name, location, status, assignedEngineers, progress,
      country, city, description, exactAddress, type,
      category, startDate, expectedCompletion, siteManager,
      budget, safetyMetrics, lastInspection, isActive, isArchived
    };
    
    Object.keys(fieldsToCheck).forEach(field => {
      if (fieldsToCheck[field] !== undefined) {
        updateData[field] = fieldsToCheck[field];
        updatedFields.push(field);
      }
    });
    
    // Set endDate for consistency
    if (expectedCompletion !== undefined) {
      updateData.endDate = expectedCompletion;
    }

    // Handle material specifications update
    if (materialSpecifications && Array.isArray(materialSpecifications)) {
      updateData.materialSpecifications = materialSpecifications.map(spec => ({
        material: spec.material || '',
        grade: spec.grade || '',
        quantity: spec.quantity || 0,
        unit: spec.unit || 'units',
        supplier: spec.supplier || '',
        deliveryDate: spec.deliveryDate || null,
        notes: spec.notes || ''
      }));
      updatedFields.push('materialSpecifications');
    }

    // Handle photos update
    if (photos && Array.isArray(photos)) {
      updateData.photos = photos.map(photo => ({
        url: photo.url || '',
        description: photo.description || '',
        uploadedAt: photo.uploadedAt || new Date()
      }));
      updatedFields.push('photos');
    }

    // Handle documents update
    if (documents && Array.isArray(documents)) {
      updateData.documents = documents.map(doc => ({
        name: doc.name || '',
        url: doc.url || '',
        type: doc.type || 'document',
        uploadedAt: doc.uploadedAt || new Date()
      }));
      updatedFields.push('documents');
    }

    // Handle notes update (append new notes)
    if (notes && typeof notes === 'string' && notes.trim()) {
      const newNote = {
        content: notes.trim(),
        createdBy: req.user._id,
        createdAt: new Date()
      };
      
      const existingNotes = currentSite.notes || [];
      updateData.notes = [...existingNotes, newNote];
      updatedFields.push('notes');
    }

    const site = await Site.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedEngineers', 'name email phone')
    .populate('createdBy', 'name email')
    .populate('notes.createdBy', 'name')
    .populate('lastInspection.inspector', 'name');

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'site_updated',
      resourceType: 'Site',
      resourceId: req.params.id,
      details: { 
        updatedFields: updatedFields,
        updatedBy: req.user.name 
      }
    });

    // Send notifications to assigned engineers about site updates
    if (site.assignedEngineers && site.assignedEngineers.length > 0 && updatedFields.length > 0) {
      const io = req.app.get('io');
      console.log(`📨 Sending update notifications to ${site.assignedEngineers.length} engineers`);
      
      // Create a user-friendly summary of changes
      const changeSummary = [];
      if (updatedFields.includes('name')) {
        changeSummary.push(`Name updated to "${site.name}"`);
      }
      if (updatedFields.includes('status')) {
        changeSummary.push(`Status changed to "${site.status}"`);
      }
      if (updatedFields.includes('progress')) {
        changeSummary.push(`Progress updated to ${site.progress}%`);
      }
      if (updatedFields.includes('assignedEngineers')) {
        changeSummary.push('Assigned engineers updated');
      }
      if (updatedFields.includes('expectedCompletion')) {
        changeSummary.push('Completion date updated');
      }
      if (updatedFields.includes('notes')) {
        changeSummary.push('New note added');
      }
      
      // Use the same notification service pattern as createSite
      for (const engineer of site.assignedEngineers) {
        try {
          console.log(`   Creating update notification for engineer ${engineer._id}`);
          
          // Create a notification for site update
          const notification = new Notification({
            userId: engineer._id,
            type: 'site_updated',
            title: 'Site Updated',
            message: `Site "${site.name}" has been updated. ${changeSummary.join(', ')}`,
            data: {
              siteId: site._id,
              siteName: site.name,
              updatedBy: req.user.name,
              updatedFields: updatedFields,
              changeSummary: changeSummary
            },
            priority: 'medium',
            isRead: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
          });
          
          await notification.save();
          
          // Emit real-time notification via Socket.io if available
          if (io) {
            io.to(`user_${engineer._id}`).emit('notification', {
              _id: notification._id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              createdAt: notification.createdAt,
              isRead: notification.isRead
            });
          }
          
          console.log(`   ✅ Update notification sent: ${notification._id}`);
        } catch (notifyError) {
          console.error(`   ❌ Error notifying engineer ${engineer._id}:`, notifyError.message);
        }
      }
    }

    // Update quality metrics if reports exist
    if (site.status === 'Completed' || site.progress >= 100) {
      await Site.findByIdAndUpdate(req.params.id, {
        progress: 100,
        status: 'Completed',
        endDate: new Date()
      });
    }

    res.json(site);
  } catch (err) {
    console.error('Error updating site:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Failed to update site' });
  }
};

// Archive site (soft delete)
const archiveSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has permission (Admin only)
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can archive sites' });
    }

    site.isArchived = true;
    site.isActive = false;
    site.status = 'Completed';
    await site.save();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'site_archived',
      resourceType: 'Site',
      resourceId: req.params.id,
      details: { siteName: site.name }
    });

    res.json({ message: 'Site archived successfully', site });
  } catch (err) {
    console.error('Error archiving site:', err);
    res.status(500).json({ message: 'Failed to archive site' });
  }
};

// Restore site from archive
const restoreSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has permission (Admin only)
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can restore sites' });
    }

    site.isArchived = false;
    site.isActive = true;
    site.status = 'Active';
    await site.save();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'site_restored',
      resourceType: 'Site',
      resourceId: req.params.id,
      details: { siteName: site.name }
    });

    res.json({ message: 'Site restored successfully', site });
  } catch (err) {
    console.error('Error restoring site:', err);
    res.status(500).json({ message: 'Failed to restore site' });
  }
};

// Delete site (permanent)
const deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has permission (Admin only)
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can delete sites' });
    }

    // Check if site has reports (prevent deletion if reports exist)
    const reportCount = await Report.countDocuments({ site: req.params.id });
    if (reportCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete site with existing reports. Archive it instead.' 
      });
    }

    await site.deleteOne();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'site_deleted',
      resourceType: 'Site',
      resourceId: req.params.id,
      details: { siteName: site.name }
    });

    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ message: 'Failed to delete site' });
  }
};

// Get site statistics
const getSiteStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    
    let query = { isArchived: false };
    
    if (role === 'Engineer') {
      query.assignedEngineers = userId;
      query.isActive = true;
    }
    
    const totalSites = await Site.countDocuments(query);
    const activeSites = await Site.countDocuments({ ...query, status: 'Active' });
    const completedSites = await Site.countDocuments({ ...query, status: 'Completed' });
    const inProgressSites = await Site.countDocuments({ ...query, status: 'In Progress' });
    
    // Get sites by type
    const sitesByType = await Site.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent sites
    const recentSites = await Site.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status progress createdAt');
    
    // Calculate average progress
    const avgProgressResult = await Site.aggregate([
      { $match: query },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
    ]);
    
    const avgProgress = avgProgressResult.length > 0 ? Math.round(avgProgressResult[0].avgProgress) : 0;
    
    res.json({
      totalSites,
      activeSites,
      completedSites,
      inProgressSites,
      sitesByType,
      recentSites,
      avgProgress: `${avgProgress}%`,
      statsLastUpdated: new Date()
    });
  } catch (err) {
    console.error('Error fetching site statistics:', err);
    res.status(500).json({ message: 'Failed to fetch site statistics' });
  }
};

module.exports = { 
  createSite, 
  getSites, 
  getSiteById, 
  updateSite, 
  archiveSite,
  restoreSite,
  deleteSite,
  getSiteStats 
};