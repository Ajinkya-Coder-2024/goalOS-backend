const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use a valid 24-hour time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time'],
    validate: {
      validator: function(v) {
        return v > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  category: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    days: [{
      type: Number,
      min: 0, // Sunday
      max: 6  // Saturday
    }]
  },
  completedAt: {
    type: Date
  }
});

const dailyScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timeSlots: [timeSlotSchema]
}, {
  timestamps: true,
  // Create a compound index on userId and date for faster lookups
  // and to ensure a user can only have one schedule per day
  autoIndex: true
});

// Compound index for faster queries
// This ensures that a user can only have one schedule per day
dailyScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

// Create a model using the schema
const DailySchedule = mongoose.model('DailySchedule', dailyScheduleSchema);

module.exports = DailySchedule;
