const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const Bug = require('../models/Bug');
const Developer = require('../models/Developer');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

// GET portfolio view — ADMIN, PO
router.get('/', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  try {
    const projects = await Project.find().populate('developers', 'name color role').sort('-created_at').lean();

    const result = await Promise.all(projects.map(async p => {
      const tasks = await Task.find({ project_id: p._id }).lean();
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'DONE').length;
      const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;

      const taskIds = tasks.map(t => t._id);
      const openBugs = await Bug.countDocuments({ task_id: { $in: taskIds }, status: { $nin: ['FIXED', 'CLOSED'] } });
      const critBugs = await Bug.countDocuments({ task_id: { $in: taskIds }, severity: 'CRITICAL', status: { $nin: ['FIXED', 'CLOSED'] } });

      const activeSprint = await Sprint.findOne({ project_id: p._id, status: 'ACTIVE' }).lean();
      const sprints = await Sprint.find({ project_id: p._id, status: 'COMPLETED' }).lean();
      const avgVelocity = sprints.length > 0
        ? Math.round(sprints.reduce((s, sp) => s + (sp.velocity || 0), 0) / sprints.length)
        : 0;

      // Health score 0-100
      const completionScore = total > 0 ? (done / total) * 40 : 20;
      const bugPenalty = Math.min(critBugs * 10, 30);
      const velocityScore = avgVelocity > 0 ? Math.min(avgVelocity, 30) : 0;
      const health = Math.max(0, Math.round(completionScore + velocityScore - bugPenalty));

      return {
        id: p._id,
        name: p.name,
        description: p.description,
        status: p.status,
        stack: JSON.parse(p.stack || '[]'),
        deadline: p.deadline,
        developers: p.developers,
        totalTasks: total,
        doneTasks: done,
        inProgressTasks: inProgress,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        openBugs,
        criticalBugs: critBugs,
        activeSprint: activeSprint ? { id: activeSprint._id, name: activeSprint.name } : null,
        completedSprints: sprints.length,
        avgVelocity,
        health,
        created_at: p.created_at,
      };
    }));

    const globalStats = {
      totalProjects: result.length,
      activeProjects: result.filter(p => p.status === 'ACTIVE').length,
      totalTasks: result.reduce((s, p) => s + p.totalTasks, 0),
      totalDone: result.reduce((s, p) => s + p.doneTasks, 0),
      totalCriticalBugs: result.reduce((s, p) => s + p.criticalBugs, 0),
      totalDevelopers: await Developer.countDocuments(),
    };

    res.json({ projects: result, globalStats });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
