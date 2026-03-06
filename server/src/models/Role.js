const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roleSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  name: { type: String, enum: ['SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);