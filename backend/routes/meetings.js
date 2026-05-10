const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { authenticateToken } = require('./auth');

const populate = (q) => q
  .populate('organizer_id', 'name color')
  .populate('attendees', 'name color role')
  .populate('team_id', 'name color avatar')
  .populate('project_id', 'name')
  .populate('action_items.assignee_id', 'name color')
  .populate('document_ids', 'title type updated_at');

// GET /api/meetings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { team_id, project_id, status, from, to } = req.query;
    const filter = {};
    if (team_id) filter.team_id = team_id;
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const meetings = await populate(Meeting.find(filter).sort('date')).lean();
    res.json(meetings.map(m => ({ ...m, id: m._id })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/meetings/upcoming — les 10 prochaines
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const meetings = await populate(
      Meeting.find({ date: { $gte: new Date() }, status: { $ne: 'CANCELLED' } })
        .sort('date').limit(10)
    ).lean();
    res.json(meetings.map(m => ({ ...m, id: m._id })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/meetings/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await populate(Meeting.findById(req.params.id)).lean();
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ ...meeting, id: meeting._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/meetings
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, type, team_id, project_id, attendees, date, duration_min, location, agenda, document_ids } = req.body;
    const meeting = await Meeting.create({
      title, type, team_id, project_id,
      organizer_id: req.user.id,
      attendees: attendees || [],
      date, duration_min: duration_min || 30,
      location: location || '',
      agenda: agenda || [],
      document_ids: document_ids || [],
    });
    const populated = await populate(Meeting.findById(meeting._id)).lean();
    res.status(201).json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/meetings/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const meeting = await populate(
      Meeting.findByIdAndUpdate(req.params.id, updates, { new: true })
    ).lean();
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ ...meeting, id: meeting._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/meetings/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ ...meeting, id: meeting._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/meetings/:id/action-items/:itemId/toggle
router.patch('/:id/action-items/:itemId/toggle', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const item = meeting.action_items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Action item not found' });
    item.done = !item.done;
    await meeting.save();
    res.json({ done: item.done });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/meetings/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
