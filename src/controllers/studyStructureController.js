const asyncHandler = require('express-async-handler');
const StudyStructure = require('../models/studyStructureModel');

// @desc    Get or create user's study structure
// @route   GET /api/study-structure
// @access  Private
const getStudyStructure = asyncHandler(async (req, res) => {
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    structure = await StudyStructure.create({ 
      user: req.user._id, 
      branches: [] 
    });
  }
  
  res.status(200).json({
    success: true,
    data: structure
  });
});

// @desc    Add a new branch
// @route   POST /api/study-structure/branches
// @access  Private
const addBranch = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    structure = await StudyStructure.create({ 
      user: req.user._id, 
      branches: [] 
    });
  }
  
  // Check if branch name already exists
  const branchExists = structure.branches.some(
    branch => branch.name.toLowerCase() === name.toLowerCase()
  );
  
  if (branchExists) {
    res.status(400);
    throw new Error('A branch with this name already exists');
  }
  
  const newBranch = {
    name,
    description: description || '',
    subjects: []
  };
  
  const branch = await structure.addBranch(newBranch);
  
  res.status(201).json({
    success: true,
    data: branch
  });
});

// @desc    Add a subject to a branch
// @route   POST /api/study-structure/branches/:branchId/subjects
// @access  Private
const addSubject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { branchId } = req.params;
  
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    res.status(404);
    throw new Error('Study structure not found');
  }
  
  // Check if subject name already exists in this branch
  const branch = structure.branches.id(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }
  
  const subjectExists = branch.subjects.some(
    subject => subject.name.toLowerCase() === name.toLowerCase()
  );
  
  if (subjectExists) {
    res.status(400);
    throw new Error('A subject with this name already exists in this branch');
  }
  
  const newSubject = {
    name,
    description: description || '',
    materials: []
  };
  
  const subject = await structure.addSubject(branchId, newSubject);
  
  res.status(201).json({
    success: true,
    data: subject
  });
});

// @desc    Add study material to a subject
// @route   POST /api/study-structure/branches/:branchId/subjects/:subjectId/materials
// @access  Private
const addStudyMaterial = asyncHandler(async (req, res) => {
  const { title, description, link, type } = req.body;
  const { branchId, subjectId } = req.params;
  
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    res.status(404);
    throw new Error('Study structure not found');
  }
  
  const newMaterial = {
    title,
    description: description || '',
    link,
    type: type || 'other'
  };
  
  const material = await structure.addStudyMaterial(branchId, subjectId, newMaterial);
  
  res.status(201).json({
    success: true,
    data: material
  });
});

// @desc    Update a branch
// @route   PUT /api/study-structure/branches/:branchId
// @access  Private
const updateBranch = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const { branchId } = req.params;
  
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    res.status(404);
    throw new Error('Study structure not found');
  }
  
  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const branch = await structure.updateBranch(branchId, updateData);
  
  res.status(200).json({
    success: true,
    data: branch
  });
});

// @desc    Delete a branch
// @route   DELETE /api/study-structure/branches/:branchId
// @access  Private
const deleteBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  
  let structure = await StudyStructure.findOne({ user: req.user._id });
  
  if (!structure) {
    res.status(404);
    throw new Error('Study structure not found');
  }
  
  await structure.deleteBranch(branchId);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getStudyStructure,
  addBranch,
  addSubject,
  addStudyMaterial,
  updateBranch,
  deleteBranch
};
