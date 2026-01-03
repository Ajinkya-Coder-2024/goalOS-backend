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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  materials: [studyMaterialSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const studyStructureSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  branches: [{
    name: {
      type: String,
      required: [true, 'Please add a branch name'],
      trim: true,
      maxlength: [100, 'Branch name cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true
    },
    subjects: [subjectSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a new branch to the user's study structure
studyStructureSchema.methods.addBranch = async function(branchData) {
  this.branches.push(branchData);
  await this.save();
  return this.branches[this.branches.length - 1];
};

// Add a subject to a specific branch
studyStructureSchema.methods.addSubject = async function(branchId, subjectData) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  branch.subjects.push(subjectData);
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  await this.save();
  return branch.subjects[branch.subjects.length - 1];
};

// Add study material to a specific subject in a branch
studyStructureSchema.methods.addStudyMaterial = async function(branchId, subjectId, materialData) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  
  const subject = branch.subjects.id(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  subject.materials.push(materialData);
  subject.updatedAt = Date.now();
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  
  await this.save();
  return subject.materials[subject.materials.length - 1];
};

// Update a branch
studyStructureSchema.methods.updateBranch = async function(branchId, updateData) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  
  Object.assign(branch, updateData);
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  
  await this.save();
  return branch;
};

// Update a subject
studyStructureSchema.methods.updateSubject = async function(branchId, subjectId, updateData) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  
  const subject = branch.subjects.id(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  Object.assign(subject, updateData);
  subject.updatedAt = Date.now();
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  
  await this.save();
  return subject;
};

// Delete a branch
studyStructureSchema.methods.deleteBranch = async function(branchId) {
  const branchIndex = this.branches.findIndex(b => b._id.toString() === branchId);
  if (branchIndex === -1) {
    throw new Error('Branch not found');
  }
  
  this.branches.splice(branchIndex, 1);
  this.updatedAt = Date.now();
  
  await this.save();
  return { success: true };
};

// Delete a subject
studyStructureSchema.methods.deleteSubject = async function(branchId, subjectId) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  
  const subjectIndex = branch.subjects.findIndex(s => s._id.toString() === subjectId);
  if (subjectIndex === -1) {
    throw new Error('Subject not found');
  }
  
  branch.subjects.splice(subjectIndex, 1);
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  
  await this.save();
  return { success: true };
};

// Delete a study material
studyStructureSchema.methods.deleteStudyMaterial = async function(branchId, subjectId, materialId) {
  const branch = this.branches.id(branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }
  
  const subject = branch.subjects.id(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  const materialIndex = subject.materials.findIndex(m => m._id.toString() === materialId);
  if (materialIndex === -1) {
    throw new Error('Study material not found');
  }
  
  subject.materials.splice(materialIndex, 1);
  subject.updatedAt = Date.now();
  branch.updatedAt = Date.now();
  this.updatedAt = Date.now();
  
  await this.save();
  return { success: true };
};

// Create a new study structure for a user if it doesn't exist
studyStructureSchema.statics.initializeForUser = async function(userId) {
  let structure = await this.findOne({ user: userId });
  
  if (!structure) {
    structure = await this.create({ user: userId, branches: [] });
  }
  
  return structure;
};

const StudyStructure = mongoose.model('StudyStructure', studyStructureSchema);

module.exports = StudyStructure;
