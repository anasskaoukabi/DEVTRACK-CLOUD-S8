const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  task_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  author:            { type: String, required: true },
  author_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  content:           { type: String, required: true },
  is_technical_note: { type: Boolean, default: false },
  mentioned_ids:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer' }],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

CommentSchema.index({ task_id: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
