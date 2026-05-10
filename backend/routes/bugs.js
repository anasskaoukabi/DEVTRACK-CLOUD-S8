const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { authorize, authorizeMin } = require('../middleware/authorize');
const { createNotification } = require('./notifications');

// GET bugs — tous les rôles
router.get('/', authenticateToken, async (req, res) => {
  const { task_id } = req.query;
  try {
    const filter = task_id ? { task_id } : {};
    const bugs = await Bug.find(filter).sort('-created_at').lean();
    res.json(bugs.map(b => ({ ...b, id: b._id })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create bug — QA, DEV, SCRUM_MASTER, PO, ADMIN
router.post('/', authenticateToken, authorizeMin('QA'), async (req, res) => {
  const { task_id, title, description, steps, severity } = req.body;
  if (!task_id || !title) return res.status(400).json({ error: 'task_id and title required' });

  try {
    const bug = await Bug.create({ task_id, title, description, steps, severity });

    // Notify task assignee when a CRITICAL bug is opened
    if (severity === 'CRITICAL') {
      const task = await Task.findById(task_id).lean();
      if (task?.developer_id) {
        await createNotification(
          task.developer_id, 'BUG_CRITICAL',
          `Bug critique "${title}" signalé sur votre tâche "${task.title}"`,
          'task', task._id
        );
      }
    }

    const obj = bug.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update/close bug — QA, DEV, SCRUM_MASTER, PO, ADMIN
router.put('/:id', authenticateToken, authorizeMin('QA'), async (req, res) => {
  const { title, description, steps, severity, status } = req.body;
  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (steps !== undefined) updateData.steps = steps;
    if (severity !== undefined) updateData.severity = severity;
    if (status !== undefined) {
      updateData.status = status;
      if (['FIXED', 'CLOSED'].includes(status)) updateData.fixed_at = new Date();
    }

    const bug = await Bug.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    bug.id = bug._id;
    res.json(bug);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE bug — QA, SCRUM_MASTER, PO, ADMIN
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER', 'QA']), async (req, res) => {
  try {
    await Bug.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bug deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
