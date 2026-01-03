const express = require('express');
const { 
  getDailySchedule, 
  updateDailySchedule, 
  getSchedulesInRange,
  updateTimeSlotStatus
} = require('../controllers/timeTableController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Get or create daily schedule
router.get('/:date', getDailySchedule);

// Update daily schedule
router.put('/:date', updateDailySchedule);

// Get schedules in date range
router.get('/', getSchedulesInRange);

// Update time slot status
router.patch('/:date/slots/:slotId/status', updateTimeSlotStatus);

module.exports = router;
