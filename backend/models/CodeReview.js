const mongoose = require('mongoose');

const CodeReviewSchema = new mongoose.Schema({
  task_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  project_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reviewer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true },
  checklist_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewChecklist', default: null },
  status:        { type: String, enum: ['PENDING','IN_PROGRESS','APPROVED','REJECTED'], default: 'PENDING' },
  items: [{
    item_text:  { type: String },
    category:   { type: String },
    mandatory:  { type: Boolean, default: false },
    passed:     { type: Boolean, default: null },
    comment:    { type: String, default: '' },
  }],
  global_comment: { type: String, default: '' },
  score:          { type: Number, default: null }, // % items passés
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('CodeReview', CodeReviewSchema);
