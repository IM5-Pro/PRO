const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const leaveTypeSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  name: { type: String, enum: ['CL', 'SL', 'EL', 'LOP'], required: true },
  totalDays: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);