const express = require('express');
const router = express.Router();
const PlanningSession = require('../models/PlanningSession');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

// GET sessions for a project
router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    const filter = project_id ? { project_id } : {};
    const sessions = await PlanningSession.find(filter)
      .populate('task_id', 'title story_points')
      .sort('-created_at').lean();
    res.json(sessions.map(s => ({ ...s, id: s._id })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET single session
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const s = await PlanningSession.findById(req.params.id)
      .populate('task_id', 'title story_points description')
      .populate('created_by', 'name').lean();
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json({ ...s, id: s._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST create session — SCRUM_MASTER, PO, ADMIN
router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id, task_id, task_title } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  try {
    let title = task_title;
    if (task_id && !title) {
      const task = await Task.findById(task_id).lean();
      title = task?.title;
    }
    const session = await PlanningSession.create({
      project_id, task_id, task_title: title,
      status: 'WAITING', votes: [], created_by: req.user.id,
    });
    const obj = session.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH start voting
router.patch('/:id/start', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    const s = await PlanningSession.findByIdAndUpdate(req.params.id, { status: 'VOTING' }, { new: true }).lean();
    res.json({ ...s, id: s._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST vote
router.post('/:id/vote', authenticateToken, async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  try {
    const session = await PlanningSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'VOTING') return res.status(400).json({ error: 'Session is not in voting state' });

    const existing = session.votes.find(v => v.developer_id?.toString() === req.user.id);
    if (existing) {
      existing.value = value;
      existing.voted_at = new Date();
    } else {
      session.votes.push({ developer_id: req.user.id, name: req.user.name, value, voted_at: new Date() });
    }
    await session.save();
    res.json({ message: 'Vote recorded' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH reveal votes
router.patch('/:id/reveal', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    const s = await PlanningSession.findByIdAndUpdate(req.params.id, { status: 'REVEALED' }, { new: true }).lean();
    res.json({ ...s, id: s._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH set consensus & close
router.patch('/:id/consensus', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { consensus } = req.body;
  try {
    const session = await PlanningSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.consensus = consensus;
    session.status = 'DONE';
    await session.save();

    // Update task story_points if linked
    if (session.task_id) {
      await Task.findByIdAndUpdate(session.task_id, { story_points: consensus });
    }
    const obj = session.toObject();
    obj.id = obj._id;
    res.json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    await PlanningSession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
