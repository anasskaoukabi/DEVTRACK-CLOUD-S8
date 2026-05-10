const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');
const { generateDocument } = require('../documents/generator');

// Permissions par type de document
const PERMISSIONS = {
  'cahier-des-charges':  ['PO', 'ADMIN'],
  'fiche-fonctionnelle': ['PO', 'ADMIN'],
  'fiche-technique':     ['DEV', 'PO', 'ADMIN'],
  'pv-sprint':           ['PO', 'ADMIN'],
  'rapport-bugs':        ['PO', 'ADMIN'],
  'rapport-temps':       ['ADMIN'],
  'release-notes':       ['PO', 'ADMIN'],
};

// Route générique — GET /api/documents/:type/:id
router.get('/:type/:id', authenticateToken, async (req, res) => {
  const { type, id } = req.params;
  const allowedRoles = PERMISSIONS[type];

  if (!allowedRoles) {
    return res.status(400).json({ error: `Unknown document type: ${type}` });
  }

  // Vérification du rôle
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
    });
  }

  try {
    const { stream, filename } = await generateDocument(type, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache');

    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'PDF generation failed' });
      }
    });
  } catch (err) {
    console.error('Document generation error:', err);
    res.status(500).json({ error: err.message || 'Document generation failed' });
  }
});

module.exports = router;
