const mongoose = require('mongoose');

const ReviewChecklistSchema = new mongoose.Schema({
  project_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  language:    { type: String, default: 'Général' },
  items: [{
    category:  { type: String, enum: ['LISIBILITÉ','SÉCURITÉ','PERFORMANCE','TESTS','DOCUMENTATION','ARCHITECTURE','AUTRE'], default: 'AUTRE' },
    text:      { type: String, required: true },
    weight:    { type: Number, default: 1 },
    mandatory: { type: Boolean, default: false },
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ReviewChecklist', ReviewChecklistSchema);
