const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Non-admin users only see their own logs
    if (req.user.role !== 'Admin') {
      query.userId = req.user._id;
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name role email'); // Optionally populate user details

    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

module.exports = router;