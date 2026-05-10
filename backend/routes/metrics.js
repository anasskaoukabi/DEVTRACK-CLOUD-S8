const express = require('express');
const router = express.Router();
const CodeMetrics = require('../models/CodeMetrics');
const MetricsThreshold = require('../models/MetricsThreshold');
const { authenticateToken } = require('./auth');

// ── GET /api/metrics?project_id=...
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    if (req.query.sprint_id)  filter.sprint_id  = req.query.sprint_id;
    if (req.query.source)     filter.source     = req.query.source;
    const metrics = await CodeMetrics.find(filter)
      .populate('analyzed_by', 'name color')
      .sort('-created_at').lean();
    res.json(metrics.map(m => ({ ...m, id: m._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/metrics/dashboard/:projectId
router.get('/dashboard/:projectId', authenticateToken, async (req, res) => {
  try {
    const filter = { project_id: req.params.projectId };
    if (req.query.sprint_id) filter.sprint_id = req.query.sprint_id;

    const [metrics, threshold] = await Promise.all([
      CodeMetrics.find(filter).lean(),
      MetricsThreshold.findOne({ project_id: req.params.projectId }).lean(),
    ]);

    if (!metrics.length) return res.json({ metrics: [], summary: null, threshold });

    const avg = (field) => {
      const vals = metrics.map(m => m[field]).filter(v => v !== null && v !== undefined);
      return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
    };
    const max = (field) => {
      const vals = metrics.map(m => m[field]).filter(v => v !== null && v !== undefined);
      return vals.length ? Math.max(...vals) : null;
    };

    const summary = {
      modules_analyzed: metrics.length,
      total_loc:  metrics.reduce((s, m) => s + (m.loc || 0), 0),
      total_sloc: metrics.reduce((s, m) => s + (m.sloc || 0), 0),
      avg_cyclomatic_complexity: avg('cyclomatic_complexity'),
      max_cyclomatic_complexity: max('cyclomatic_complexity'),
      avg_cognitive_complexity:  avg('cognitive_complexity'),
      avg_maintainability_index: avg('maintainability_index'),
      avg_comment_ratio:         avg('comment_ratio'),
      avg_duplication_pct:       avg('duplication_pct'),
      avg_test_coverage:         avg('test_coverage_pct'),
      avg_wmc:  avg('wmc'),  avg_dit:  avg('dit'),
      avg_cbo:  avg('cbo'),  avg_rfc:  avg('rfc'),
      avg_lcom: avg('lcom'),
      avg_method_length: avg('avg_method_length'),
      hotspots: [...metrics]
        .sort((a, b) => (b.cyclomatic_complexity || 0) - (a.cyclomatic_complexity || 0))
        .slice(0, 5)
        .map(m => ({ id: m._id, module_name: m.module_name, cyclomatic_complexity: m.cyclomatic_complexity, maintainability_index: m.maintainability_index })),
    };

    res.json({ metrics, summary, threshold });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/metrics/manual — saisie manuelle
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    if (!req.body.project_id) return res.status(400).json({ error: 'project_id requis' });
    const saved = await CodeMetrics.create({ ...req.body, source: 'MANUAL', analyzed_by: req.user.id });
    res.status(201).json({ ...saved.toObject(), id: saved._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/metrics/import-sonar — import rapport SonarQube JSON
router.post('/import-sonar', authenticateToken, async (req, res) => {
  try {
    const { project_id, sprint_id, report } = req.body;
    if (!project_id || !report) return res.status(400).json({ error: 'project_id et report requis' });
    const components = report.components || [];
    const saved = [];
    for (const comp of components) {
      const m = {};
      (comp.measures || []).forEach(x => { m[x.metric] = parseFloat(x.value); });
      const created = await CodeMetrics.create({
        project_id, sprint_id: sprint_id || null,
        module_name: comp.name || comp.key || 'Unknown',
        file_path: comp.path || comp.key || '',
        source: 'SONARQUBE', analyzed_by: req.user.id,
        cyclomatic_complexity: m['complexity'] ?? null,
        cognitive_complexity:  m['cognitive_complexity'] ?? null,
        loc:    m['ncloc'] ?? null,
        comment_ratio:      m['comment_lines_density'] ?? null,
        duplication_pct:    m['duplicated_lines_density'] ?? null,
        test_coverage_pct:  m['coverage'] ?? null,
        branch_coverage_pct:m['branch_coverage'] ?? null,
      });
      saved.push(created);
    }
    res.json({ imported: saved.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/metrics/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const m = await CodeMetrics.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ ...m, id: m._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/metrics/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await CodeMetrics.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET/POST /api/metrics/thresholds/:projectId
router.get('/thresholds/:projectId', authenticateToken, async (req, res) => {
  try {
    const t = await MetricsThreshold.findOne({ project_id: req.params.projectId }).lean();
    res.json(t || { project_id: req.params.projectId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/thresholds/:projectId', authenticateToken, async (req, res) => {
  try {
    const t = await MetricsThreshold.findOneAndUpdate(
      { project_id: req.params.projectId },
      { ...req.body, project_id: req.params.projectId },
      { upsert: true, new: true }
    ).lean();
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
