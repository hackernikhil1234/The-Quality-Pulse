const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_supersecret_123';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (id) => jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

// controllers/authController.js
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log('Registration attempt:', { name, email, role });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Engineer'
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail({ name: user.name, email: user.email, role: user.role })
      .catch(e => console.error('Welcome email failed (non-critical):', e.message));

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// controllers/authController.js
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or phone

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Update lastLogin timestamp
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000
      });
      
      res.json({
        _id: user._id, name: user.name, email: user.email,
        phone: user.phone, countryCode: user.countryCode,
        role: user.role, token
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      countryCode: user.countryCode || '+1',
      avatar: user.avatar || '',
      role: user.role || 'Engineer',
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = { registerUser, loginUser, getMe };