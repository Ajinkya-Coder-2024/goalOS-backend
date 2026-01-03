const Transaction = require('../models/transactionModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, description, date } = req.body;

  // Auto-generate category based on transaction type
  const autoCategory = type === 'earning' ? 'General Earning' : 'General Expense';

  const transaction = await Transaction.create({
    user: req.user.id,
    type,
    amount,
    description,
    date: date ? new Date(date) : Date.now(),
    category: autoCategory
  });

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res) => {
  const { month, year, type } = req.query;
  
  let query = { user: req.user.id };
  
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  if (type) {
    query.type = type;
  }
  
  const transactions = await Transaction.find(query).sort({ date: -1 });
  
  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  let matchQuery = { user: req.user.id };
  
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    matchQuery.date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const result = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        total: 1,
        count: 1
      }
    }
  ]);
  
  const summary = {
    earnings: result.find(r => r.type === 'earning')?.total || 0,
    expenses: result.find(r => r.type === 'expense')?.total || 0,
    transactionCount: result.reduce((sum, r) => sum + r.count, 0)
  };
  
  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res) => {
  const { type, amount, description, date, completed } = req.body;
  
  let transaction = await Transaction.findById(req.params.id);
  
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  
  // Make sure user owns the transaction
  if (transaction.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this transaction');
  }
  
  // Update only the fields that are passed in
  if (type) {
    transaction.type = type;
    // Auto-generate category if type changes
    transaction.category = type === 'earning' ? 'General Earning' : 'General Expense';
  }
  if (amount !== undefined) {
    transaction.amount = amount;
  }
  if (description) {
    transaction.description = description;
  }
  if (date) {
    transaction.date = new Date(date);
  }
  
  // Handle completed status
  if (completed !== undefined) {
    transaction.completed = completed;
  }
  
  const updatedTransaction = await transaction.save();
  
  res.status(200).json({
    success: true,
    data: updatedTransaction
  });
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  
  // Make sure user owns the transaction
  if (transaction.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this transaction');
  }
  
  // Use deleteOne() instead of remove()
  await Transaction.deleteOne({ _id: req.params.id });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});
