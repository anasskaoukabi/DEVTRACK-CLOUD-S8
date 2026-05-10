const mongoose = require('mongoose');

// Métriques par fichier/classe/fonction
const CodeMetricsSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprint_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  task_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  analyzed_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  source:     { type: String, enum: ['MANUAL', 'AUTO', 'SONARQUBE', 'IMPORT'], default: 'MANUAL' },
  language:   { type: String, default: 'JavaScript' },
  // Identification
  module_name: { type: String, required: true }, // Nom du fichier ou module
  file_path:   { type: String, default: '' },

  // ── Métriques Générales ──────────────────────────────────
  loc:          { type: Number, default: null }, // Lines of Code
  lloc:         { type: Number, default: null }, // Logical Lines of Code
  sloc:         { type: Number, default: null }, // Source Lines of Code (sans blancs/commentaires)
  comments:     { type: Number, default: null }, // Lignes de commentaires
  comment_ratio:{ type: Number, default: null }, // % commentaires / LOC
  blank_lines:  { type: Number, default: null },
  duplication_pct: { type: Number, default: null }, // % duplication

  // ── Complexité ──────────────────────────────────────────
  cyclomatic_complexity: { type: Number, default: null }, // V(G) - McCabe
  cognitive_complexity:  { type: Number, default: null }, // Complexité cognitive SonarQube
  max_nesting_depth:     { type: Number, default: null }, // Profondeur d'imbrication max
  avg_complexity_per_fn: { type: Number, default: null }, // Complexité moyenne par fonction
  halstead_volume:       { type: Number, default: null }, // Volume de Halstead
  halstead_difficulty:   { type: Number, default: null },
  halstead_effort:       { type: Number, default: null },
  maintainability_index: { type: Number, default: null }, // 0-100

  // ── Métriques OOP (Suite CK — Chidamber & Kemerer) ──────
  wmc:  { type: Number, default: null }, // Weighted Methods per Class (∑ complexité méthodes)
  dit:  { type: Number, default: null }, // Depth of Inheritance Tree
  noc:  { type: Number, default: null }, // Number of Children (sous-classes directes)
  cbo:  { type: Number, default: null }, // Coupling Between Objects (nb classes couplées)
  rfc:  { type: Number, default: null }, // Response For a Class (méthodes appelables)
  lcom: { type: Number, default: null }, // Lack of Cohesion of Methods (0-1, 0=cohésif)

  // ── Métriques Supplémentaires OOP ───────────────────────
  num_methods:       { type: Number, default: null }, // Nombre de méthodes
  num_attributes:    { type: Number, default: null }, // Nombre d'attributs
  num_public_methods:{ type: Number, default: null },
  num_private_methods:{ type: Number, default: null },
  avg_method_length: { type: Number, default: null }, // Longueur moyenne des méthodes
  max_method_length: { type: Number, default: null },
  instability:       { type: Number, default: null }, // Ce/(Ca+Ce) — 0=stable, 1=instable
  abstractness:      { type: Number, default: null }, // abstraites/(totales) — 0=concret, 1=abstrait

  // ── Métriques de Test ────────────────────────────────────
  test_coverage_pct:    { type: Number, default: null }, // % couverture de tests
  branch_coverage_pct:  { type: Number, default: null }, // % couverture des branches
  mutation_score:       { type: Number, default: null }, // % mutations tuées

  // ── Détail par fonction/méthode ──────────────────────────
  functions: [{
    name:                  { type: String },
    loc:                   { type: Number },
    cyclomatic_complexity: { type: Number },
    cognitive_complexity:  { type: Number },
    params_count:          { type: Number },
    max_nesting:           { type: Number },
    halstead_volume:       { type: Number },
  }],

  notes: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Index pour les requêtes
CodeMetricsSchema.index({ project_id: 1, created_at: -1 });
CodeMetricsSchema.index({ project_id: 1, module_name: 1 });

module.exports = mongoose.model('CodeMetrics', CodeMetricsSchema);
