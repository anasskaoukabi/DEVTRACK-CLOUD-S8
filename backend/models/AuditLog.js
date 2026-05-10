const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  user_name:   { type: String },
  action:      { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  entity_type: { type: String, required: true }, // 'task' | 'project' | 'sprint' | 'bug' etc.
  entity_id:   { type: mongoose.Schema.Types.ObjectId, required: true },
  entity_name: { type: String },
  changes:     { type: mongoose.Schema.Types.Mixed }, // { field: { before, after } }
  ip:          { type: String },
  timestamp:   { type: Date, default: Date.now },
});

AuditLogSchema.index({ entity_type: 1, entity_id: 1, timestamp: -1 });
AuditLogSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
