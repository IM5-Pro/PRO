const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const leaveRequestSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  employeeId: { type: String, required: true },
  leaveTypeId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);