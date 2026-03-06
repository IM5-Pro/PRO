const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payrollDetailSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  payrollRunId: { type: String, required: true },
  employeeId: { type: String, required: true },
  grossSalary: { type: Number, required: true },
  deductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PayrollDetail', payrollDetailSchema);