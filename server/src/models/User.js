const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  roleId: { type: String, required: true },
  employeeId: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);