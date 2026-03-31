// server/services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter - uses env vars, gracefully disabled if not set
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const brandedHTML = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #0f172a; padding: 24px 32px; }
    .header h1 { color: #eab308; margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { color: #94a3b8; margin: 4px 0 0; font-size: 12px; }
    .body { padding: 32px; color: #334155; }
    .body h2 { color: #0f172a; margin-top: 0; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin: 12px 0; }
    .badge-approved { background: #dcfce7; color: #16a34a; }
    .badge-rejected { background: #fee2e2; color: #dc2626; }
    .badge-pending { background: #fef9c3; color: #ca8a04; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .info-table td:first-child { color: #64748b; font-weight: bold; width: 40%; }
    .btn { display: inline-block; padding: 12px 28px; background: #eab308; color: #0f172a; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>QUALITY PULSE</h1>
    <p>Construction Quality Assurance Platform</p>
  </div>
  <div class="body">
    <h2>${title}</h2>
    ${bodyContent}
  </div>
  <div class="footer">
    This is an automated message from Quality Pulse. Do not reply to this email.<br>
    &copy; ${new Date().getFullYear()} Quality Pulse. All rights reserved.
  </div>
</div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn(`Email not sent (EMAIL_USER/PASS not configured): ${subject}`);
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: `"Quality Pulse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject} [${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ──────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: '🎉 Welcome to Quality Pulse!',
    html: brandedHTML('Welcome to Quality Pulse!', `
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your account has been created successfully. You are registered as a <strong>${user.role}</strong>.</p>
      <table class="info-table">
        <tr><td>Name</td><td>${user.name}</td></tr>
        <tr><td>Email</td><td>${user.email}</td></tr>
        <tr><td>Role</td><td>${user.role}</td></tr>
      </table>
      <p>You can now log in and start managing your construction quality inspections.</p>
      <a href="${process.env.FRONTEND_URL || 'https://your-app.vercel.app'}/login" class="btn">Login to Dashboard →</a>
    `),
  });
};

const sendReportReviewedEmail = async ({ engineerEmail, engineerName, reportTitle, siteName, status, reviewComment }) => {
  const badgeClass = status === 'Approved' ? 'badge-approved' : 'badge-rejected';
  const emoji = status === 'Approved' ? '✅' : '⚠️';
  return sendEmail({
    to: engineerEmail,
    subject: `${emoji} Your Report "${reportTitle}" was ${status}`,
    html: brandedHTML(`Report ${status}`, `
      <p>Hi <strong>${engineerName}</strong>,</p>
      <p>Your QA report has been reviewed by an administrator.</p>
      <span class="badge ${badgeClass}">${status}</span>
      <table class="info-table">
        <tr><td>Report</td><td>${reportTitle}</td></tr>
        <tr><td>Site</td><td>${siteName || 'N/A'}</td></tr>
        <tr><td>Status</td><td>${status}</td></tr>
        ${reviewComment ? `<tr><td>Admin Comment</td><td>${reviewComment}</td></tr>` : ''}
      </table>
      ${status === 'Rejected' ? '<p>Please review the feedback above and resubmit your report with the necessary corrections.</p>' : '<p>Great work! Your inspection has been recorded.</p>'}
      <a href="${process.env.FRONTEND_URL || 'https://your-app.vercel.app'}/reports" class="btn">View Reports →</a>
    `),
  });
};

const sendSiteAssignmentEmail = async ({ engineerEmail, engineerName, siteName, siteLocation, assignedByName }) => {
  return sendEmail({
    to: engineerEmail,
    subject: `🎯 New Site Assignment: ${siteName}`,
    html: brandedHTML('New Site Assignment', `
      <p>Hi <strong>${engineerName}</strong>,</p>
      <p>You have been assigned to a new construction site by <strong>${assignedByName}</strong>.</p>
      <table class="info-table">
        <tr><td>Site Name</td><td>${siteName}</td></tr>
        <tr><td>Location</td><td>${siteLocation || 'N/A'}</td></tr>
        <tr><td>Assigned By</td><td>${assignedByName}</td></tr>
        <tr><td>Date</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
      <p>Please review the site details and begin your quality inspections accordingly.</p>
      <a href="${process.env.FRONTEND_URL || 'https://your-app.vercel.app'}/sites" class="btn">View Assignment →</a>
    `),
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  return sendEmail({
    to: email,
    subject: '🔑 Reset Your Quality Pulse Password',
    html: brandedHTML('Password Reset Request', `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="${resetUrl}" class="btn">Reset My Password →</a>
      </p>
      <p style="font-size:12px; color:#94a3b8;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <p style="font-size:12px; color:#94a3b8;">For security, this link will expire in 1 hour.</p>
    `),
  });
};

module.exports = { sendWelcomeEmail, sendReportReviewedEmail, sendSiteAssignmentEmail, sendPasswordResetEmail, sendEmail };

