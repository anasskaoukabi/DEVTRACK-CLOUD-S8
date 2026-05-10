const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  objectives: { type: String },
  status: { type: String, default: 'ACTIVE' },
  velocity: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Sprint', SprintSchema);
