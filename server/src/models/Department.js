const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const departmentSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  name: { type: String, unique: true, required: true },
  managerId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);