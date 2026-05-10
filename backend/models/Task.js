const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  done:        { type: Boolean, default: false },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  order:       { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const TaskSchema = new mongoose.Schema({
  project_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprint_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  milestone_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  title:          { type: String, required: true },
  description:    { type: String },
  type:           { type: String, default: 'FEATURE' },
  priority:       { type: String, default: 'MEDIUM' },
  status:         { type: String, default: 'BACKLOG' },
  story_points:   { type: Number },
  estimated_hours:{ type: Number },
  deadline:       { type: Date },
  developer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  tag_ids:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  blocked_by:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  subtasks:       [SubtaskSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

TaskSchema.index({ project_id: 1, status: 1 });
TaskSchema.index({ sprint_id: 1 });
TaskSchema.index({ developer_id: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
