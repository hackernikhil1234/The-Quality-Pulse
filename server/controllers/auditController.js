const AuditLog = require('../models/AuditLog');

const getRecentActivities = async (req, res) => {
  try {
    const activities = await AuditLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name');

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

module.exports = { getRecentActivities };