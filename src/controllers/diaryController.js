const mongoose = require('mongoose');
const Diary = require('../models/diaryModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a new diary entry
// @route   POST /api/diary/entries
// @access  Private
exports.createDiaryEntry = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const { date, content, goodThings = [], badThings = [] } = req.body;

  const diaryEntry = await Diary.create({
    user: req.user.id,
    date: date || Date.now(),
    content,
    goodThings,
    badThings
  });

  res.status(201).json({
    success: true,
    data: diaryEntry
  });
});

// @desc    Get all diary entries
// @route   GET /api/diary/entries
// @access  Private
exports.getDiaryEntries = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  let query = Diary.find({ ...JSON.parse(queryStr), user: req.user.id });
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Diary.countDocuments({ user: req.user.id });
  
  query = query.skip(startIndex).limit(limit);
  
  // Executing query
  const diaryEntries = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: diaryEntries.length,
    pagination,
    data: diaryEntries
  });
});

// @desc    Get single diary entry
// @route   GET /api/diary/entries/:id
// @access  Private
exports.getDiaryEntry = asyncHandler(async (req, res, next) => {
  const diaryEntry = await Diary.findOne({ _id: req.params.id, user: req.user.id });
  
  if (!diaryEntry) {
    return next(
      new ErrorResponse(`Diary entry not found with id of ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: diaryEntry
  });
});

// @desc    Update diary entry
// @route   PATCH /api/diary/entries/:id
// @access  Private
exports.updateDiaryEntry = asyncHandler(async (req, res, next) => {
  let diaryEntry = await Diary.findById(req.params.id);
  
  if (!diaryEntry) {
    return next(
      new ErrorResponse(`Diary entry not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is diary entry owner
  if (diaryEntry.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this diary entry`, 401)
    );
  }
  
  // Update fields
  const { content, goodThings, badThings } = req.body;
  
  if (content) diaryEntry.content = content;
  if (goodThings) diaryEntry.goodThings = goodThings;
  if (badThings) diaryEntry.badThings = badThings;
  
  await diaryEntry.save();
  
  res.status(200).json({
    success: true,
    data: diaryEntry
  });
});

// @desc    Delete diary entry
// @route   DELETE /api/diary/entries/:id
// @access  Private
exports.deleteDiaryEntry = asyncHandler(async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return next(new ErrorResponse(`Invalid diary entry ID format`, 400));
    }

    const diaryEntry = await Diary.findById(req.params.id);
    
    if (!diaryEntry) {
      console.log('Diary entry not found with id:', req.params.id);
      return next(
        new ErrorResponse(`Diary entry not found with id of ${req.params.id}`, 404)
      );
    }
    
    // Make sure user is diary entry owner
    if (diaryEntry.user.toString() !== req.user.id) {
      console.log(`User ${req.user.id} not authorized to delete entry ${req.params.id}`);
      return next(
        new ErrorResponse(`User is not authorized to delete this diary entry`, 401)
      );
    }
    
    await diaryEntry.deleteOne();
    
    console.log('Successfully deleted diary entry:', req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteDiaryEntry:', error);
    next(error);
  }
});

// @desc    Get entries by date range
// @route   GET /api/diary/entries/dates
// @access  Private
exports.getEntriesByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(
      new ErrorResponse('Please provide both startDate and endDate', 400)
    );
  }
  
  const entries = await Diary.find({
    user: req.user.id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort('-date');
  
  res.status(200).json({
    success: true,
    count: entries.length,
    data: entries
  });
});

// @desc    Get entry by specific date
// @route   GET /api/diary/entries/date/:date
// @access  Private
exports.getEntryByDate = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  
  if (isNaN(date.getTime())) {
    return next(new ErrorResponse('Please provide a valid date', 400));
  }
  
  // Set time to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Set time to end of day
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const entry = await Diary.findOne({
    user: req.user.id,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  res.status(200).json({
    success: true,
    data: entry || null
  });
});
