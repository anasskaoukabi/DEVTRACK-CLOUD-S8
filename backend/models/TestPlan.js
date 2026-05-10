const mongoose = require('mongoose');

const TestPlanSchema = new mongoose.Schema({
  project_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprint_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['DRAFT','ACTIVE','COMPLETED','ARCHIVED'], default: 'DRAFT' },
  test_type:   { type: String, enum: ['FUNCTIONAL','REGRESSION','INTEGRATION','PERFORMANCE','SECURITY','ACCEPTANCE','SMOKE'], default: 'FUNCTIONAL' },
  environment: { type: String, default: 'STAGING' },
  responsible_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
  start_date:  { type: Date, default: null },
  end_date:    { type: Date, default: null },
  objectives:       [{ type: String }],
  scope_in:         [{ type: String }],
  scope_out:        [{ type: String }],
  entry_criteria:   [{ type: String }],
  exit_criteria:    [{ type: String }],
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestPlan', TestPlanSchema);
