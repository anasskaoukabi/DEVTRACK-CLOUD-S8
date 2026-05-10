const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true },
  hours: { type: Number, required: true },
  description: { type: String },
}, { timestamps: { createdAt: 'logged_at', updatedAt: false } });

module.exports = mongoose.model('TimeLog', TimeLogSchema);
