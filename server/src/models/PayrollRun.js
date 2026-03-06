const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payrollRunSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  month: { type: String, required: true },
  totalPayout: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'PROCESSED', 'PAID'], default: 'DRAFT' },
}, { timestamps: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);