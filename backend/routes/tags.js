const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    const filter = project_id ? { project_id } : {};
    const tags = await Tag.find(filter).sort('name').lean();
    res.json(tags.map(t => ({ ...t, id: t._id })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { name, color, project_id } = req.body;
  if (!name || !project_id) return res.status(400).json({ error: 'name and project_id required' });
  try {
    const tag = await Tag.create({ name, color: color || '#6366f1', project_id });
    const obj = tag.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { name, color } = req.body;
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, { name, color }, { new: true }).lean();
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json({ ...tag, id: tag._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tag deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
