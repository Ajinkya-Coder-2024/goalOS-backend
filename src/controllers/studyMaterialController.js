const asyncHandler = require('express-async-handler');
const StudyMaterial = require('../models/studyMaterialModel');

// @desc    Add a new study material
// @route   POST /api/study-materials
// @access  Private
const addStudyMaterial = asyncHandler(async (req, res) => {
  const { title, description, link, type, subject, branch } = req.body;

  const material = await StudyMaterial.create({
    title,
    description,
    link,
    type: type || 'other',
    subject,
    branch,
    user: req.user._id
  });

  res.status(201).json({
    success: true,
    data: material
  });
});

// @desc    Get all study materials for a subject
// @route   GET /api/study-materials/subject/:subjectId
// @access  Private
const getStudyMaterialsBySubject = asyncHandler(async (req, res) => {
  const materials = await StudyMaterial.find({
    subject: req.params.subjectId,
    user: req.user._id
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// @desc    Get all study materials for a branch
// @route   GET /api/study-materials/branch/:branchId
// @access  Private
const getStudyMaterialsByBranch = asyncHandler(async (req, res) => {
  const materials = await StudyMaterial.find({
    branch: req.params.branchId,
    user: req.user._id
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// @desc    Update a study material
// @route   PUT /api/study-materials/:id
// @access  Private
const updateStudyMaterial = asyncHandler(async (req, res) => {
  let material = await StudyMaterial.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Study material not found');
  }

  // Make sure user owns the material
  if (material.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this material');
  }

  material = await StudyMaterial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: material
  });
});

// @desc    Delete a study material
// @route   DELETE /api/study-materials/:id
// @access  Private
const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Study material not found');
  }

  // Make sure user owns the material
  if (material.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this material');
  }

  await material.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  addStudyMaterial,
  getStudyMaterialsBySubject,
  getStudyMaterialsByBranch,
  updateStudyMaterial,
  deleteStudyMaterial
};
