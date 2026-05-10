const express = require('express');
const router = express.Router();
const TestPlan = require('../models/TestPlan');
const TestCase = require('../models/TestCase');
const TestCycle = require('../models/TestCycle');
const { authenticateToken } = require('./auth');

const pop = q => q
  .populate('responsible_id', 'name color')
  .populate('sprint_id', 'name')
  .populate('project_id', 'name')
  .populate('created_by', 'name');

// ───── TEST PLANS ─────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, status } = req.query;
    const filter = {};
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;
    const plans = await pop(TestPlan.find(filter).sort('-created_at')).lean();
    // Enrichir avec les compteurs
    const enriched = await Promise.all(plans.map(async p => {
      const caseCount  = await TestCase.countDocuments({ test_plan_id: p._id });
      const cycleCount = await TestCycle.countDocuments({ test_plan_id: p._id });
      return { ...p, id: p._id, case_count: caseCount, cycle_count: cycleCount };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await pop(TestPlan.findById(req.params.id)).lean();
    if (!plan) return res.status(404).json({ error: 'TestPlan not found' });
    const cases  = await TestCase.find({ test_plan_id: plan._id })
      .populate('created_by', 'name').lean();
    const cycles = await TestCycle.find({ test_plan_id: plan._id })
      .populate('assignees', 'name color').lean();
    res.json({ ...plan, id: plan._id, cases, cycles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const plan = await TestPlan.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ ...plan.toObject(), id: plan._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await TestPlan.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!plan) return res.status(404).json({ error: 'TestPlan not found' });
    res.json({ ...plan, id: plan._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await TestPlan.findByIdAndDelete(req.params.id);
    await TestCase.deleteMany({ test_plan_id: req.params.id });
    await TestCycle.deleteMany({ test_plan_id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ───── TEST CASES ─────
router.get('/:planId/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await TestCase.find({ test_plan_id: req.params.planId })
      .populate('created_by', 'name').sort('suite_name order').lean();
    res.json(cases.map(c => ({ ...c, id: c._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:planId/cases', authenticateToken, async (req, res) => {
  try {
    const plan = await TestPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'TestPlan not found' });
    const tc = await TestCase.create({
      ...req.body,
      test_plan_id: req.params.planId,
      project_id: plan.project_id,
      created_by: req.user.id,
    });
    res.status(201).json({ ...tc.toObject(), id: tc._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:planId/cases/:caseId', authenticateToken, async (req, res) => {
  try {
    const tc = await TestCase.findByIdAndUpdate(req.params.caseId,
      { ...req.body, last_updated_by: req.user.id }, { new: true }).lean();
    if (!tc) return res.status(404).json({ error: 'TestCase not found' });
    res.json({ ...tc, id: tc._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:planId/cases/:caseId', authenticateToken, async (req, res) => {
  try {
    await TestCase.findByIdAndDelete(req.params.caseId);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ───── TEST CYCLES ─────
router.get('/:planId/cycles', authenticateToken, async (req, res) => {
  try {
    const cycles = await TestCycle.find({ test_plan_id: req.params.planId })
      .populate('assignees', 'name color')
      .populate('executions.test_case_id', 'title priority suite_name')
      .populate('executions.executed_by', 'name').lean();
    res.json(cycles.map(c => ({ ...c, id: c._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:planId/cycles', authenticateToken, async (req, res) => {
  try {
    const plan = await TestPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'TestPlan not found' });
    // Récupérer tous les cas de test du plan et créer les executions
    const cases = await TestCase.find({ test_plan_id: req.params.planId, status: 'ACTIVE' });
    const executions = cases.map(tc => ({ test_case_id: tc._id, status: 'NOT_RUN' }));
    const cycle = await TestCycle.create({
      ...req.body,
      test_plan_id: req.params.planId,
      project_id: plan.project_id,
      executions,
      created_by: req.user.id,
    });
    const populated = await TestCycle.findById(cycle._id)
      .populate('assignees', 'name color')
      .populate('executions.test_case_id', 'title priority suite_name').lean();
    res.status(201).json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /:planId/cycles/:cycleId/execute/:execId — enregistrer un résultat
router.patch('/:planId/cycles/:cycleId/execute/:execId', authenticateToken, async (req, res) => {
  try {
    const cycle = await TestCycle.findById(req.params.cycleId);
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
    const exec = cycle.executions.id(req.params.execId);
    if (!exec) return res.status(404).json({ error: 'Execution not found' });
    const { status, actual_result, notes, bug_ids, duration_min } = req.body;
    if (status) exec.status = status;
    if (actual_result !== undefined) exec.actual_result = actual_result;
    if (notes !== undefined) exec.notes = notes;
    if (bug_ids) exec.bug_ids = bug_ids;
    if (duration_min !== undefined) exec.duration_min = duration_min;
    exec.executed_by = req.user.id;
    exec.executed_at = new Date();
    await cycle.save();
    const populated = await TestCycle.findById(cycle._id)
      .populate('assignees', 'name color')
      .populate('executions.test_case_id', 'title priority suite_name')
      .populate('executions.executed_by', 'name');
    res.json({ ...populated.toObject(), id: populated._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:planId/cycles/:cycleId/status', authenticateToken, async (req, res) => {
  try {
    const cycle = await TestCycle.findByIdAndUpdate(req.params.cycleId, { status: req.body.status }, { new: true }).lean();
    res.json({ ...cycle, id: cycle._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:planId/cycles/:cycleId', authenticateToken, async (req, res) => {
  try {
    await TestCycle.findByIdAndDelete(req.params.cycleId);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
