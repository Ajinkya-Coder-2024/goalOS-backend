import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: Date;
  category?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
}

export interface IDailySchedule extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  timeSlots: (ITimeSlot & { _id: mongoose.Types.ObjectId })[];
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>({
  startTime: { type: String, required: true, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  endTime: { type: String, required: true, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  description: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  completedAt: { type: Date },
  category: { type: String, trim: true },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  }
}, { _id: true });

const dailyScheduleSchema = new Schema<IDailySchedule>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  date: { 
    type: Date, 
    required: true, 
    index: true,
    set: (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  timeSlots: [timeSlotSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster lookups
dailyScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailySchedule = mongoose.model<IDailySchedule>('DailySchedule', dailyScheduleSchema);

export default DailySchedule;
