const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '30d' });
};

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

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token  // Add this line
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
      const token = generateToken(user._id);
      
      // Set cookie (for traditional auth)
      res.cookie('jwt', token, { 
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax', 
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      
      // ALSO send token in response body (for frontend localStorage)
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        token: token  // Add this line
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
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
    const user = await User.findById(decoded.id).select('-password');
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