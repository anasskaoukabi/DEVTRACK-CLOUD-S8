const mongoose = require('mongoose');

const RiskSchema = new mongoose.Schema({
  project_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  category:     { type: String, enum: ['TECHNIQUE','DÉLAIS','RESSOURCES','CLIENT','SÉCURITÉ','BUDGET','AUTRE'], default: 'AUTRE' },
  probability:  { type: Number, min: 1, max: 5, required: true },
  impact:       { type: Number, min: 1, max: 5, required: true },
  status:       { type: String, enum: ['IDENTIFIED','ANALYSED','MITIGATING','MITIGATED','CLOSED'], default: 'IDENTIFIED' },
  owner_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
  mitigation_plan:  { type: String, default: '' },
  contingency_plan: { type: String, default: '' },
  review_date:  { type: Date, default: null },
  history: [{
    date:       { type: Date, default: Date.now },
    note:       { type: String },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

RiskSchema.virtual('score').get(function () {
  return this.probability * this.impact;
});
RiskSchema.virtual('level').get(function () {
  const s = this.probability * this.impact;
  if (s >= 15) return 'CRITICAL';
  if (s >= 9)  return 'HIGH';
  if (s >= 4)  return 'MEDIUM';
  return 'LOW';
});
RiskSchema.set('toJSON', { virtuals: true });
RiskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Risk', RiskSchema);
