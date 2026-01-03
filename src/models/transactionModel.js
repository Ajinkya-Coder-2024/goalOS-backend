const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earning', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    required: false,
    trim: true,
    default: function() {
      // Auto-generate category based on transaction type
      return this.type === 'earning' ? 'General Earning' : 'General Expense';
    }
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save middleware to auto-generate category if not provided
transactionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    // Auto-generate category if not provided
    if (!this.category) {
      this.category = this.type === 'earning' ? 'General Earning' : 'General Expense';
    }
    // Ensure completed field is set
    if (this.completed === undefined) {
      this.completed = false;
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
