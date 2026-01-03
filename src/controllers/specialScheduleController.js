const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const SpecialSchedule = require("../models/specialScheduleModel");

// @desc    Create a new special schedule
// @route   POST /api/special-schedules
// @access  Private
exports.createSpecialSchedule = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, tasks } = req.body;

  if (!startDate || !endDate) {
    return next(
      new ErrorResponse("Please provide both startDate and endDate", 400)
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(
      new ErrorResponse("Invalid date format. Please use YYYY-MM-DD", 400)
    );
  }

  if (end < start) {
    return next(new ErrorResponse("End date cannot be before start date", 400));
  }

  // Optional initial tasks array
  let initialTasks = [];

  if (Array.isArray(tasks)) {
    initialTasks = tasks.map((task) => {
      if (!task || !task.date || !task.description) {
        throw new ErrorResponse(
          "Each task must include date and description",
          400
        );
      }

      const taskDate = new Date(task.date);

      if (isNaN(taskDate.getTime())) {
        throw new ErrorResponse(
          "Invalid task date format. Please use YYYY-MM-DD",
          400
        );
      }

      if (taskDate < start || taskDate > end) {
        throw new ErrorResponse(
          "Task date must be within the special schedule range",
          400
        );
      }

      return {
        date: taskDate,
        description: String(task.description).trim(),
      };
    });
  }

  const schedule = await SpecialSchedule.create({
    userId: req.user.id,
    startDate: start,
    endDate: end,
    tasks: initialTasks,
  });

  res.status(201).json({
    success: true,
    data: schedule,
  });
});

// @desc    Get special schedules for current user (optionally in a date range)
// @route   GET /api/special-schedules
// @access  Private
exports.getSpecialSchedules = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { userId: req.user.id };

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (
      (startDate && isNaN(start.getTime())) ||
      (endDate && isNaN(end.getTime()))
    ) {
      return next(
        new ErrorResponse("Invalid date format. Please use YYYY-MM-DD", 400)
      );
    }

    query.$or = [
      {
        startDate: { $lte: end || new Date(8640000000000000) },
        endDate: { $gte: start || new Date(0) },
      },
    ];
  }

  const schedules = await SpecialSchedule.find(query).sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});

// @desc    Add a task to a special schedule
// @route   POST /api/special-schedules/:id/tasks
// @access  Private
exports.addSpecialTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { date, description } = req.body;

  if (!date || !description) {
    return next(
      new ErrorResponse("Please provide both date and description", 400)
    );
  }

  const taskDate = new Date(date);

  if (isNaN(taskDate.getTime())) {
    return next(
      new ErrorResponse("Invalid date format. Please use YYYY-MM-DD", 400)
    );
  }

  const schedule = await SpecialSchedule.findOne({
    _id: id,
    userId: req.user.id,
  });

  if (!schedule) {
    return next(new ErrorResponse("Special schedule not found", 404));
  }

  if (taskDate < schedule.startDate || taskDate > schedule.endDate) {
    return next(
      new ErrorResponse(
        "Task date must be within the special schedule range",
        400
      )
    );
  }

  schedule.tasks.push({ date: taskDate, description: description.trim() });
  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

// @desc    Update special schedule dates
// @route   PATCH /api/special-schedules/:id
// @access  Private
exports.updateSpecialSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;

  if (!startDate && !endDate) {
    return next(
      new ErrorResponse(
        "Please provide at least one of startDate or endDate to update",
        400
      )
    );
  }

  let update = {};

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return next(
        new ErrorResponse("Invalid startDate format. Use YYYY-MM-DD", 400)
      );
    }
    update.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return next(
        new ErrorResponse("Invalid endDate format. Use YYYY-MM-DD", 400)
      );
    }
    update.endDate = end;
  }

  // Ensure endDate is not before startDate
  if (update.startDate || update.endDate) {
    const schedule = await SpecialSchedule.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!schedule) {
      return next(new ErrorResponse("Special schedule not found", 404));
    }

    const newStart = update.startDate || schedule.startDate;
    const newEnd = update.endDate || schedule.endDate;

    if (newEnd < newStart) {
      return next(
        new ErrorResponse("End date cannot be before start date", 400)
      );
    }

    schedule.startDate = newStart;
    schedule.endDate = newEnd;
    await schedule.save();

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  }

  // Fallback (should not normally reach here)
  return res.status(200).json({ success: true, data: {} });
});

// @desc    Delete a special schedule
// @route   DELETE /api/special-schedules/:id
// @access  Private
exports.deleteSpecialSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await SpecialSchedule.findOneAndDelete({
    _id: id,
    userId: req.user.id,
  });

  if (!schedule) {
    return next(new ErrorResponse("Special schedule not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update a task within a special schedule
// @route   PATCH /api/special-schedules/:scheduleId/tasks/:taskId
// @access  Private
exports.updateSpecialTask = asyncHandler(async (req, res, next) => {
  const { scheduleId, taskId } = req.params;
  const { date, description } = req.body;

  if (!date && !description) {
    return next(
      new ErrorResponse(
        "Please provide at least one of date or description to update",
        400
      )
    );
  }

  const schedule = await SpecialSchedule.findOne({
    _id: scheduleId,
    userId: req.user.id,
  });

  if (!schedule) {
    return next(new ErrorResponse("Special schedule not found", 404));
  }

  const task = schedule.tasks.id(taskId);
  if (!task) {
    return next(new ErrorResponse("Task not found", 404));
  }

  if (date) {
    const taskDate = new Date(date);
    if (isNaN(taskDate.getTime())) {
      return next(
        new ErrorResponse("Invalid task date format. Use YYYY-MM-DD", 400)
      );
    }

    if (taskDate < schedule.startDate || taskDate > schedule.endDate) {
      return next(
        new ErrorResponse(
          "Task date must be within the special schedule range",
          400
        )
      );
    }

    task.date = taskDate;
  }

  if (typeof description === "string") {
    task.description = description.trim();
  }

  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

// @desc    Delete a task from a special schedule
// @route   DELETE /api/special-schedules/:scheduleId/tasks/:taskId
// @access  Private
exports.deleteSpecialTask = asyncHandler(async (req, res, next) => {
  const { scheduleId, taskId } = req.params;

  const schedule = await SpecialSchedule.findOne({
    _id: scheduleId,
    userId: req.user.id,
  });

  if (!schedule) {
    return next(new ErrorResponse("Special schedule not found", 404));
  }

  const task = schedule.tasks.id(taskId);
  if (!task) {
    return next(new ErrorResponse("Task not found", 404));
  }

  task.remove();
  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});
