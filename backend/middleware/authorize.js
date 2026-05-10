/**
 * authorize(roles) — middleware RBAC strict
 * Vérifie que req.user.role est dans la liste 'roles'
 * Usage: router.post('/', authenticateToken, authorize(['ADMIN', 'PO']), handler)
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

/**
 * Hiérarchie des rôles (du plus faible au plus fort)
 */
const ROLE_HIERARCHY = ['CLIENT', 'QA', 'DEV', 'SCRUM_MASTER', 'PO', 'ADMIN'];

/**
 * authorizeMin(minRole) — middleware RBAC hiérarchique
 * Vérifie que req.user.role est au moins aussi élevé que 'minRole'
 * Usage: router.put('/:id', authenticateToken, authorizeMin('QA'), handler)
 */
const authorizeMin = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const minIndex = ROLE_HIERARCHY.indexOf(minRole);
    const userIndex = ROLE_HIERARCHY.indexOf(req.user.role);

    if (minIndex === -1) {
      return res.status(500).json({ error: `Unknown minimum role: ${minRole}` });
    }

    if (userIndex < minIndex) {
      return res.status(403).json({
        error: `Access denied. Minimum role required: ${minRole}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

module.exports = { authorize, authorizeMin, ROLE_HIERARCHY };
