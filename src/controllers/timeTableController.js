const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Import the model with debug logging
console.log('Attempting to load DailySchedule model...');
let DailySchedule;
try {
  DailySchedule = require('../models/DailySchedule');
  console.log('DailySchedule model loaded successfully');
  console.log('Model schema:', DailySchedule.schema);
} catch (error) {
  console.error('Error loading DailySchedule model:', error);
  throw error;
}

// @desc    Get or create daily schedule
// @route   GET /api/timetable/:date
// @access  Private
exports.getDailySchedule = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  if (isNaN(date.getTime())) {
    return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD', 400));
  }

  // Set time to start of day
  date.setHours(0, 0, 0, 0);

  let schedule = await DailySchedule.findOne({
    userId: req.user.id,
    date
  });

  if (!schedule) {
    schedule = await DailySchedule.create({
      userId: req.user.id,
      date,
      timeSlots: []
    });
  }

  res.status(200).json({
    success: true,
    data: schedule
  });
});

// @desc    Update daily schedule
// @route   PUT /api/timetable/:date
// @access  Private
exports.updateDailySchedule = asyncHandler(async (req, res, next) => {
  try {
    console.log('Update request received:', { body: req.body });
    
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD', 400));
    }

    // Set time to start of day
    date.setHours(0, 0, 0, 0);

    const { timeSlots } = req.body;
    console.log('Time slots received:', timeSlots);

    // Validate time slots
    if (!Array.isArray(timeSlots)) {
      return next(new ErrorResponse('Time slots must be an array', 400));
    }

    // Validate each time slot
    const validatedTimeSlots = timeSlots.map(slot => {
      // Basic validation
      if (!slot.startTime || !slot.endTime) {
        throw new Error('Each time slot must have startTime and endTime');
      }
      
      // Convert time strings to Date objects for comparison
      const start = new Date(`2000-01-01T${slot.startTime}`);
      const end = new Date(`2000-01-01T${slot.endTime}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid time format. Use HH:MM (24-hour format)');
      }
      
      if (start >= end) {
        throw new Error('endTime must be after startTime');
      }
      
      return {
        _id: slot._id || new (require('mongoose').Types.ObjectId)(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        description: slot.description || '',
        status: slot.status || 'pending',
        ...(slot.status === 'completed' && { completedAt: new Date() }),
        category: slot.category || undefined,
        isRecurring: Boolean(slot.isRecurring),
        recurrencePattern: slot.recurrencePattern || undefined
      };
    });

    console.log('Validated time slots:', validatedTimeSlots);
    
    const updateData = { 
      userId: req.user.id,
      date,
      timeSlots: validatedTimeSlots
    };
    
    console.log('Update data:', updateData);
    
    const schedule = await DailySchedule.findOneAndUpdate(
      { userId: req.user.id, date },
      { $set: updateData },
      { 
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('Schedule updated:', schedule);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error in updateDailySchedule:', error);
    next(new ErrorResponse(error.message || 'Failed to update schedule', 500));
  }
});

// @desc    Get schedules in date range
// @route   GET /api/timetable
// @access  Private
exports.getSchedulesInRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorResponse('Please provide both startDate and endDate', 400));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD', 400));
  }

  // Set time to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const schedules = await DailySchedule.find({
    userId: req.user.id,
    date: {
      $gte: start,
      $lte: end
    }
  }).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Update time slot status
// @route   PATCH /api/timetable/:date/slots/:slotId/status
// @access  Private
exports.updateTimeSlotStatus = asyncHandler(async (req, res, next) => {
  const { date, slotId } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed', 'cancelled'].includes(status)) {
    return next(new ErrorResponse('Invalid status. Must be one of: pending, completed, cancelled', 400));
  }

  const scheduleDate = new Date(date);
  if (isNaN(scheduleDate.getTime())) {
    return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD', 400));
  }
  scheduleDate.setHours(0, 0, 0, 0);

  const update = {
    $set: {
      'timeSlots.$.status': status,
      updatedAt: new Date()
    }
  };

  if (status === 'completed') {
    update.$set['timeSlots.$.completedAt'] = new Date();
  }

  const schedule = await DailySchedule.findOneAndUpdate(
    {
      userId: req.user.id,
      date: scheduleDate,
      'timeSlots._id': slotId
    },
    update,
    { new: true, runValidators: true }
  );

  if (!schedule) {
    return next(new ErrorResponse('Time slot not found', 404));
  }

  res.status(200).json({
    success: true,
    data: schedule
  });
});
