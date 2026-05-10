const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Developer = require('../models/Developer');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { createNotification } = require('./notifications');

router.get('/', authenticateToken, async (req, res) => {
  const { task_id } = req.query;
  try {
    const filter = task_id ? { task_id } : {};
    const comments = await Comment.find(filter).sort('-created_at').lean();
    res.json(comments.map(c => ({ ...c, id: c._id })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { task_id, author, content, is_technical_note } = req.body;
  if (!task_id || !author || !content) {
    return res.status(400).json({ error: 'task_id, author and content required' });
  }

  try {
    // Parse @mentions — find names after @ (word chars + spaces up to next @ or end)
    const mentionPattern = /@([\w\s]+?)(?=\s*@|\s*$|[^a-zA-Z0-9\s])/g;
    const mentioned = [];
    let m;
    while ((m = mentionPattern.exec(content)) !== null) {
      mentioned.push(m[1].trim());
    }

    const comment = await Comment.create({ task_id, author, content, is_technical_note });
    const obj = comment.toObject();
    obj.id = obj._id;

    // Send MENTION notifications
    if (mentioned.length > 0) {
      const task = await Task.findById(task_id).lean();
      const devs = await Developer.find({ name: { $in: mentioned } }).lean();
      for (const dev of devs) {
        await createNotification(
          dev._id, 'MENTION',
          `${author} vous a mentionné dans un commentaire${task ? ` sur "${task.title}"` : ''}`,
          'task', task_id
        );
      }
    }

    res.status(201).json(obj);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
