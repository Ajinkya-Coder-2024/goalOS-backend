const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the material'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    required: [true, 'Please provide a link to the material'],
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'website', 'document', 'other'],
    default: 'other'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyBranch',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
