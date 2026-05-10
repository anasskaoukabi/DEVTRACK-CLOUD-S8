const express = require('express');
const router = express.Router();
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    const filter = project_id ? { project_id } : {};
    const milestones = await Milestone.find(filter).sort('date').lean();
    const result = await Promise.all(milestones.map(async m => {
      const tasks = await Task.find({ _id: { $in: m.task_ids } }).select('title status').lean();
      const done = tasks.filter(t => t.status === 'DONE').length;
      return { ...m, id: m._id, tasks, doneCount: done, totalCount: tasks.length };
    }));
    res.json(result);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const m = await Milestone.findById(req.params.id).lean();
    if (!m) return res.status(404).json({ error: 'Milestone not found' });
    const tasks = await Task.find({ _id: { $in: m.task_ids } }).select('title status priority').lean();
    res.json({ ...m, id: m._id, tasks });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id, name, description, date, task_ids } = req.body;
  if (!project_id || !name || !date) return res.status(400).json({ error: 'project_id, name, date required' });
  try {
    const m = await Milestone.create({ project_id, name, description, date, task_ids: task_ids || [] });
    const obj = m.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { name, description, date, status, task_ids } = req.body;
  try {
    const upd = {};
    if (name !== undefined) upd.name = name;
    if (description !== undefined) upd.description = description;
    if (date !== undefined) upd.date = date;
    if (status !== undefined) upd.status = status;
    if (task_ids !== undefined) upd.task_ids = task_ids;
    const m = await Milestone.findByIdAndUpdate(req.params.id, upd, { new: true }).lean();
    if (!m) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ ...m, id: m._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  try {
    await Milestone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Milestone deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
