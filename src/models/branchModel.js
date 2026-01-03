const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a branch name'],
    trim: true,
    maxlength: [100, 'Branch name cannot be more than 100 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting subjects in this branch
branchSchema.virtual('subjects', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'branch',
  justOne: false
});

// Cascade delete subjects when a branch is deleted
branchSchema.pre('remove', async function(next) {
  console.log(`Subjects being removed from branch ${this._id}`);
  await this.model('Subject').deleteMany({ branch: this._id });
  next();
});

module.exports = mongoose.model('Branch', branchSchema);
