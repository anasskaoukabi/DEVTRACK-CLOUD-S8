const express = require('express');
const router = express.Router();
const Developer = require('../models/Developer');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');
const bcrypt = require('bcryptjs');

// GET all developers — tous les rôles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const developers = await Developer.find().sort('name').select('-password').lean();
    res.json(developers.map(d => ({...d, id: d._id})));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single developer — tous les rôles
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const dev = await Developer.findById(req.params.id).select('-password').lean();
    if (!dev) return res.status(404).json({ error: 'Developer not found' });
    dev.id = dev._id;
    res.json(dev);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET workload — tous les rôles
router.get('/:id/workload', authenticateToken, async (req, res) => {
  try {
    const dev = await Developer.findById(req.params.id).select('-password').lean();
    if (!dev) return res.status(404).json({ error: 'Developer not found' });
    dev.id = dev._id;

    const tasks = await Task.find({
      developer_id: dev._id,
      status: { $nin: ['DONE', 'BACKLOG'] }
    }).populate('project_id', 'name').sort('-priority created_at').lean();

    const mappedTasks = tasks.map(t => ({
      ...t,
      id: t._id,
      project_name: t.project_id?.name,
      project_id: t.project_id?._id
    }));

    const inProgress = mappedTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const inReview = mappedTasks.filter(t => t.status === 'IN_REVIEW').length;

    res.json({ developer: dev, tasks: mappedTasks, inProgress, inReview, totalActive: mappedTasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create developer — ADMIN seulement
router.post('/', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  const { name, email, color, password, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });

  try {
    const defaultPassword = bcrypt.hashSync(password || 'password123', 10);
    const dev = await Developer.create({
      name,
      email,
      password: defaultPassword,
      color: color || '#6366f1',
      role: role || 'DEV'
    });
    const obj = dev.toObject();
    delete obj.password;
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update developer — ADMIN seulement
router.put('/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  const { name, email, color, role } = req.body;
  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (color) updateData.color = color;
    if (role) updateData.role = role;

    const dev = await Developer.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password').lean();
    if (!dev) return res.status(404).json({ error: 'Developer not found' });
    dev.id = dev._id;
    res.json(dev);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT reset password — ADMIN seulement
router.put('/:id/password', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const dev = await Developer.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true })
      .select('-password').lean();
    if (!dev) return res.status(404).json({ error: 'Developer not found' });
    dev.id = dev._id;
    res.json({ message: 'Mot de passe mis à jour', developer: dev });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE developer — ADMIN seulement (ne peut pas se supprimer soi-même)
router.delete('/:id', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  if (req.params.id === String(req.user.id || req.user._id))
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  try {
    const dev = await Developer.findByIdAndDelete(req.params.id);
    if (!dev) return res.status(404).json({ error: 'Developer not found' });
    await Task.updateMany({ developer_id: req.params.id }, { developer_id: null });
    res.json({ message: 'Developer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
