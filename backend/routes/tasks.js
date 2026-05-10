const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const StatusHistory = require('../models/StatusHistory');
const TimeLog = require('../models/TimeLog');
const Tag = require('../models/Tag');
const Attachment = require('../models/Attachment');
const { authenticateToken } = require('./auth');
const { authorize, authorizeMin } = require('../middleware/authorize');
const { createNotification } = require('./notifications');

const STATUS_ORDER = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE'];

// Parse @mentions in comment content and return developer ids
const parseMentions = async (content, developers) => {
  const mentioned = [];
  const matches = content.match(/@(\w+)/g) || [];
  for (const m of matches) {
    const name = m.slice(1).toLowerCase();
    const dev = developers.find(d => d.name.toLowerCase().replace(/\s+/g, '') === name || d.name.split(' ')[0].toLowerCase() === name);
    if (dev) mentioned.push(dev._id);
  }
  return mentioned;
};

// GET all tasks
router.get('/', authenticateToken, async (req, res) => {
  const { project_id, sprint_id, developer_id, status, priority, type, tag_id, page, limit } = req.query;
  const filter = {};
  if (project_id)   filter.project_id = project_id;
  if (sprint_id)    filter.sprint_id = sprint_id;
  if (developer_id) filter.developer_id = developer_id;
  if (status)       filter.status = status.includes(',') ? { $in: status.split(',') } : status;
  if (priority)     filter.priority = priority;
  if (type)         filter.type = type;
  if (tag_id)       filter.tag_ids = tag_id;

  try {
    let query = Task.find(filter).populate('developer_id', 'name color').populate('tag_ids', 'name color').sort('-created_at');

    const total = await Task.countDocuments(filter);
    if (page && limit) query = query.skip((page - 1) * limit).limit(Number(limit));

    const tasks = await query.lean();
    const taskIds = tasks.map(t => t._id);
    const bugs = await Bug.find({ task_id: { $in: taskIds } }).lean();

    const result = tasks.map(t => {
      const taskBugs = bugs.filter(b => b.task_id.toString() === t._id.toString());
      const hasCriticalBug = taskBugs.some(b => b.severity === 'CRITICAL' && !['FIXED','CLOSED'].includes(b.status));
      const subtasksDone = (t.subtasks || []).filter(s => s.done).length;
      return {
        ...t, id: t._id,
        developer_name: t.developer_id?.name,
        developer_color: t.developer_id?.color,
        developer_id: t.developer_id?._id,
        tags: t.tag_ids || [],
        bugs: taskBugs, hasCriticalBug, bugCount: taskBugs.length,
        subtasksTotal: t.subtasks?.length || 0,
        subtasksDone,
      };
    });

    res.json(page && limit ? { data: result, total, page: Number(page), pages: Math.ceil(total / limit) } : result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('developer_id', 'name color')
      .populate('tag_ids', 'name color')
      .populate('blocked_by', 'title status')
      .lean();
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const bugs = await Bug.find({ task_id: task._id }).sort('-created_at').lean();
    const comments = await Comment.find({ task_id: task._id })
      .populate('mentioned_ids', 'name color').sort('-created_at').lean();
    const history = await StatusHistory.find({ task_id: task._id }).sort('changed_at').lean();
    const attachments = await Attachment.find({ task_id: task._id })
      .populate('uploaded_by', 'name').sort('-created_at').lean();

    res.json({
      ...task, id: task._id,
      developer_name: task.developer_id?.name,
      developer_color: task.developer_id?.color,
      developer_id: task.developer_id?._id,
      tags: task.tag_ids || [],
      blocking: task.blocked_by || [],
      bugs: bugs.map(b => ({ ...b, id: b._id })),
      comments: comments.map(c => ({ ...c, id: c._id })),
      history: history.map(h => ({ ...h, id: h._id })),
      attachments: attachments.map(a => ({ ...a, id: a._id })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create task
router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER', 'DEV']), async (req, res) => {
  const {
    project_id, sprint_id, milestone_id, title, description, type = 'FEATURE',
    priority = 'MEDIUM', status = 'BACKLOG', story_points, estimated_hours,
    deadline, developer_id, tag_ids, blocked_by,
  } = req.body;

  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title required' });

  try {
    const task = await Task.create({
      project_id, sprint_id: sprint_id || undefined, milestone_id: milestone_id || undefined,
      title, description, type, priority, status, story_points, estimated_hours,
      deadline, developer_id: developer_id || undefined,
      tag_ids: tag_ids || [], blocked_by: blocked_by || [],
    });

    await StatusHistory.create({ task_id: task._id, to_status: status });

    // Notify assigned developer
    if (developer_id && developer_id !== req.user.id) {
      await createNotification(developer_id, 'TASK_ASSIGNED', `Tâche assignée : "${title}"`, 'task', task._id);
    }

    const populated = await Task.findById(task._id)
      .populate('developer_id', 'name color').populate('tag_ids', 'name color').lean();
    populated.id = populated._id;
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update task
router.put('/:id', authenticateToken, authorizeMin('QA'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'CLIENT') return res.status(403).json({ error: 'Accès refusé' });

    const {
      title, description, type, priority, status, story_points, estimated_hours,
      deadline, developer_id, sprint_id, milestone_id, tag_ids, blocked_by,
    } = req.body;
    const newStatus = status ?? task.status;

    if (task.status === 'DONE' && status && status !== 'DONE')
      return res.status(400).json({ error: 'RG-01: A DONE task cannot be re-opened. Create a new task instead.' });
    if (task.status === 'BACKLOG' && newStatus === 'DONE')
      return res.status(400).json({ error: 'RG-06: Task cannot move from BACKLOG to DONE directly.' });

    if (newStatus === 'DONE' && task.status !== 'DONE') {
      const critBug = await Bug.findOne({ task_id: task._id, severity: 'CRITICAL', status: { $nin: ['FIXED','CLOSED'] } });
      if (critBug) return res.status(400).json({ error: 'RG-03: Task has an open CRITICAL bug. Resolve it before marking DONE.' });
    }

    // Check blocking dependencies before IN_PROGRESS
    if (newStatus === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') {
      if (task.blocked_by?.length > 0) {
        const blockers = await Task.find({ _id: { $in: task.blocked_by }, status: { $ne: 'DONE' } }).lean();
        if (blockers.length > 0) {
          return res.status(400).json({ error: `RG-07: Cette tâche est bloquée par: ${blockers.map(b => b.title).join(', ')}` });
        }
      }
      const devId = developer_id ?? task.developer_id;
      if (devId) {
        const inProgress = await Task.countDocuments({ developer_id: devId, status: 'IN_PROGRESS', _id: { $ne: task._id } });
        if (inProgress >= 5) return res.status(400).json({ error: 'RG-04: Developer already has 5 tasks IN_PROGRESS.' });
      }
    }

    const prevDev = task.developer_id?.toString();
    const statusChanged = newStatus !== task.status;
    if (statusChanged) {
      await StatusHistory.create({ task_id: task._id, from_status: task.status, to_status: newStatus });
    }

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.type = type ?? task.type;
    task.priority = priority ?? task.priority;
    task.status = newStatus;
    task.story_points = story_points ?? task.story_points;
    task.estimated_hours = estimated_hours ?? task.estimated_hours;
    task.deadline = deadline ?? task.deadline;
    if (developer_id !== undefined) task.developer_id = developer_id || null;
    if (sprint_id !== undefined) task.sprint_id = sprint_id || null;
    if (milestone_id !== undefined) task.milestone_id = milestone_id || null;
    if (tag_ids !== undefined) task.tag_ids = tag_ids;
    if (blocked_by !== undefined) task.blocked_by = blocked_by;

    await task.save();

    // Notify new assignee
    if (developer_id && developer_id !== prevDev && developer_id !== req.user.id) {
      await createNotification(developer_id, 'TASK_ASSIGNED', `Tâche assignée : "${task.title}"`, 'task', task._id);
    }

    // Notify assignee of status change (excluding the person who made the change)
    const assigneeId = task.developer_id?.toString();
    if (statusChanged && assigneeId && assigneeId !== req.user.id) {
      await createNotification(assigneeId, 'TASK_STATUS',
        `Statut de "${task.title}" changé en ${newStatus}`, 'task', task._id);
    }

    const updated = await Task.findById(task._id)
      .populate('developer_id', 'name color').populate('tag_ids', 'name color').lean();
    updated.id = updated._id;
    updated.developer_name = updated.developer_id?.name;
    updated.developer_color = updated.developer_id?.color;
    updated.developer_id = updated.developer_id?._id;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE task
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    await Bug.deleteMany({ task_id: req.params.id });
    await Comment.deleteMany({ task_id: req.params.id });
    await StatusHistory.deleteMany({ task_id: req.params.id });
    await TimeLog.deleteMany({ task_id: req.params.id });
    await Attachment.deleteMany({ task_id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Subtasks ---
router.post('/:id/subtasks', authenticateToken, authorizeMin('DEV'), async (req, res) => {
  const { title, assignee_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const order = task.subtasks.length;
    task.subtasks.push({ title, done: false, assignee_id: assignee_id || undefined, order });
    await task.save();
    res.status(201).json(task.subtasks[task.subtasks.length - 1]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/subtasks/:subId', authenticateToken, authorizeMin('DEV'), async (req, res) => {
  const { title, done, assignee_id } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const sub = task.subtasks.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: 'Subtask not found' });
    if (title !== undefined) sub.title = title;
    if (done !== undefined) sub.done = done;
    if (assignee_id !== undefined) sub.assignee_id = assignee_id || undefined;
    await task.save();
    res.json(sub);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id/subtasks/:subId', authenticateToken, authorizeMin('DEV'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.subtasks.pull({ _id: req.params.subId });
    await task.save();
    res.json({ message: 'Subtask deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
