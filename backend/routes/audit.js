const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('./auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  const { entity_type, entity_id, user_id, page = 1, limit = 50 } = req.query;
  try {
    const filter = {};
    if (entity_type) filter.entity_type = entity_type;
    if (entity_id) filter.entity_id = entity_id;
    if (user_id) filter.user_id = user_id;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('user_id', 'name email')
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ logs: logs.map(l => ({ ...l, id: l._id })), total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Helper middleware to log actions
const auditLog = (action, entityType, getEntityId, getEntityName) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode < 400) {
      try {
        const entityId = getEntityId(req, data);
        const entityName = getEntityName ? getEntityName(req, data) : undefined;
        AuditLog.create({
          user_id:     req.user?.id,
          user_name:   req.user?.name,
          action,
          entity_type: entityType,
          entity_id:   entityId,
          entity_name: entityName,
          ip:          req.ip,
        }).catch(() => {});
      } catch {}
    }
    return originalJson(data);
  };
  next();
};

module.exports = { router, auditLog };
