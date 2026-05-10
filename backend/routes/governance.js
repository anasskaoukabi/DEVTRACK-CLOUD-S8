const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');
const Milestone = require('../models/Milestone');
const ProjectBudget = require('../models/ProjectBudget');
const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const Bug = require('../models/Bug');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');

// ── RISKS ──
router.get('/risks', authenticateToken, async (req, res) => {
  try {
    const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
    const risks = await Risk.find(filter).populate('owner_id', 'name color').populate('created_by', 'name').sort('-created_at').lean();
    res.json(risks.map(r => ({ ...r, id: r._id, score: r.probability * r.impact })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/risks', authenticateToken, async (req, res) => {
  try {
    const risk = await Risk.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ ...risk.toObject(), id: risk._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/risks/:id', authenticateToken, async (req, res) => {
  try {
    const old = await Risk.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Not found' });
    const historyEntry = { date: new Date(), note: `Statut: ${old.status} → ${req.body.status || old.status}`, changed_by: req.user.id };
    const risk = await Risk.findByIdAndUpdate(req.params.id, { ...req.body, $push: { history: historyEntry } }, { new: true }).populate('owner_id', 'name color').lean();
    res.json({ ...risk, id: risk._id, score: risk.probability * risk.impact });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/risks/:id', authenticateToken, async (req, res) => {
  try {
    await Risk.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MILESTONES ──
router.get('/milestones', authenticateToken, async (req, res) => {
  try {
    const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
    const milestones = await Milestone.find(filter).populate('created_by', 'name').populate('task_ids', 'title status').sort('target_date').lean();
    res.json(milestones.map(m => ({ ...m, id: m._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/milestones', authenticateToken, async (req, res) => {
  try {
    const m = await Milestone.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ ...m.toObject(), id: m._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/milestones/:id', authenticateToken, async (req, res) => {
  try {
    const m = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ ...m, id: m._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/milestones/:id', authenticateToken, async (req, res) => {
  try {
    await Milestone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── BUDGET ──
router.get('/budget/:projectId', authenticateToken, async (req, res) => {
  try {
    let budget = await ProjectBudget.findOne({ project_id: req.params.projectId })
      .populate('developer_rates.developer_id', 'name color').lean();
    if (!budget) return res.json({ project_id: req.params.projectId, total_budget: 0, currency: 'EUR', developer_rates: [], expenses: [], cost_from_logs: 0, remaining: 0 });
    // Calculer le coût depuis les time logs
    const timeLogs = await TimeLog.find({ task_id: { $in: (await Task.find({ project_id: req.params.projectId }).select('_id')).map(t => t._id) } }).lean();
    let costFromLogs = 0;
    timeLogs.forEach(log => {
      const rate = budget.developer_rates?.find(r => String(r.developer_id?._id || r.developer_id) === String(log.developer_id));
      if (rate) costFromLogs += log.hours * rate.hourly_rate;
    });
    const manualExpenses = budget.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
    const totalSpent = costFromLogs + manualExpenses;
    res.json({ ...budget, id: budget._id, cost_from_logs: Math.round(costFromLogs), manual_expenses: Math.round(manualExpenses), total_spent: Math.round(totalSpent), remaining: Math.round(budget.total_budget - totalSpent) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/budget/:projectId', authenticateToken, async (req, res) => {
  try {
    const budget = await ProjectBudget.findOneAndUpdate(
      { project_id: req.params.projectId },
      { ...req.body, project_id: req.params.projectId, created_by: req.user.id },
      { upsert: true, new: true }
    ).populate('developer_rates.developer_id', 'name color').lean();
    res.json({ ...budget, id: budget._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ajouter une dépense manuelle
router.post('/budget/:projectId/expenses', authenticateToken, async (req, res) => {
  try {
    const budget = await ProjectBudget.findOneAndUpdate(
      { project_id: req.params.projectId },
      { $push: { expenses: req.body } },
      { new: true, upsert: true }
    ).lean();
    res.json({ ...budget, id: budget._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/budget/:projectId/expenses/:expId', authenticateToken, async (req, res) => {
  try {
    const budget = await ProjectBudget.findOne({ project_id: req.params.projectId });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    budget.expenses = budget.expenses.filter(e => String(e._id) !== req.params.expId);
    await budget.save();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PORTFOLIO ──
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find().lean();
    const enriched = await Promise.all(projects.map(async p => {
      const [tasks, bugs, sprints, budget] = await Promise.all([
        Task.find({ project_id: p._id }).lean(),
        Bug.find({ task_id: { $in: (await Task.find({ project_id: p._id }).select('_id')).map(t => t._id) } }).lean(),
        require('../models/Sprint').find({ project_id: p._id }).lean(),
        ProjectBudget.findOne({ project_id: p._id }).lean(),
      ]);
      const doneTasks = tasks.filter(t => t.status === 'DONE').length;
      const criticalBugs = bugs.filter(b => b.severity === 'CRITICAL' && !['FIXED','CLOSED'].includes(b.status)).length;
      const activeSprint = sprints.find(s => s.status === 'ACTIVE');
      const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
      // Health Score simplifié
      let health = 100;
      if (criticalBugs > 0) health -= Math.min(criticalBugs * 10, 30);
      if (completionRate < 50 && activeSprint) health -= 15;
      health = Math.max(0, Math.min(100, health));
      return {
        ...p, id: p._id,
        stats: { tasks: tasks.length, done: doneTasks, completion_rate: completionRate, critical_bugs: criticalBugs },
        active_sprint: activeSprint ? { name: activeSprint.name, end_date: activeSprint.end_date } : null,
        budget_used_pct: budget ? Math.round(((budget.total_budget - budget.total_budget) / Math.max(budget.total_budget, 1)) * 100) : null,
        health_score: health,
      };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HEALTH SCORE ──
router.get('/health/:projectId', authenticateToken, async (req, res) => {
  try {
    const pid = req.params.projectId;
    const tasks = await Task.find({ project_id: pid }).lean();
    const taskIds = tasks.map(t => t._id);
    const bugs = await Bug.find({ task_id: { $in: taskIds } }).lean();
    const sprints = await require('../models/Sprint').find({ project_id: pid }).lean();
    const risks = await Risk.find({ project_id: pid }).lean();
    const activeSprint = sprints.find(s => s.status === 'ACTIVE');
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const criticalBugs = bugs.filter(b => b.severity === 'CRITICAL' && !['FIXED','CLOSED'].includes(b.status)).length;
    const highRisks = risks.filter(r => r.probability * r.impact >= 9 && !['MITIGATED','CLOSED'].includes(r.status)).length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;
    let score = 100;
    score -= Math.min(criticalBugs * 8, 25);
    score -= Math.min(overdueTasks * 5, 20);
    score -= Math.min(highRisks * 6, 20);
    if (tasks.length > 0 && doneTasks / tasks.length < 0.3 && activeSprint) score -= 15;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const level = score >= 75 ? 'HEALTHY' : score >= 50 ? 'WARNING' : 'CRITICAL';
    res.json({ score, level, details: { critical_bugs: criticalBugs, overdue_tasks: overdueTasks, high_risks: highRisks, completion_rate: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0 } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
