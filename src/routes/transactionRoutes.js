const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  getTransactionSummary,
  deleteTransaction
} = require('../controllers/transactionController');

// Protect all routes with authentication
router.use(protect);

// Routes for /api/transactions
router
  .route('/')
  .post(createTransaction)
  .get(getTransactions);

// Route for transaction summary
router.get('/summary', getTransactionSummary);

// Routes for specific transaction
router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
