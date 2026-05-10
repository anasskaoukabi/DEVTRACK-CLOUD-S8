const mongoose = require('mongoose');

// Seuils configurables par projet (thresholds)
const MetricsThresholdSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  // Format: { warn: Number, error: Number } — warn=orange, error=rouge
  // Plus bas = meilleur pour ces métriques
  cyclomatic_complexity: { warn: { type: Number, default: 10 },  error: { type: Number, default: 20 } },
  cognitive_complexity:  { warn: { type: Number, default: 15 },  error: { type: Number, default: 25 } },
  max_nesting_depth:     { warn: { type: Number, default: 4 },   error: { type: Number, default: 6 } },
  wmc:                   { warn: { type: Number, default: 20 },  error: { type: Number, default: 40 } },
  dit:                   { warn: { type: Number, default: 3 },   error: { type: Number, default: 5 } },
  cbo:                   { warn: { type: Number, default: 10 },  error: { type: Number, default: 20 } },
  lcom:                  { warn: { type: Number, default: 0.5 }, error: { type: Number, default: 0.8 } },
  avg_method_length:     { warn: { type: Number, default: 30 },  error: { type: Number, default: 60 } },
  duplication_pct:       { warn: { type: Number, default: 5 },   error: { type: Number, default: 15 } },
  // Plus haut = meilleur pour ces métriques
  comment_ratio:         { warn: { type: Number, default: 10 },  error: { type: Number, default: 5 } },
  maintainability_index: { warn: { type: Number, default: 50 },  error: { type: Number, default: 25 } },
  test_coverage_pct:     { warn: { type: Number, default: 60 },  error: { type: Number, default: 40 } },
}, { timestamps: true });

module.exports = mongoose.model('MetricsThreshold', MetricsThresholdSchema);
