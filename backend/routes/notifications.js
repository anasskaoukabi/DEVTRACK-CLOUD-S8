const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('./auth');

// GET unread count — lightweight, for sidebar polling
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient_id: req.user.id, read: false });
    res.json({ count });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET notifications for current user — returns flat array
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user.id })
      .sort('-created_at').limit(50).lean();
    res.json(notifications.map(n => ({ ...n, id: n._id })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH mark all as read — must be before /:id/read to avoid route conflict
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient_id: req.user.id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH mark one as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user.id },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE one notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient_id: req.user.id });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

/**
 * Creates a notification. Silently ignores errors so callers don't fail.
 * @param {string|ObjectId} recipient_id
 * @param {'TASK_ASSIGNED'|'TASK_STATUS'|'BUG_CRITICAL'|'SPRINT_STARTED'|'SPRINT_ENDED'|'MENTION'} type
 * @param {string} message
 * @param {string} entity_type  'task' | 'bug' | 'sprint' | 'milestone'
 * @param {string|ObjectId} entity_id
 */
const createNotification = async (recipient_id, type, message, entity_type, entity_id) => {
  try {
    if (!recipient_id) return;
    await Notification.create({ recipient_id, type, message, entity_type, entity_id });
  } catch (e) {
    console.error('Notification creation failed:', e.message);
  }
};

module.exports = { router, createNotification };
