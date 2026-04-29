// server/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quality_pulse_uploads',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  },
});

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Max 5 files
  },
});

// Upload endpoint
router.post('/', upload.array('images', 5), (req, res) => {
  try {
    // Cloudinary automatically returns the full secure HTTPS URL in req.files[i].path
    const fileUrls = req.files.map((file) => file.path);

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: fileUrls,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message,
    });
  }
});

module.exports = router;
