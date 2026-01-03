const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getMotivationalSlogans,
  getProgressOverview
} = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

// Get motivational slogans
router.get("/slogans", getMotivationalSlogans);

// Get progress overview
router.get("/progress", getProgressOverview);

module.exports = router;
