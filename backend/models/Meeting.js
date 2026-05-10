const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  type:         { type: String, enum: ['STANDUP', 'SPRINT_REVIEW', 'RETROSPECTIVE', 'PLANNING', 'AUTRE'], default: 'AUTRE' },
  status:       { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED'], default: 'SCHEDULED' },
  team_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  project_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  attendees:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer' }],
  date:         { type: Date, required: true },
  duration_min: { type: Number, default: 30 },
  location:     { type: String, default: '' },
  agenda: [{
    order:        { type: Number },
    topic:        { type: String },
    duration_min: { type: Number },
    owner:        { type: String },
  }],
  notes:        { type: String, default: '' },
  action_items: [{
    text:        { type: String },
    assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
    due_date:    { type: Date, default: null },
    done:        { type: Boolean, default: false },
  }],
  document_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentEditor' }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Meeting', MeetingSchema);
