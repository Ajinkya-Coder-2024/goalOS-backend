const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const NilavantiUser = require('../models/nilavantiUserModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookies
  token = req.cookies.jwt;

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

      // Get user from the token
      req.user = await NilavantiUser.findById(decoded.userId).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
