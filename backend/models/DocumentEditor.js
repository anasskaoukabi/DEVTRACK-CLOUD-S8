const mongoose = require('mongoose');

const DocumentEditorSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['cahier-des-charges', 'fiche-technique', 'fiche-fonctionnelle', 'pv-sprint', 'rapport-bugs', 'rapport-temps', 'release-notes', 'custom'],
    default: 'custom',
  },
  title: { type: String, required: true, default: 'Nouveau document' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  sprint_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint',  default: null },
  task_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task',    default: null },
  content:    { type: mongoose.Schema.Types.Mixed, default: {} },
  html:       { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
  is_public:  { type: Boolean, default: false },
  shared_with: [{
    type:      { type: String, enum: ['team', 'developer'] },
    ref_id:    { type: mongoose.Schema.Types.ObjectId },
    access:    { type: String, enum: ['READ', 'EDIT'], default: 'READ' },
    shared_at: { type: Date, default: Date.now },
    shared_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('DocumentEditor', DocumentEditorSchema);
