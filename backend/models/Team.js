const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#6366f1' },
  avatar:      { type: String, default: '👥' },
  members: [{
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
    role_in_team: { type: String, enum: ['LEAD', 'MEMBER'], default: 'MEMBER' },
  }],
  project_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Team', TeamSchema);
