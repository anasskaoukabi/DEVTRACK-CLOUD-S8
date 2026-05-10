const mongoose = require('mongoose');

const VALID_ROLES = ['ADMIN', 'PO', 'SCRUM_MASTER', 'DEV', 'QA', 'CLIENT'];

const DeveloperSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: VALID_ROLES, default: 'DEV' },
  color: { type: String, default: '#6366f1' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Developer', DeveloperSchema);
