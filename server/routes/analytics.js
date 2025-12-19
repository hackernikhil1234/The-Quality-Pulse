const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Site = require('../models/Site');
const User = require('../models/User');

// Helper function to group by date
const groupByDate = (reports, timeRange) => {
  const groups = {};
  
  // Generate all possible dates in the range
  const now = new Date();
  let startDate = new Date();
  
  switch(timeRange) {
    case 'day':
      // Last 24 hours in 3-hour intervals
      for (let i = 0; i < 8; i++) {
        const hour = (i * 3).toString().padStart(2, '0');
        groups[`${hour}:00`] = { reports: [], compliant: [] };
      }
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        groups[days[date.getDay()]] = { reports: [], compliant: [] };
      }
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      // Last 30 days in weekly intervals
      for (let i = 3; i >= 0; i--) {
        groups[`Week ${4-i}`] = { reports: [], compliant: [] };
      }
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      // Last 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        groups[months[date.getMonth()]] = { reports: [], compliant: [] };
      }
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Group reports by date
  reports.forEach(report => {
    const date = new Date(report.createdAt);
    let key;
    
    switch(timeRange) {
      case 'day':
        const hour = Math.floor(date.getHours() / 3) * 3;
        key = `${hour.toString().padStart(2, '0')}:00`;
        break;
      case 'week':
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'month':
        const weekNum = Math.floor(date.getDate() / 7) + 1;
        key = `Week ${Math.min(weekNum, 4)}`;
        break;
      case 'year':
        key = date.toLocaleDateString('en-US', { month: 'short' });
        break;
      default:
        key = date.toLocaleDateString();
    }
    
    if (groups[key]) {
      groups[key].reports.push(report);
      if (report.complianceStatus === 'Compliant') {
        groups[key].compliant.push(report);
      }
    }
  });
  
  // Convert to array format
  return Object.keys(groups).map(key => ({
    date: key,
    month: key,
    reports: groups[key].reports.length,
    compliance: groups[key].reports.length > 0 
      ? Math.round((groups[key].compliant.length / groups[key].reports.length) * 100)
      : 0
  }));
};

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get all reports in the time range
    const reports = await Report.find({
      createdAt: { $gte: startDate, $lte: now }
    })
    .populate('site')
    .populate('inspector')
    .populate('createdBy');

    // Get all sites and engineers
    const sites = await Site.find();
    const engineers = await User.find({ role: 'Engineer' });

    // Calculate compliance rate
    const compliantReports = reports.filter(r => r.complianceStatus === 'Compliant');
    const complianceRate = reports.length > 0 
      ? Math.round((compliantReports.length / reports.length) * 100) 
      : 0;

    // Calculate pass/fail rates
    const passReports = reports.filter(r => r.testResult === 'Pass');
    const failReports = reports.filter(r => r.testResult === 'Fail');
    const passRate = reports.length > 0 
      ? Math.round((passReports.length / reports.length) * 100) 
      : 0;
    const failRate = 100 - passRate;

    // Get report status counts
    const pendingReports = reports.filter(r => r.status === 'Pending').length;
    const approvedReports = reports.filter(r => r.status === 'Approved').length;
    const rejectedReports = reports.filter(r => r.status === 'Rejected').length;

    // Calculate average resolution time (in days)
    const resolvedReports = reports.filter(r => r.status !== 'Pending');
    let avgResolutionTime = 0;
    if (resolvedReports.length > 0) {
      const totalTime = resolvedReports.reduce((sum, report) => {
        const created = new Date(report.createdAt);
        const updated = new Date(report.updatedAt);
        return sum + (updated - created) / (1000 * 60 * 60 * 24); // Convert to days
      }, 0);
      avgResolutionTime = Math.round((totalTime / resolvedReports.length) * 10) / 10;
    }

    // Site performance analysis - REAL DATA
    const sitePerformance = await Promise.all(sites.map(async (site) => {
      const siteReports = reports.filter(r => 
        r.site && r.site._id && r.site._id.toString() === site._id.toString()
      );
      const siteCompliant = siteReports.filter(r => r.complianceStatus === 'Compliant');
      const compliance = siteReports.length > 0 
        ? Math.round((siteCompliant.length / siteReports.length) * 100) 
        : 0;
      
      return {
        site: site.name || site.siteName || `Site ${site._id.toString().substring(0, 6)}`,
        compliance,
        reports: siteReports.length
      };
    }));

    // Filter out sites with no reports and sort by compliance
    const filteredSitePerformance = sitePerformance
      .filter(site => site.reports > 0)
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 5); // Top 5

    // Engineer performance - REAL DATA
    const engineerPerformance = await Promise.all(engineers.map(async (engineer) => {
      const engineerReports = reports.filter(r => 
        r.inspector && r.inspector._id && r.inspector._id.toString() === engineer._id.toString()
      );
      const compliantEngineerReports = engineerReports.filter(r => r.complianceStatus === 'Compliant');
      const compliance = engineerReports.length > 0 
        ? Math.round((compliantEngineerReports.length / engineerReports.length) * 100) 
        : 0;
      
      return {
        engineer: engineer.name || engineer.email,
        reports: engineerReports.length,
        compliance
      };
    }));

    // Filter out engineers with no reports and sort by number of reports
    const filteredEngineerPerformance = engineerPerformance
      .filter(engineer => engineer.reports > 0)
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 5); // Top 5

    // Material compliance analysis - REAL DATA
    // Group reports by material tested
    const materialGroups = {};
    reports.forEach(report => {
      const material = report.materialTested || 'Unknown Material';
      if (!materialGroups[material]) {
        materialGroups[material] = {
          totalTests: 0,
          passTests: 0
        };
      }
      materialGroups[material].totalTests++;
      if (report.testResult === 'Pass') {
        materialGroups[material].passTests++;
      }
    });

    // Convert to array and calculate pass rates
    const materialCompliance = Object.keys(materialGroups).map(material => {
      const data = materialGroups[material];
      return {
        material,
        totalTests: data.totalTests,
        passRate: Math.round((data.passTests / data.totalTests) * 100)
      };
    }).sort((a, b) => b.totalTests - a.totalTests).slice(0, 5); // Top 5 materials

    // Generate REAL trend data from actual reports
    const trendData = groupByDate(reports, timeRange);
    
    // For empty periods, provide empty arrays
    const trends = {
      daily: timeRange === 'day' ? trendData : [],
      monthly: timeRange === 'month' || timeRange === 'year' ? trendData : []
    };

    res.json({
      complianceRate,
      totalReports: reports.length,
      totalSites: sites.length,
      totalEngineers: engineers.length,
      pendingReports,
      approvedReports,
      rejectedReports,
      passRate,
      failRate,
      avgResolutionTime,
      trends,
      sitePerformance: filteredSitePerformance,
      engineerPerformance: filteredEngineerPerformance,
      materialCompliance
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
});

module.exports = router;