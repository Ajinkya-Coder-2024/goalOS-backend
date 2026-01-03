const mongoose = require('mongoose');
const Challenge = require('../models/challengeModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private
const createChallenge = asyncHandler(async (req, res) => {
  const { name, description, subjects } = req.body;
  const userId = req.user._id;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a name for the challenge');
  }

  const challenge = await Challenge.create({
    userId,
    name,
    description,
    subjects: subjects || [],
    status: 'active'
  });

  res.status(201).json({
    success: true,
    data: challenge
  });
});

// @desc    Get all challenges for a user
// @route   GET /api/challenges
// @access  Private
const getChallenges = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const challenges = await Challenge.find({ 
    userId,
    isDeleted: false 
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: challenges.length,
    data: challenges
  });
});

// @desc    Get a single challenge
// @route   GET /api/challenges/:id
// @access  Private
const getChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false
  });

  if (!challenge) {
    res.status(404);
    throw new Error('Challenge not found');
  }

  res.status(200).json({
    success: true,
    data: challenge
  });
});

// @desc    Update a challenge
// @route   PUT /api/challenges/:id
// @access  Private
const updateChallenge = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  const challenge = await Challenge.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false
  });

  if (!challenge) {
    res.status(404);
    throw new Error('Challenge not found');
  }

  // Update only the fields that are provided
  if (name) challenge.name = name;
  if (description !== undefined) challenge.description = description;
  if (status) challenge.status = status;

  const updatedChallenge = await challenge.save();

  res.status(200).json({
    success: true,
    data: updatedChallenge
  });
});

// @desc    Delete a challenge (soft delete)
// @route   DELETE /api/challenges/:id
// @access  Private
const deleteChallenge = asyncHandler(async (req, res) => {
  try {
    console.log('Deleting challenge with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!challenge) {
      console.log('Challenge not found');
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or already deleted'
      });
    }

    // Soft delete by setting isDeleted to true
    challenge.isDeleted = true;
    await challenge.save();

    console.log('Challenge soft deleted successfully');
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during challenge deletion'
    });
  }
});

// @desc    Add a section to a challenge
// @route   POST /api/challenges/:id/sections
// @access  Private
const addSectionToChallenge = asyncHandler(async (req, res) => {
  try {
    console.log('=== Add Section Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('All params:', req.params);
    console.log('Challenge ID from params:', req.params.id);
    console.log('User ID:', req.user?._id);
    
    const { name } = req.body;
    if (!name) {
      console.error('No name provided in request body');
      return res.status(400).json({ 
        success: false, 
        error: 'Section name is required' 
      });
    }
    
    const challengeId = req.params.id;
    if (!challengeId) {
      console.error('No challenge ID provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Challenge ID is required' 
      });
    }
    
    const userId = req.user?._id;
    if (!userId) {
      console.error('No user ID in request');
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.error('Invalid section name:', name);
      res.status(400);
      throw new Error('Please provide a valid name for the section');
    }

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      console.error('Invalid challenge ID format:', challengeId);
      res.status(400);
      throw new Error('Invalid challenge ID format');
    }

    const challenge = await Challenge.findOne({ _id: challengeId, userId });

    if (!challenge) {
      console.error('Challenge not found or not owned by user:', { challengeId, userId });
      res.status(404);
      throw new Error('Challenge not found or you do not have permission to modify it');
    }

    console.log('Found challenge:', challenge._id);
    
    try {
      const newSection = {
        name: name.trim(),
        order: challenge.sections ? challenge.sections.length + 1 : 1,
      progress: 0,
      subjects: []
    };

    console.log('New section to add:', newSection);

    // Initialize sections array if it doesn't exist
    if (!challenge.sections) {
      challenge.sections = [];
    }

      // Initialize sections array if it doesn't exist
      if (!challenge.sections) {
        challenge.sections = [];
      }

      console.log('Adding new section:', newSection);
      challenge.sections.push(newSection);
      
      console.log('Saving challenge with new section...');
      const updatedChallenge = await challenge.save();
      const addedSection = updatedChallenge.sections[updatedChallenge.sections.length - 1];
      
      console.log('Section added successfully:', addedSection);
      
      res.status(201).json({
        success: true,
        data: addedSection
      });
    } catch (error) {
      console.error('Error in addSectionToChallenge:', {
        error: error.message,
        stack: error.stack,
        challengeId: challenge?._id,
        sectionName: name
      });
      res.status(500).json({
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error in addSectionToChallenge:', error);
    throw error; // Let the error handler middleware handle it
  }
});

// @desc    Update a section in a challenge
// @route   PUT /api/challenges/:id/sections/:sectionId
// @access  Private
const updateSectionInChallenge = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const { sectionId } = req.params;
  const { name, description } = req.body;
  const userId = req.user._id;

  if (!name) {
    res.status(400);
    throw new Error('Section name is required');
  }

  const challenge = await Challenge.findOne({ _id: challengeId, userId });
  if (!challenge) {
    res.status(404);
    throw new Error('Challenge not found');
  }

  // Find section by _id (handle both string and ObjectId comparisons)
  const sectionIndex = challenge.sections.findIndex(s => {
    const sectionIdStr = s._id ? s._id.toString() : null;
    return sectionIdStr === sectionId;
  });
  
  if (sectionIndex === -1) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Update section with proper error handling
  try {
    const sectionToUpdate = challenge.sections[sectionIndex];
    sectionToUpdate.name = name;
    if (description !== undefined) {
      sectionToUpdate.description = description;
    }
    // Mark the document as modified
    challenge.markModified('sections');
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500);
    throw new Error('Failed to update section: ' + error.message);
  }

  const updatedChallenge = await challenge.save();
  
  res.status(200).json({
    success: true,
    data: updatedChallenge.sections[sectionIndex]
  });
});

// @desc    Delete a section from a challenge
// @route   DELETE /api/challenges/:id/sections/:sectionId
// @access  Private
const deleteSectionFromChallenge = asyncHandler(async (req, res) => {
  const challengeId = req.params.id;
  const { sectionId } = req.params;
  const userId = req.user._id;

  const challenge = await Challenge.findOne({ _id: challengeId, userId });
  if (!challenge) {
    res.status(404);
    throw new Error('Challenge not found');
  }

  // Find section by _id (handle both string and ObjectId comparisons)
  const sectionIndex = challenge.sections.findIndex(s => {
    const sectionIdStr = s._id ? s._id.toString() : null;
    return sectionIdStr === sectionId;
  });
  
  if (sectionIndex === -1) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Remove the section
  challenge.sections.splice(sectionIndex, 1);
  
  // Update order for remaining sections
  challenge.sections.forEach((section, index) => {
    section.order = index + 1;
  });

  const updatedChallenge = await challenge.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add a subject to a section
// @route   POST /api/challenges/:id/sections/:sectionId/subjects
// @access  Private
const addSubjectToSection = asyncHandler(async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    const challengeId = req.params.id;
    const sectionId = req.params.sectionId;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Subject name is required'
      });
    }

    const challenge = await Challenge.findOne({
      _id: challengeId,
      userId,
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found or access denied'
      });
    }

    const section = challenge.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const newSubject = {
      name,
      description: description || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'not_started',
      progress: 0,
      resources: []
    };

    section.subjects.push(newSubject);
    await challenge.save();

    // Get the newly added subject with its generated _id
    const addedSubject = section.subjects[section.subjects.length - 1];

    res.status(201).json({
      success: true,
      data: addedSubject
    });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add subject',
      details: error.message
    });
  }
});

// @desc    Add multiple subjects to a section
// @route   POST /api/challenges/:id/sections/:sectionId/subjects/batch
// @access  Private
const addMultipleSubjectsToSection = asyncHandler(async (req, res) => {
  try {
    const { subjects } = req.body;
    const challengeId = req.params.id;
    const sectionId = req.params.sectionId;
    const userId = req.user._id;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Subjects array is required and must not be empty'
      });
    }

    const challenge = await Challenge.findOne({
      _id: challengeId,
      userId,
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found or access denied'
      });
    }

    const section = challenge.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const newSubjects = subjects.map(subject => ({
      name: subject.name,
      description: subject.description || '',
      startDate: subject.startDate ? new Date(subject.startDate) : null,
      endDate: subject.endDate ? new Date(subject.endDate) : null,
      status: 'not_started',
      progress: 0,
      resources: []
    }));

    section.subjects.push(...newSubjects);
    await challenge.save();

    // Get the newly added subjects with their generated _ids
    const addedSubjects = section.subjects.slice(-newSubjects.length);

    res.status(201).json({
      success: true,
      data: addedSubjects,
      count: addedSubjects.length
    });
  } catch (error) {
    console.error('Error adding multiple subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add subjects',
      details: error.message
    });
  }
});

// @desc    Update a subject in a section
// @route   PUT /api/challenges/:id/sections/:sectionId/subjects/:subjectId
// @access  Private
const updateSubjectInSection = asyncHandler(async (req, res) => {
  try {
    const { name, description, startDate, endDate, status, progress } = req.body;
    const { id: challengeId, sectionId, subjectId } = req.params;
    const userId = req.user._id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      userId,
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found or access denied'
      });
    }

    const section = challenge.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const subject = section.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    // Update only the fields that are provided
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (startDate) subject.startDate = new Date(startDate);
    if (endDate) subject.endDate = new Date(endDate);
    if (status) subject.status = status;
    if (progress !== undefined) subject.progress = progress;

    await challenge.save();

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subject',
      details: error.message
    });
  }
});

// @desc    Delete a subject from a section
// @route   DELETE /api/challenges/:id/sections/:sectionId/subjects/:subjectId
// @access  Private
const deleteSubjectFromSection = asyncHandler(async (req, res) => {
  try {
    const { id: challengeId, sectionId, subjectId } = req.params;
    const userId = req.user._id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      userId,
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found or access denied'
      });
    }

    const section = challenge.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const subject = section.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    // Remove the subject using pull
    section.subjects.pull(subjectId);
    await challenge.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subject',
      details: error.message
    });
  }
});

module.exports = {
  createChallenge,
  getChallenges,
  getChallenge,
  updateChallenge,
  deleteChallenge,
  addSectionToChallenge,
  updateSectionInChallenge,
  deleteSectionFromChallenge,
  addSubjectToSection,
  addMultipleSubjectsToSection,
  updateSubjectInSection,
  deleteSubjectFromSection
};
