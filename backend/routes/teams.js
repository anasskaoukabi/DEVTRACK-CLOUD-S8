const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { authenticateToken } = require('./auth');

// GET /api/teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members.developer_id', 'name color role email')
      .populate('project_ids', 'name status')
      .populate('created_by', 'name')
      .sort('-created_at')
      .lean();
    res.json(teams.map(t => ({ ...t, id: t._id })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/teams/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.developer_id', 'name color role email')
      .populate('project_ids', 'name status')
      .populate('created_by', 'name')
      .lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ ...team, id: team._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/teams
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, avatar, members, project_ids } = req.body;
    const team = await Team.create({
      name, description, color: color || '#6366f1', avatar: avatar || '👥',
      members: members || [], project_ids: project_ids || [],
      created_by: req.user.id,
    });
    const populated = await Team.findById(team._id)
      .populate('members.developer_id', 'name color role email')
      .populate('project_ids', 'name status').lean();
    res.status(201).json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/teams/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, avatar, project_ids } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, color, avatar, project_ids },
      { new: true }
    ).populate('members.developer_id', 'name color role email')
     .populate('project_ids', 'name status').lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ ...team, id: team._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/teams/:id/members — ajouter un membre
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { developer_id, role_in_team = 'MEMBER' } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const exists = team.members.some(m => String(m.developer_id) === String(developer_id));
    if (exists) return res.status(400).json({ error: 'Member already in team' });
    team.members.push({ developer_id, role_in_team });
    await team.save();
    const populated = await Team.findById(team._id)
      .populate('members.developer_id', 'name color role email')
      .populate('project_ids', 'name status').lean();
    res.json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/teams/:id/members/:devId
router.delete('/:id/members/:devId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    team.members = team.members.filter(m => String(m.developer_id) !== req.params.devId);
    await team.save();
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/teams/:id/members/:devId/role
router.patch('/:id/members/:devId/role', authenticateToken, async (req, res) => {
  try {
    const { role_in_team } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const member = team.members.find(m => String(m.developer_id) === req.params.devId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.role_in_team = role_in_team;
    await team.save();
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/teams/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
