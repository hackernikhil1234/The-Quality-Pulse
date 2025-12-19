// server/services/notificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Site = require('../models/Site');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

class NotificationService {
  // Send notification and emit socket event
  // server/services/notificationService.js - Update sendNotification method
  static async sendNotification(data, io = null) {
    try {
        console.log(`📤 Creating notification for user: ${data.userId}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Message: ${data.message}`);

        // Always save to database regardless of socket
        const notification = await Notification.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        metadata: data.metadata || {},
        actionUrl: data.actionUrl,
        expiresAt: data.expiresInHours 
            ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000)
            : undefined
        });

        console.log(`✅ Notification saved to database: ${notification._id}`);

        // Try to send real-time notification if user is online
        if (io && data.userId) {
        const userIdStr = data.userId.toString();
        const roomName = `user_${userIdStr}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        
        if (room && room.size > 0) {
            console.log(`📡 User ${userIdStr} is online, sending real-time notification`);
            io.to(roomName).emit('newNotification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            createdAt: notification.createdAt,
            actionUrl: notification.actionUrl,
            read: false
            });
        } else {
            console.log(`👤 User ${userIdStr} is offline. Notification saved to database.`);
        }
        }

        return notification;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
    }
  }

  // 1. Notify engineer when assigned to new site (FIXED)
  static async notifyEngineerAssignedToSite(engineerId, siteId, assignedByUserId, io = null) {
    try {
        console.log(`\n🔔 [NOTIFICATION] Engineer Assignment`);
        console.log(`   Engineer: ${engineerId}`);
        console.log(`   Site: ${siteId}`);
        console.log(`   Assigned by: ${assignedByUserId}`);
        
        const site = await Site.findById(siteId).populate('createdBy', 'name email');
        const engineer = await User.findById(engineerId);
        const assignedBy = await User.findById(assignedByUserId);
        
        if (!site || !engineer) {
        console.log('   ❌ Missing site or engineer');
        return null;
        }

        console.log(`   ✅ Found: Engineer "${engineer.name}", Site "${site.name}"`);

        // Create notification
        const notificationData = {
        userId: engineerId,
        title: '🎯 New Site Assignment',
        message: `You have been assigned to site: "${site.name}" at ${site.location || site.city}.`,
        type: 'info',
        priority: 'medium',
        metadata: {
            siteId: site._id,
            siteName: site.name,
            siteLocation: site.location || `${site.city}, ${site.country}`,
            assignedBy: assignedByUserId,
            assignedByName: assignedBy?.name || 'Admin',
            assignmentDate: new Date()
        },
        actionUrl: `/sites/${siteId}`
        };

        // Create notification in database
        const notification = await this.sendNotification(notificationData, io);
        
        if (notification) {
        console.log(`   ✅ Notification created: ${notification._id}`);
        
        // ALSO CREATE AUDIT LOG (this is what shows in activities)
        await AuditLog.create({
            userId: engineerId,
            action: 'site_assigned',
            resourceType: 'Site',
            resourceId: siteId,
            details: {
            siteName: site.name,
            assignedBy: assignedByUserId,
            assignedByName: assignedBy?.name || 'Admin',
            notificationId: notification._id
            }
        });
        console.log(`   ✅ Activity log created`);
        
        } else {
        console.log(`   ❌ Failed to create notification`);
        }

        return notification;
    } catch (error) {
        console.error('❌ Error in notifyEngineerAssignedToSite:', error);
        return null;
    }
  }

  // 2. Notify multiple engineers when assigned to a site
  static async notifyEngineersAssignedToSite(engineerIds, siteId, assignedByUserId, io = null) {
    try {
      console.log(`🔔 Notifying ${engineerIds.length} engineers about site ${siteId}`);
      
      const notifications = [];
      for (const engineerId of engineerIds) {
        const notification = await this.notifyEngineerAssignedToSite(
          engineerId, 
          siteId, 
          assignedByUserId, 
          io
        );
        if (notification) {
          notifications.push(notification);
        }
      }
      
      console.log(`✅ Sent ${notifications.length} assignment notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error in notifyEngineersAssignedToSite:', error);
      return [];
    }
  }

  // 3. Notify engineer when report is reviewed (FIXED)
  static async notifyReportReviewed(reportId, status, reviewerId, io = null) {
    try {
      console.log(`🔔 Notifying about report ${reportId} review status: ${status}`);
      
      const report = await Report.findById(reportId)
        .populate('inspector', 'name email')
        .populate('site', 'name');
      
      if (!report) {
        console.error('Report not found:', reportId);
        return null;
      }

      const reviewer = await User.findById(reviewerId);
      const engineer = await User.findById(report.inspector._id);

      console.log(`Found report by ${report.inspector.name}, reviewed by ${reviewer?.name || 'Admin'}`);

      const statusMap = {
        'approved': { type: 'success', title: '✅ Report Approved' },
        'Approved': { type: 'success', title: '✅ Report Approved' },
        'rejected': { type: 'warning', title: '⚠️ Report Requires Changes' },
        'Rejected': { type: 'warning', title: '⚠️ Report Requires Changes' }
      };

      const statusKey = status.toLowerCase();
      const statusInfo = statusMap[statusKey] || { type: 'info', title: '📝 Report Updated' };

      const message = statusKey === 'rejected' 
        ? `Your report for "${report.site?.name || 'site'}" has been ${status}. ${report.reviewComment ? `Feedback: ${report.reviewComment}` : 'Please review and resubmit.'}`
        : `Your report for "${report.site?.name || 'site'}" has been ${status}.`;

      const notification = await this.sendNotification({
        userId: report.inspector._id,
        title: statusInfo.title,
        message: message,
        type: statusInfo.type,
        priority: 'medium',
        metadata: {
          reportId: report._id,
          reportTitle: report.title,
          siteId: report.site?._id,
          siteName: report.site?.name,
          status: status,
          reviewerId: reviewerId,
          reviewerName: reviewer?.name || 'Admin',
          reviewedAt: new Date()
        },
        actionUrl: `/reports/${reportId}`
      }, io);

      console.log(`✅ Report review notification sent to ${report.inspector.name}`);
      return notification;
    } catch (error) {
      console.error('❌ Error in notifyReportReviewed:', error);
      return null;
    }
  }

  // 4. Notify admin about new report (FIXED)
  static async notifyAdminNewReport(reportId, io = null) {
    try {
      console.log(`🔔 Notifying admin about new report ${reportId}`);
      
      const report = await Report.findById(reportId)
        .populate('site', 'name createdBy')
        .populate('inspector', 'name email');
      
      if (!report) {
        console.error('Report not found:', reportId);
        return null;
      }

      if (!report.site || !report.site.createdBy) {
        console.error('Site or site creator not found for report:', reportId);
        return null;
      }

      // Get the admin who created the site
      const adminId = report.site.createdBy;
      const admin = await User.findById(adminId);
      
      if (!admin) {
        console.error('Admin not found:', adminId);
        return null;
      }

      console.log(`Found admin ${admin.name} for site ${report.site.name}`);

      const notification = await this.sendNotification({
        userId: admin._id,
        title: '📋 New Report Submitted',
        message: `Engineer ${report.inspector?.name || 'Unknown Engineer'} submitted a new report for site: "${report.site.name}". Report: ${report.title}`,
        type: 'info',
        priority: 'high',
        metadata: {
          reportId: report._id,
          reportTitle: report.title,
          siteId: report.site._id,
          siteName: report.site.name,
          engineerId: report.inspector?._id,
          engineerName: report.inspector?.name,
          submittedAt: report.createdAt
        },
        actionUrl: `/admin/reports/${reportId}`
      }, io);

      console.log(`✅ New report notification sent to admin ${admin.name}`);
      return notification;
    } catch (error) {
      console.error('❌ Error in notifyAdminNewReport:', error);
      return null;
    }
  }

  // 5. Notify all admins about new report (alternative)
  static async notifyAllAdminsNewReport(reportId, io = null) {
    try {
      const report = await Report.findById(reportId)
        .populate('site', 'name')
        .populate('inspector', 'name email');
      
      if (!report) return null;

      // Find all admins
      const admins = await User.find({ role: 'Admin' });
      console.log(`🔔 Notifying ${admins.length} admins about new report`);

      const notifications = [];
      for (const admin of admins) {
        const notification = await this.sendNotification({
          userId: admin._id,
          title: '📋 New Report Submitted',
          message: `Engineer ${report.inspector?.name || 'Unknown Engineer'} submitted a new report for site: "${report.site?.name || 'Unknown Site'}"`,
          type: 'info',
          priority: 'high',
          metadata: {
            reportId: report._id,
            reportTitle: report.title,
            siteId: report.site?._id,
            siteName: report.site?.name,
            engineerId: report.inspector?._id,
            engineerName: report.inspector?.name
          },
          actionUrl: `/admin/reports/${reportId}`
        }, io);
        
        if (notification) {
          notifications.push(notification);
        }
      }

      console.log(`✅ Sent ${notifications.length} notifications to admins`);
      return notifications;
    } catch (error) {
      console.error('❌ Error in notifyAllAdminsNewReport:', error);
      return [];
    }
  }

  // 6. Notify engineer when account is deactivated
  static async notifyAccountDeactivated(userId, deactivatedBy, io = null) {
    try {
      const user = await User.findById(userId);
      const admin = await User.findById(deactivatedBy);

      const notification = await this.sendNotification({
        userId: userId,
        title: '🚫 Account Deactivated',
        message: `Your account has been deactivated by ${admin?.name || 'Administrator'}. Please contact support if you believe this is an error.`,
        type: 'error',
        priority: 'urgent',
        metadata: {
          deactivatedBy: deactivatedBy,
          deactivatedByAdmin: admin?.name,
          deactivatedAt: new Date(),
          action: 'account_deactivated'
        },
        expiresInHours: 24
      }, io);

      console.log(`✅ Account deactivation notification sent to ${user?.name || userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error in notifyAccountDeactivated:', error);
      return null;
    }
  }

  // 7. Test notification (for debugging)
  static async sendTestNotification(userId, io = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for test notification:', userId);
        return null;
      }

      const notification = await this.sendNotification({
        userId: userId,
        title: '🔔 Test Notification',
        message: `This is a test notification sent to ${user.name}. If you can see this, notifications are working!`,
        type: 'info',
        priority: 'low',
        metadata: {
          test: true,
          timestamp: new Date()
        },
        actionUrl: '/dashboard'
      }, io);

      console.log(`✅ Test notification sent to ${user.name}`);
      return notification;
    } catch (error) {
      console.error('❌ Error in sendTestNotification:', error);
      return null;
    }
  }
}

module.exports = NotificationService;