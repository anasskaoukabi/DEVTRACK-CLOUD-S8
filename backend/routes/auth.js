const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Developer = require('../models/Developer');

const JWT_SECRET = process.env.JWT_SECRET || 'devtrack-super-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const dev = await Developer.findOne({ email });
    if (!dev) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, dev.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: dev._id, email: dev.email, role: dev.role, name: dev.name, color: dev.color },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const devObj = dev.toObject();
    delete devObj.password;

    res.json({ token, user: devObj });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const dev = await Developer.findById(req.user.id).select('-password');
    if (!dev) return res.status(404).json({ error: 'User not found' });
    res.json(dev);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, authenticateToken, JWT_SECRET };
