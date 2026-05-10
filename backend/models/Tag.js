const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  color:      { type: String, default: '#6366f1' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

TagSchema.index({ project_id: 1 });

module.exports = mongoose.model('Tag', TagSchema);
