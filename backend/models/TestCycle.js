const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema({
  test_case_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
  assigned_to:  { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
  status:       { type: String, enum: ['NOT_RUN','PASS','FAIL','BLOCKED','SKIPPED'], default: 'NOT_RUN' },
  executed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
  executed_at:  { type: Date, default: null },
  actual_result:{ type: String, default: '' },
  duration_min: { type: Number, default: 0 },
  bug_ids:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bug' }],
  attachments:  [{ type: String }],
  notes:        { type: String, default: '' },
});

const TestCycleSchema = new mongoose.Schema({
  test_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestPlan', required: true },
  project_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprint_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  name:         { type: String, required: true },
  status:       { type: String, enum: ['PLANNED','IN_PROGRESS','COMPLETED'], default: 'PLANNED' },
  environment:  { type: String, default: 'STAGING' },
  start_date:   { type: Date, default: null },
  end_date:     { type: Date, default: null },
  assignees:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer' }],
  executions:   [ExecutionSchema],
  notes:        { type: String, default: '' },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Méthodes virtuelles pour les métriques
TestCycleSchema.virtual('metrics').get(function () {
  const total = this.executions.length;
  const pass  = this.executions.filter(e => e.status === 'PASS').length;
  const fail  = this.executions.filter(e => e.status === 'FAIL').length;
  const blocked = this.executions.filter(e => e.status === 'BLOCKED').length;
  const notRun  = this.executions.filter(e => e.status === 'NOT_RUN').length;
  const skipped = this.executions.filter(e => e.status === 'SKIPPED').length;
  const executed = total - notRun;
  return {
    total, pass, fail, blocked, notRun, skipped, executed,
    pass_rate: executed > 0 ? Math.round((pass / executed) * 100) : 0,
    coverage:  total > 0 ? Math.round((executed / total) * 100) : 0,
  };
});

TestCycleSchema.set('toJSON', { virtuals: true });
TestCycleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TestCycle', TestCycleSchema);
