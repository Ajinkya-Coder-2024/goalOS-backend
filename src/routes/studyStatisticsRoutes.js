const express = require('express');
const { 
  getStudyStatistics,
  getStudyBranches,
  createStudyBranch,
  updateStudyBranch,
  deleteStudyBranch
} = require('../controllers/studyStatisticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Get study statistics
router.get('/statistics', getStudyStatistics);

// Study branches
router.route('/')
  .get(getStudyBranches)
  .post(createStudyBranch);

router.route('/:id')
  .put(updateStudyBranch)
  .delete(deleteStudyBranch);

module.exports = router;
