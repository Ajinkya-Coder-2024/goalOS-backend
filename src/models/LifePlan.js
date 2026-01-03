const mongoose = require('mongoose');

const lifePlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startAge: {
    type: Number,
    required: [true, 'Please add a start age'],
    min: [18, 'Start age must be at least 18'],
    max: [100, 'Start age cannot be more than 100']
  },
  endAge: {
    type: Number,
    required: [true, 'Please add an end age'],
    min: [19, 'End age must be at least 1 year after start age'],
    max: [100, 'End age cannot be more than 100']
  },
  targetYear: {
    type: Number,
    required: [true, 'Please add a target year'],
    min: [2024, 'Target year must be in the future']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for user and targetYear for faster querying
lifePlanSchema.index({ user: 1, targetYear: 1 });

module.exports = mongoose.model('LifePlan', lifePlanSchema);
