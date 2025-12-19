const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

module.exports = router;