const express = require('express');
const router = express.Router();
const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');

// Get all time logs for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const logs = await TimeLog.find({ task_id: req.params.taskId })
      .populate('developer_id', 'name color')
      .sort('-logged_at')
      .lean();
    
    const mappedLogs = logs.map(l => ({
      ...l,
      id: l._id,
      developer_name: l.developer_id?.name,
      developer_color: l.developer_id?.color
    }));
    
    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new time log
router.post('/', authenticateToken, async (req, res) => {
  const { task_id, hours, description } = req.body;
  const developer_id = req.user.id;

  if (!task_id || !hours) {
    return res.status(400).json({ error: 'task_id and hours are required' });
  }

  try {
    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const timeLog = await TimeLog.create({
      task_id,
      developer_id,
      hours: Number(hours),
      description: description || ''
    });

    const populated = await TimeLog.findById(timeLog._id).populate('developer_id', 'name color').lean();
    populated.id = populated._id;
    populated.developer_name = populated.developer_id?.name;
    populated.developer_color = populated.developer_id?.color;

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
