const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['volunteer', 'organizer', 'both'], default: 'volunteer' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
