const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  name:         { type: String },
  value:        { type: Number }, // null = pas encore voté
  voted_at:     { type: Date },
}, { _id: false });

const PlanningSessionSchema = new mongoose.Schema({
  project_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  task_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  task_title:   { type: String },
  status:       { type: String, enum: ['WAITING', 'VOTING', 'REVEALED', 'DONE'], default: 'WAITING' },
  votes:        [VoteSchema],
  consensus:    { type: Number },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

PlanningSessionSchema.index({ project_id: 1 });

module.exports = mongoose.model('PlanningSession', PlanningSessionSchema);
