const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Helper to set httpOnly session cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if username already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      const error = new Error('Username or email already exists.');
      error.status = 400;
      return next(error);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      passwordHash
    });

    await newUser.save();

    // Sign JWT
    const payload = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_social_media_token_2026_xyz',
      { expiresIn: '7d' }
    );

    // Set cookie
    setTokenCookie(res, token);

    // Convert doc to object and clean sensitive data
    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(201).json({ user: userObj });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & set token cookie
// @access  Public
router.post('/login', validateLogin, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.status = 400;
      return next(error);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.status = 400;
      return next(error);
    }

    // Sign JWT
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_social_media_token_2026_xyz',
      { expiresIn: '7d' }
    );

    // Set cookie
    setTokenCookie(res, token);

    // Clean user object
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({ user: userObj });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/auth/logout
// @desc    Log user out & clear token cookie
// @access  Public
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get currently authenticated user
// @access  Private
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      const error = new Error('User not found.');
      error.status = 404;
      return next(error);
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
