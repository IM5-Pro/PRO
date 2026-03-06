const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const attendanceSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  employeeId: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'WFH'] },
  deviceId: { type: String },
  punchTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);