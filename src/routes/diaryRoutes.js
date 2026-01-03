const express = require('express');
const {
  createDiaryEntry,
  getDiaryEntries,
  getDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  getEntriesByDateRange,
  getEntryByDate
} = require('../controllers/diaryController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Debug route to test if routes are reachable
router.get('/test-route', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test route is working',
    method: req.method,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    params: req.params
  });
});

// All routes are protected and require authentication
router.use(protect);

// Base route: /api/diary
router.route('/entries')
  .post(createDiaryEntry)
  .get(getDiaryEntries);

router.route('/entries/:id')
  .get(getDiaryEntry)
  .patch(updateDiaryEntry)
  .delete(deleteDiaryEntry);

router.get('/entries/dates', getEntriesByDateRange);
router.get('/entries/date/:date', getEntryByDate);

module.exports = router;
