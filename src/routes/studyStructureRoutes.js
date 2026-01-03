const express = require('express');
const {
  getStudyStructure,
  addBranch,
  addSubject,
  addStudyMaterial,
  updateBranch,
  deleteBranch
} = require('../controllers/studyStructureController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Get or create study structure
router.get('/', getStudyStructure);

// Branch routes
router.post('/branches', addBranch);
router.put('/branches/:branchId', updateBranch);
router.delete('/branches/:branchId', deleteBranch);

// Subject routes
router.post('/branches/:branchId/subjects', addSubject);

// Study material routes
router.post('/branches/:branchId/subjects/:subjectId/materials', addStudyMaterial);

module.exports = router;
