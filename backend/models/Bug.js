const mongoose = require('mongoose');

const BugSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  title: { type: String, required: true },
  description: { type: String },
  steps: { type: String },
  severity: { type: String, default: 'MEDIUM' },
  status: { type: String, default: 'OPEN' },
  fixed_at: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Bug', BugSchema);
