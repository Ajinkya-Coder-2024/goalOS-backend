const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/festivalController');

// All routes are protected
router.use(protect);

// Festivals CRUD
router.get('/', ctrl.getFestivals);
router.post('/', ctrl.createFestival);
router.get('/:id', ctrl.getFestivalById);
router.put('/:id', ctrl.updateFestival);
router.delete('/:id', ctrl.deleteFestival);

// Bucket items on a festival
router.post('/:id/items', ctrl.addBucketItem);
router.put('/:id/items/:itemId', ctrl.updateBucketItem);
router.delete('/:id/items/:itemId', ctrl.deleteBucketItem);

module.exports = router;
