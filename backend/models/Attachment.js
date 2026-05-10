const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  task_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  filename:    { type: String, required: true },
  originalname:{ type: String, required: true },
  mimetype:    { type: String, required: true },
  size:        { type: Number, required: true },
  path:        { type: String, required: true },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

AttachmentSchema.index({ task_id: 1 });

module.exports = mongoose.model('Attachment', AttachmentSchema);
