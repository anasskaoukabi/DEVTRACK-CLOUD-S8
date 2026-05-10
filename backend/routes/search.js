const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const { authenticateToken } = require('./auth');

router.get('/', authenticateToken, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ projects: [], tasks: [], bugs: [] });

  const searchRegex = new RegExp(query, 'i');

  try {
    const projects = await Project.find({
      $or: [{ name: searchRegex }, { description: searchRegex }]
    }).limit(5).lean();

    const tasks = await Task.find({
      $or: [{ title: searchRegex }, { description: searchRegex }]
    }).populate('project_id', 'name').limit(10).lean();

    const bugs = await Bug.find({
      $or: [{ title: searchRegex }, { description: searchRegex }]
    }).populate('task_id', 'project_id').limit(10).lean();

    res.json({ 
      projects: projects.map(p => ({ id: p._id, name: p.name, description: p.description, type: 'PROJECT' })), 
      tasks: tasks.map(t => ({ id: t._id, title: t.title, description: t.description, status: t.status, project_id: t.project_id?._id, project_name: t.project_id?.name, type: 'TASK' })), 
      bugs: bugs.map(b => ({ id: b._id, title: b.title, description: b.description, status: b.status, task_id: b.task_id?._id, project_id: b.task_id?.project_id, type: 'BUG' }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
