const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  logoutUser,
  getUserProfile
} = require('../controllers/nilavantiAuthController');
const { protect } = require('../middleware/nilavantiAuthMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);

// Protected route
router.get('/profile', protect, getUserProfile);

module.exports = router;
