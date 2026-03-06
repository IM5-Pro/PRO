const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const salaryTemplateSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  name: { type: String, required: true },
  basic: { type: Number, required: true },
  hra: { type: Number, required: true },
  allowance: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SalaryTemplate', salaryTemplateSchema);