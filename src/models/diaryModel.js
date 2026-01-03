const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    type: String,
    required: [true, 'Please add some content']
  },
  goodThings: [{
    type: String
  }],
  badThings: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index for user and date
// diaryEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Diary', diaryEntrySchema);
