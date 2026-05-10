const mongoose = require('mongoose');

const ProjectBudgetSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  total_budget: { type: Number, default: 0 },
  currency:     { type: String, default: 'EUR' },
  developer_rates: [{
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
    hourly_rate:  { type: Number, default: 0 },
  }],
  expenses: [{
    label:    { type: String },
    amount:   { type: Number },
    date:     { type: Date, default: Date.now },
    category: { type: String, enum: ['RESSOURCES','OUTILS','INFRASTRUCTURE','FORMATION','AUTRE'], default: 'AUTRE' },
    note:     { type: String, default: '' },
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ProjectBudget', ProjectBudgetSchema);
