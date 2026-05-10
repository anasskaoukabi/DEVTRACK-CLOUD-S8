const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  project_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:         { type: String, required: true },
  description:  { type: String, default: '' },
  target_date:  { type: Date, required: true },
  actual_date:  { type: Date, default: null },
  status:       { type: String, enum: ['UPCOMING','ON_TRACK','AT_RISK','DELAYED','COMPLETED'], default: 'UPCOMING' },
  task_ids:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  deliverables: [{ type: String }],
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Milestone', MilestoneSchema);
