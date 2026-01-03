const mongoose = require('mongoose');

const bucketItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const festivalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    items: { type: [bucketItemSchema], default: [] },
  },
  { timestamps: true }
);

festivalSchema.index({ user: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('Festival', festivalSchema);
