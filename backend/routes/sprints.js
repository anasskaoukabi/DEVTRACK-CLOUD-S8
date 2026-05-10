const express = require('express');
const router = express.Router();
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');
const { createNotification } = require('./notifications');

// GET sprints — tous les rôles
router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    const filter = project_id ? { project_id } : {};
    const sprints = await Sprint.find(filter).sort('-created_at').lean();
    res.json(sprints.map(s => ({ ...s, id: s._id })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single sprint — tous les rôles
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).lean();
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = await Task.find({ sprint_id: sprint._id }).populate('developer_id', 'name color').lean();
    const mappedTasks = tasks.map(t => ({
      ...t, id: t._id,
      developer_name: t.developer_id?.name,
      developer_color: t.developer_id?.color,
      developer_id: t.developer_id?._id,
    }));

    res.json({ ...sprint, id: sprint._id, tasks: mappedTasks });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create sprint — SCRUM_MASTER, PO, ADMIN
router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id, name, start_date, end_date, objectives, status } = req.body;
  if (!project_id || !name) return res.status(400).json({ error: 'project_id and name required' });

  try {
    const sprint = await Sprint.create({ project_id, name, start_date, end_date, objectives, status });
    const obj = sprint.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update sprint — SCRUM_MASTER, PO, ADMIN
router.put('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { name, start_date, end_date, objectives, status, velocity } = req.body;

  try {
    const before = await Sprint.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: 'Sprint not found' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (objectives !== undefined) updateData.objectives = objectives;
    if (status !== undefined) updateData.status = status;
    if (velocity !== undefined) updateData.velocity = velocity;

    const sprint = await Sprint.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    sprint.id = sprint._id;

    // Notify sprint developers when sprint becomes ACTIVE
    if (status === 'ACTIVE' && before.status !== 'ACTIVE') {
      const assignedDevIds = await Task.distinct('developer_id', { sprint_id: sprint._id, developer_id: { $ne: null } });
      for (const devId of assignedDevIds) {
        await createNotification(devId, 'SPRINT_STARTED',
          `Sprint "${sprint.name}" a démarré`, 'sprint', sprint._id);
      }
    }

    res.json(sprint);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST complete sprint — SCRUM_MASTER, PO, ADMIN
router.post('/:id/complete', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const force = req.body.force === true;
    const notDoneCount = await Task.countDocuments({ sprint_id: sprint._id, status: { $ne: 'DONE' } });

    if (notDoneCount > 0 && !force) {
      return res.status(400).json({
        error: `RG-02: There are ${notDoneCount} unfinished tasks. Use force=true to push them to backlog.`,
      });
    }
    if (notDoneCount > 0 && force) {
      await Task.updateMany({ sprint_id: sprint._id, status: { $ne: 'DONE' } }, { sprint_id: null });
    }

    const tasks = await Task.find({ sprint_id: sprint._id, status: 'DONE' }).lean();
    const velocity = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

    sprint.status = 'COMPLETED';
    sprint.velocity = velocity;
    await sprint.save();

    // Notify all developers who had tasks in this sprint
    const assignedDevIds = await Task.distinct('developer_id', { sprint_id: sprint._id, developer_id: { $ne: null } });
    for (const devId of assignedDevIds) {
      await createNotification(devId, 'SPRINT_ENDED',
        `Sprint "${sprint.name}" terminé — vélocité: ${velocity} SP`, 'sprint', sprint._id);
    }

    const obj = sprint.toObject();
    obj.id = obj._id;
    res.json(obj);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE sprint — SCRUM_MASTER, PO, ADMIN
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    await Sprint.findByIdAndDelete(req.params.id);
    await Task.updateMany({ sprint_id: req.params.id }, { sprint_id: null });
    res.json({ message: 'Sprint deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
