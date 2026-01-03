const LifePlan = require('../models/LifePlan');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all life plans for a user
// @route   GET /api/life-plans
// @access  Private
exports.getLifePlans = asyncHandler(async (req, res, next) => {
  const plans = await LifePlan.find({ user: req.user.id }).sort('targetYear');
  
  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});

// @desc    Get single life plan
// @route   GET /api/life-plans/:id
// @access  Private
exports.getLifePlan = asyncHandler(async (req, res, next) => {
  const plan = await LifePlan.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!plan) {
    return next(
      new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: plan
  });
});

// @desc    Create new life plan
// @route   POST /api/life-plans
// @access  Private
exports.createLifePlan = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Validate startAge and endAge
  if (parseInt(req.body.startAge) >= parseInt(req.body.endAge)) {
    return next(
      new ErrorResponse('End age must be greater than start age', 400)
    );
  }

  const plan = await LifePlan.create(req.body);

  res.status(201).json({
    success: true,
    data: plan
  });
});

// @desc    Update life plan
// @route   PUT /api/life-plans/:id
// @access  Private
exports.updateLifePlan = asyncHandler(async (req, res, next) => {
  let plan = await LifePlan.findById(req.params.id);

  if (!plan) {
    return next(
      new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is plan owner
  if (plan.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to update this plan`, 401)
    );
  }

  // Validate startAge and endAge if they're being updated
  if (req.body.startAge && req.body.endAge && 
      parseInt(req.body.startAge) >= parseInt(req.body.endAge)) {
    return next(
      new ErrorResponse('End age must be greater than start age', 400)
    );
  }

  plan = await LifePlan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: plan
  });
});

// @desc    Delete life plan
// @route   DELETE /api/life-plans/:id
// @access  Private
exports.deleteLifePlan = asyncHandler(async (req, res, next) => {
  const plan = await LifePlan.findById(req.params.id);

  if (!plan) {
    return next(
      new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is plan owner
  if (plan.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to delete this plan`, 401)
    );
  }

  await LifePlan.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get plans by year range
// @route   GET /api/life-plans/range/:startYear/:endYear
// @access  Private
exports.getPlansByYearRange = asyncHandler(async (req, res, next) => {
  const { startYear, endYear } = req.params;
  
  const plans = await LifePlan.find({
    user: req.user.id,
    targetYear: { $gte: startYear, $lte: endYear }
  }).sort('targetYear');

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});
