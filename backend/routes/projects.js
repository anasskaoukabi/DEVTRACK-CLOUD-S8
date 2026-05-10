const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Sprint = require('../models/Sprint');
const Developer = require('../models/Developer');
const { authenticateToken } = require('./auth');
const { authorize, authorizeMin } = require('../middleware/authorize');

// GET all projects — tous les rôles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find().populate('developers').sort('-created_at').lean();

    const result = await Promise.all(projects.map(async p => {
      const total = await Task.countDocuments({ project_id: p._id });
      const done = await Task.countDocuments({ project_id: p._id, status: 'DONE' });

      const tasks = await Task.find({ project_id: p._id }).select('_id');
      const taskIds = tasks.map(t => t._id);

      const critBugs = await Bug.countDocuments({
        task_id: { $in: taskIds },
        severity: 'CRITICAL',
        status: { $nin: ['FIXED', 'CLOSED'] }
      });

      return {
        ...p,
        id: p._id,
        stack: JSON.parse(p.stack || '[]'),
        totalTasks: total,
        doneTasks: done,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        criticalBugs: critBugs,
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single project — tous les rôles
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('developers').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sprints = await Sprint.find({ project_id: project._id }).sort('-created_at').lean();

    const tasks = await Task.find({ project_id: project._id })
      .populate('developer_id', 'name color')
      .lean();

    const mappedTasks = tasks.map(t => ({
      ...t,
      id: t._id,
      developer_name: t.developer_id?.name,
      developer_color: t.developer_id?.color,
      developer_id: t.developer_id?._id
    }));

    const total = mappedTasks.length;
    const done = mappedTasks.filter(t => t.status === 'DONE').length;

    const taskIds = mappedTasks.map(t => t._id);
    const openBugs = await Bug.countDocuments({
      task_id: { $in: taskIds },
      status: { $nin: ['FIXED', 'CLOSED'] }
    });

    res.json({
      ...project,
      id: project._id,
      stack: JSON.parse(project.stack || '[]'),
      sprints: sprints.map(s => ({...s, id: s._id})),
      tasks: mappedTasks,
      stats: {
        totalTasks: total,
        doneTasks: done,
        remainingTasks: total - done,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        openBugs,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create project — PO, ADMIN
router.post('/', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  const { name, description, stack = [], deadline, developer_ids = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const project = await Project.create({
      name,
      description,
      stack: JSON.stringify(stack),
      deadline,
      developers: developer_ids
    });

    const populated = await Project.findById(project._id).populate('developers').lean();
    populated.id = populated._id;
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update project — PO, ADMIN
router.put('/:id', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  const { name, description, stack, deadline, status } = req.body;

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (stack !== undefined) updateData.stack = JSON.stringify(stack);
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('developers').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.id = project._id;
    res.json({ ...project, stack: JSON.parse(project.stack || '[]') });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE project — ADMIN seulement
router.delete('/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Task.deleteMany({ project_id: req.params.id });
    await Sprint.deleteMany({ project_id: req.params.id });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET dashboard stats — tous les rôles
router.get('/:id/dashboard', authenticateToken, async (req, res) => {
  const pid = req.params.id;

  try {
    const project = await Project.findById(pid).populate('developers').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const tasks = await Task.find({ project_id: pid }).lean();
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const remaining = total - done;

    const taskIds = tasks.map(t => t._id);
    const openBugs = await Bug.countDocuments({
      task_id: { $in: taskIds },
      status: { $nin: ['FIXED', 'CLOSED'] }
    });

    const critBugs = await Bug.find({
      task_id: { $in: taskIds },
      severity: 'CRITICAL',
      status: { $nin: ['FIXED', 'CLOSED'] }
    }).populate('task_id', 'title').lean();

    const mappedCritBugs = critBugs.map(b => ({
      ...b, id: b._id, task_title: b.task_id?.title, task_id: b.task_id?._id
    }));

    const activeSprint = await Sprint.findOne({ project_id: pid, status: 'ACTIVE' }).sort('-created_at').lean();
    let velocity = 0;
    let burndown = [];

    if (activeSprint) {
      activeSprint.id = activeSprint._id;
      const sprintTasks = await Task.find({ sprint_id: activeSprint._id }).lean();
      velocity = sprintTasks.filter(t => t.status === 'DONE').reduce((s, t) => s + (t.story_points || 0), 0);

      const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
      const start = new Date(activeSprint.start_date || activeSprint.created_at);
      const end = new Date(activeSprint.end_date || new Date().getTime() + 14*24*60*60*1000);
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

      for (let i = 0; i <= days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        burndown.push({
          day: `J${i}`,
          ideal: Math.round(totalSP - (totalSP / days) * i),
          actual: i === days ? totalSP - velocity : null,
        });
      }
      if (burndown.length > 0) {
        burndown[0].actual = totalSP;
        burndown[Math.floor(days / 2)].actual = Math.round(totalSP * 0.55);
      }
    }

    const workload = project.developers.map(d => {
      const devTasks = tasks.filter(t => t.developer_id?.toString() === d._id.toString());
      return {
        id: d._id,
        name: d.name,
        color: d.color,
        active_tasks: devTasks.filter(t => ['IN_PROGRESS','IN_REVIEW'].includes(t.status)).length,
        total_tasks: devTasks.length
      };
    });

    res.json({
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      doneTasks: done,
      remainingTasks: remaining,
      totalTasks: total,
      openBugs,
      criticalBugs: mappedCritBugs,
      velocity,
      activeSprint,
      burndown,
      workload,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add developer to project — PO, ADMIN
router.post('/:id/developers', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  const { developer_id } = req.body;
  try {
    await Project.findByIdAndUpdate(req.params.id, { $addToSet: { developers: developer_id } });
    res.status(201).json({ message: 'Developer added to project' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE remove developer from project — PO, ADMIN
router.delete('/:id/developers/:devId', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { $pull: { developers: req.params.devId } });
    res.json({ message: 'Developer removed from project' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
