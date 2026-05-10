const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  from_status: { type: String },
  to_status: { type: String, required: true },
}, { timestamps: { createdAt: 'changed_at', updatedAt: false } });

module.exports = mongoose.model('StatusHistory', StatusHistorySchema);
