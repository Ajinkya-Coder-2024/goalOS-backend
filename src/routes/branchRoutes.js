const express = require('express');
const {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Create a new branch
router.post('/', createBranch);

// Get all branches for the logged-in user
router.get('/', getBranches);

// Get a single branch by ID
router.get('/:id', getBranch);

// Update a branch
router.put('/:id', updateBranch);

// Delete a branch
router.delete('/:id', deleteBranch);

module.exports = router;
