const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: {
    type: String,
    enum: ['video', 'article', 'document', 'other'],
    default: 'other'
  }
});

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  resources: [resourceSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  order: Number,
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  subjects: [subjectSchema]
});

const challengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  sections: [sectionSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
challengeSchema.index({ userId: 1, status: 1 });
challengeSchema.index({ userId: 1, isDeleted: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
