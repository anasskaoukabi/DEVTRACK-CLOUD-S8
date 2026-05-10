const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    const filter = project_id ? { project_id } : {};
    const risks = await Risk.find(filter)
      .populate('owner_id', 'name color').sort('-created_at').lean();
    res.json(risks.map(r => ({ ...r, id: r._id, owner_name: r.owner_id?.name, owner_color: r.owner_id?.color })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { project_id, title, description, probability, impact, owner_id, mitigation } = req.body;
  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title required' });
  try {
    const risk = await Risk.create({ project_id, title, description, probability, impact, owner_id, mitigation });
    const obj = risk.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateToken, authorize(['ADMIN', 'PO', 'SCRUM_MASTER']), async (req, res) => {
  const { title, description, probability, impact, owner_id, mitigation, status } = req.body;
  try {
    const upd = {};
    if (title !== undefined) upd.title = title;
    if (description !== undefined) upd.description = description;
    if (probability !== undefined) upd.probability = probability;
    if (impact !== undefined) upd.impact = impact;
    if (owner_id !== undefined) upd.owner_id = owner_id;
    if (mitigation !== undefined) upd.mitigation = mitigation;
    if (status !== undefined) upd.status = status;
    const risk = await Risk.findByIdAndUpdate(req.params.id, upd, { new: true })
      .populate('owner_id', 'name color').lean();
    if (!risk) return res.status(404).json({ error: 'Risk not found' });
    res.json({ ...risk, id: risk._id });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateToken, authorize(['ADMIN', 'PO']), async (req, res) => {
  try {
    await Risk.findByIdAndDelete(req.params.id);
    res.json({ message: 'Risk deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
