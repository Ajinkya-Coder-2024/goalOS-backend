const StudyBranch = require('../models/studyStructureModel').StudyBranch;

// Get study statistics
exports.getStudyStatistics = async (req, res) => {
  try {
    const totalBranches = await StudyBranch.countDocuments();
    const activeBranches = await StudyBranch.countDocuments({ status: 'active' });
    const completedBranches = await StudyBranch.countDocuments({ status: 'completed' });
    
    // This is a simplified example - you might need to adjust based on your data model
    const totalSubjects = (await StudyBranch.aggregate([
      { $unwind: '$subjects' },
      { $count: 'total' }
    ]))[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalBranches,
        activeBranches,
        completedBranches,
        totalSubjects
      }
    });
  } catch (error) {
    console.error('Error fetching study statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study statistics',
      error: error.message
    });
  }
};

// Get all study branches
exports.getStudyBranches = async (req, res) => {
  try {
    const branches = await StudyBranch.find()
      .populate('subjects')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Error fetching study branches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study branches',
      error: error.message
    });
  }
};

// Create a new study branch
exports.createStudyBranch = async (req, res) => {
  try {
    const { name, description, status = 'active' } = req.body;
    
    const newBranch = new StudyBranch({
      name,
      description,
      status,
      subjects: []
    });
    
    const savedBranch = await newBranch.save();
    
    res.status(201).json({
      success: true,
      data: savedBranch
    });
  } catch (error) {
    console.error('Error creating study branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study branch',
      error: error.message
    });
  }
};

// Update a study branch
exports.updateStudyBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    const updatedBranch = await StudyBranch.findByIdAndUpdate(
      id,
      { name, description, status },
      { new: true, runValidators: true }
    );
    
    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: 'Study branch not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedBranch
    });
  } catch (error) {
    console.error('Error updating study branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study branch',
      error: error.message
    });
  }
};

// Delete a study branch
exports.deleteStudyBranch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBranch = await StudyBranch.findByIdAndDelete(id);
    
    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: 'Study branch not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting study branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study branch',
      error: error.message
    });
  }
};
