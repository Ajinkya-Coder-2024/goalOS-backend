const NilavantiUser = require('../models/nilavantiUserModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc    Register a new Nilavanti user
// @route   POST /api/nilavanti/register
// @access  Public
// @desc    Register a new Nilavanti user
// @route   POST /api/nilavanti/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!password) {
    res.status(400);
    throw new Error('Please provide a password');
  }

  try {
    // Generate a unique username if not provided
    let finalUsername = username || `user_${Date.now()}`;
    
    // Check if username already exists
    let counter = 1;
    while (await NilavantiUser.findOne({ username: finalUsername })) {
      finalUsername = `${username || 'user'}_${counter++}`;
    }

    // Create user with the final username
    const user = await NilavantiUser.create({
      username: finalUsername,
      password
    });

    generateToken(res, user._id);
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
});

// @desc    Auth user & get token
// @route   POST /api/nilavanti/login
// @access  Public
exports.authUser = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Find user by default username
  const user = await NilavantiUser.findOne({ username: 'Nilauser' });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email
    });
  } else {
    res.status(401);
    throw new Error('Invalid password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/nilavanti/logout
// @access  Public
exports.logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get user profile
// @route   GET /api/nilavanti/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await NilavantiUser.findById(req.user._id);
  
  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Generate JWT and set it as an HTTP-only cookie
const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '30d' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};
