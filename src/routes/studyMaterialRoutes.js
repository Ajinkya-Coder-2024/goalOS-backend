const express = require('express');
const {
  addStudyMaterial,
  getStudyMaterialsBySubject,
  getStudyMaterialsByBranch,
  updateStudyMaterial,
  deleteStudyMaterial
} = require('../controllers/studyMaterialController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Add a new study material
router.post('/', addStudyMaterial);

// Get study materials by subject
router.get('/subject/:subjectId', getStudyMaterialsBySubject);

// Get study materials by branch
router.get('/branch/:branchId', getStudyMaterialsByBranch);

// Update a study material
router.put('/:id', updateStudyMaterial);

// Delete a study material
router.delete('/:id', deleteStudyMaterial);

module.exports = router;
