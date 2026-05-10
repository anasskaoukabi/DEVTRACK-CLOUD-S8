const express = require('express');
const router = express.Router();
const { stringify } = require('csv-stringify');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Bug = require('../models/Bug');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

const sendCSV = (res, filename, columns, data) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  stringify(data, { header: true, columns }, (err, output) => {
    if (err) return res.status(500).json({ error: 'CSV error' });
    res.send('﻿' + output); // BOM for Excel UTF-8
  });
};

// Export tasks
router.get('/tasks', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id, sprint_id } = req.query;
  try {
    const filter = {};
    if (project_id) filter.project_id = project_id;
    if (sprint_id) filter.sprint_id = sprint_id;
    const tasks = await Task.find(filter)
      .populate('developer_id', 'name')
      .populate('sprint_id', 'name')
      .lean();
    const rows = tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      story_points: t.story_points ?? '',
      estimated_hours: t.estimated_hours ?? '',
      developer: t.developer_id?.name ?? '',
      sprint: t.sprint_id?.name ?? '',
      deadline: t.deadline ? new Date(t.deadline).toLocaleDateString('fr-FR') : '',
      created_at: new Date(t.created_at).toLocaleDateString('fr-FR'),
    }));
    sendCSV(res, 'tasks.csv', Object.keys(rows[0] || {}), rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Export time logs
router.get('/time-logs', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id } = req.query;
  try {
    let logs;
    if (project_id) {
      const tasks = await Task.find({ project_id }).select('_id title').lean();
      const taskIds = tasks.map(t => t._id);
      const taskMap = Object.fromEntries(tasks.map(t => [t._id.toString(), t.title]));
      logs = await TimeLog.find({ task_id: { $in: taskIds } })
        .populate('developer_id', 'name').lean();
      logs = logs.map(l => ({ ...l, task_title: taskMap[l.task_id?.toString()] }));
    } else {
      logs = await TimeLog.find()
        .populate('developer_id', 'name')
        .populate('task_id', 'title').lean();
      logs = logs.map(l => ({ ...l, task_title: l.task_id?.title }));
    }
    const rows = logs.map(l => ({
      developer: l.developer_id?.name ?? '',
      task: l.task_title ?? '',
      hours: l.hours,
      description: l.description ?? '',
      logged_at: new Date(l.logged_at).toLocaleDateString('fr-FR'),
    }));
    sendCSV(res, 'time-logs.csv', Object.keys(rows[0] || {}), rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Export bugs
router.get('/bugs', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER', 'QA']), async (req, res) => {
  const { project_id } = req.query;
  try {
    let bugs;
    if (project_id) {
      const tasks = await Task.find({ project_id }).select('_id title').lean();
      const taskIds = tasks.map(t => t._id);
      const taskMap = Object.fromEntries(tasks.map(t => [t._id.toString(), t.title]));
      bugs = await Bug.find({ task_id: { $in: taskIds } }).lean();
      bugs = bugs.map(b => ({ ...b, task_title: taskMap[b.task_id?.toString()] }));
    } else {
      bugs = await Bug.find().populate('task_id', 'title').lean();
      bugs = bugs.map(b => ({ ...b, task_title: b.task_id?.title }));
    }
    const rows = bugs.map(b => ({
      title: b.title,
      severity: b.severity,
      status: b.status,
      task: b.task_title ?? '',
      description: b.description ?? '',
      created_at: new Date(b.created_at).toLocaleDateString('fr-FR'),
      fixed_at: b.fixed_at ? new Date(b.fixed_at).toLocaleDateString('fr-FR') : '',
    }));
    sendCSV(res, 'bugs.csv', Object.keys(rows[0] || {}), rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
