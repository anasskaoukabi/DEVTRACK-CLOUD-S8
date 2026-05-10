const mongoose = require('mongoose');

const NOTIF_TYPES = [
  'TASK_ASSIGNED',  // task assigned to developer
  'TASK_STATUS',    // task status changed
  'BUG_CRITICAL',   // critical bug opened on an assigned task
  'SPRINT_STARTED', // sprint becomes active
  'SPRINT_ENDED',   // sprint completed
  'MENTION',        // @mention in a comment
];

const NotificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true },
  type:         { type: String, enum: NOTIF_TYPES, required: true },
  message:      { type: String, required: true },
  entity_type:  { type: String }, // 'task' | 'bug' | 'sprint' | 'milestone'
  entity_id:    { type: mongoose.Schema.Types.ObjectId },
  read:         { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now },
});

NotificationSchema.index({ recipient_id: 1, read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
