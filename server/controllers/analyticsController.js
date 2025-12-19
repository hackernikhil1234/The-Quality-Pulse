const Report = require('../models/Report');

const getAnalytics = async (req, res) => {
  try {
    const reports = await Report.find({});
    const pass = reports.filter(r => r.testResult === 'Pass').length;
    const total = reports.length;
    const compliance = total > 0 ? Math.round((pass / total) * 100) : 0;
    const trends = reports.length > 0 ? reports.slice(-7).map(r => ({ name: r.createdAt.toLocaleDateString(), value: r.testResult === 'Pass' ? 1 : 0 })) : [];

    res.json({
      compliance,
      totalReports: total,
      pending: reports.filter(r => r.status === 'Pending').length,
      failed: reports.filter(r => r.testResult === 'Fail').length,
      trends
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

// Export as CommonJS
module.exports = { getAnalytics };