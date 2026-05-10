const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  stack: { type: String, default: '[]' },
  deadline: { type: Date },
  status: { type: String, default: 'ACTIVE' },
  developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer' }]
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Project', ProjectSchema);
