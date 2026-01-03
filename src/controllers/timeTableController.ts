import { Request, Response, NextFunction } from 'express';
import { DailySchedule, ITimeSlot } from '../models/TimeSlot';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from '../middleware/async';
import mongoose from 'mongoose';

// @desc    Get or create daily schedule
// @route   GET /api/v1/timetable/:date
// @access  Private
export const getDailySchedule = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
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
// @route   PUT /api/v1/timetable/:date
// @access  Private
export const updateDailySchedule = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const date = new Date(req.params.date);
  if (isNaN(date.getTime())) {
    return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD', 400));
  }

  // Set time to start of day
  date.setHours(0, 0, 0, 0);

  const { timeSlots } = req.body;

  // Validate time slots
  if (!Array.isArray(timeSlots)) {
    return next(new ErrorResponse('Time slots must be an array', 400));
  }

  const schedule = await DailySchedule.findOneAndUpdate(
    { userId: req.user.id, date },
    { 
      $set: { 
        timeSlots: timeSlots.map((slot: any) => ({
          _id: slot._id || new mongoose.Types.ObjectId(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          description: slot.description,
          status: slot.status || 'pending',
          ...(slot.status === 'completed' && { completedAt: new Date() }),
          category: slot.category,
          isRecurring: slot.isRecurring || false,
          recurrencePattern: slot.recurrencePattern
        }))
      } 
    },
    { 
      new: true,
      runValidators: true,
      upsert: true 
    }
  );

  res.status(200).json({
    success: true,
    data: schedule
  });
});

// @desc    Get schedules in date range
// @route   GET /api/v1/timetable
// @access  Private
export const getSchedulesInRange = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
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
// @route   PATCH /api/v1/timetable/:date/slots/:slotId/status
// @access  Private
export const updateTimeSlotStatus = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
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

  const update: any = {
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
