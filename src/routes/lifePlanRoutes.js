const express = require('express');
const lifePlanController = require('../controllers/lifePlanController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Get all plans or create a new plan
router.route('/')
  .get(lifePlanController.getLifePlans)     // GET /api/life-plans
  .post(lifePlanController.createLifePlan); // POST /api/life-plans

// Get, update, or delete a specific plan
router.route('/:id')
  .get(lifePlanController.getLifePlan)      // GET /api/life-plans/:id
  .put(lifePlanController.updateLifePlan)   // PUT /api/life-plans/:id
  .delete(lifePlanController.deleteLifePlan); // DELETE /api/life-plans/:id

// Get plans within a specific year range
router.get('/range/:startYear/:endYear', lifePlanController.getPlansByYearRange); // GET /api/life-plans/range/2025/2030

module.exports = router;
