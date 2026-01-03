const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/challengeController');

// Apply protect middleware to all routes
router.use(protect);

// Challenge routes
router.route('/')
  .get(getChallenges)
  .post(createChallenge);

router.route('/:id')
  .get(getChallenge)
  .put(updateChallenge)
  .delete(deleteChallenge);

// Section routes
router.route('/:id/sections')
  .post(addSectionToChallenge);

router.route('/:id/sections/:sectionId')
  .put(updateSectionInChallenge)
  .delete(deleteSectionFromChallenge);

// Subject routes
router.route('/:id/sections/:sectionId/subjects')
  .post(addSubjectToSection);

router.route('/:id/sections/:sectionId/subjects/batch')
  .post(addMultipleSubjectsToSection);

router.route('/:id/sections/:sectionId/subjects/:subjectId')
  .put(updateSubjectInSection)
  .delete(deleteSubjectFromSection);

module.exports = router;
