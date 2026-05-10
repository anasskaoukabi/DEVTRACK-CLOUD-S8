const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Attachment = require('../models/Attachment');
const { authenticateToken } = require('./auth');
const { authorizeMin } = require('../middleware/authorize');

const uploadDir = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|zip|docx|xlsx|txt|md/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    ext ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const attachments = await Attachment.find({ task_id: req.params.taskId })
      .populate('uploaded_by', 'name color')
      .sort('-created_at').lean();
    res.json(attachments.map(a => ({ ...a, id: a._id })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/task/:taskId', authenticateToken, authorizeMin('QA'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const att = await Attachment.create({
      task_id:      req.params.taskId,
      filename:     req.file.filename,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      path:         req.file.path,
      uploaded_by:  req.user.id,
    });
    const obj = att.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const att = await Attachment.findById(req.params.id);
    if (!att) return res.status(404).json({ error: 'Attachment not found' });
    if (fs.existsSync(att.path)) fs.unlinkSync(att.path);
    await att.deleteOne();
    res.json({ message: 'Attachment deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
