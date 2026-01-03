const mongoose = require("mongoose");

const specialTaskSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Please add a date for the task"],
    },
    description: {
      type: String,
      required: [true, "Please add a task description"],
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
  },
  { _id: true }
);

const specialScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Please add a start date"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "Please add an end date"],
      index: true,
      validate: {
        validator: function (v) {
          return !this.startDate || v >= this.startDate;
        },
        message: "End date cannot be before start date",
      },
    },
    tasks: [specialTaskSchema],
  },
  {
    timestamps: true,
  }
);

specialScheduleSchema.index({ userId: 1, startDate: 1, endDate: 1 });

const SpecialSchedule = mongoose.model(
  "SpecialSchedule",
  specialScheduleSchema
);

module.exports = SpecialSchedule;
