const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const nilavantiUserSchema = new mongoose.Schema({
  username: {
    type: String,
    default: 'Nilauser', // Default username
    required: true,
    immutable: true // Prevents modification after creation
  },
  email: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `${this.username.toLowerCase()}@nilavanti.com`; // Auto-generated email
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
nilavantiUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
nilavantiUserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the model if it doesn't exist
const NilavantiUser = mongoose.models.NilavantiUser || mongoose.model('NilavantiUser', nilavantiUserSchema);

module.exports = NilavantiUser;
