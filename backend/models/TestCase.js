const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  project_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  test_plan_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'TestPlan', required: true },
  suite_name:    { type: String, default: 'Général' },
  title:         { type: String, required: true },
  description:   { type: String, default: '' },
  test_type:     { type: String, enum: ['MANUAL','AUTOMATED'], default: 'MANUAL' },
  priority:      { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
  status:        { type: String, enum: ['ACTIVE','DEPRECATED'], default: 'ACTIVE' },
  preconditions: [{ type: String }],
  steps: [{
    order:           { type: Number },
    action:          { type: String },
    expected_result: { type: String },
    data_input:      { type: String, default: '' },
  }],
  expected_result_global: { type: String, default: '' },
  feature_ids:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  tags:           [{ type: String }],
  estimated_duration_min: { type: Number, default: 10 },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  last_updated_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestCase', TestCaseSchema);
