const asyncHandler = require('express-async-handler');
const Branch = require('../models/branchModel');

// @desc    Create a new branch
// @route   POST /api/branches
// @access  Private
const createBranch = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Check if branch with same name already exists for this user
  const existingBranch = await Branch.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    user: req.user._id
  });

  if (existingBranch) {
    res.status(400);
    throw new Error('A branch with this name already exists');
  }

  const branch = await Branch.create({
    name,
    description,
    user: req.user._id
  });

  res.status(201).json({
    success: true,
    data: branch
  });
});

// @desc    Get all branches for the logged-in user
// @route   GET /api/branches
// @access  Private
const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: branches.length,
    data: branches
  });
});

// @desc    Get single branch by ID
// @route   GET /api/branches/:id
// @access  Private
const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('subjects');

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  res.status(200).json({
    success: true,
    data: branch
  });
});

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private
const updateBranch = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  let branch = await Branch.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // Check if new name is already taken by another branch
  if (name && name !== branch.name) {
    const existingBranch = await Branch.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      user: req.user._id,
      _id: { $ne: branch._id }
    });

    if (existingBranch) {
      res.status(400);
      throw new Error('A branch with this name already exists');
    }
  }

  branch.name = name || branch.name;
  branch.description = description !== undefined ? description : branch.description;
  branch.isActive = isActive !== undefined ? isActive : branch.isActive;

  await branch.save();

  res.status(200).json({
    success: true,
    data: branch
  });
});

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private
const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // The pre-remove middleware will handle deleting associated subjects
  await branch.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch
};
