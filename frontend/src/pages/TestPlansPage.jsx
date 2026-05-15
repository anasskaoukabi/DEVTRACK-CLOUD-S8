import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  FUNCTIONAL:   { bg: '#eef2ff', color: '#6366f1', label: 'Fonctionnel' },
  REGRESSION:   { bg: '#fef3c7', color: '#d97706', label: 'Régression' },
  INTEGRATION:  { bg: '#f0fdf4', color: '#16a34a', label: 'Intégration' },
  PERFORMANCE:  { bg: '#fdf4ff', color: '#9333ea', label: 'Performance' },
  SECURITY:     { bg: '#fff1f2', color: '#e11d48', label: 'Sécurité' },
  ACCEPTANCE:   { bg: '#f0f9ff', color: '#0284c7', label: 'Acceptation' },
  SMOKE:        { bg: '#f8fafc', color: '#64748b', label: 'Smoke' },
};
const STATUS_COLORS = {
  DRAFT:     'bg-slate-100 text-slate-600',
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED:  'bg-gray-100 text-gray-500',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PlanForm({ initial, projects, sprints, developers, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    test_type: initial?.test_type || 'FUNCTIONAL',
    environment: initial?.environment || 'STAGING',
    project_id: initial?.project_id?._id || initial?.project_id || '',
    sprint_id: initial?.sprint_id?._id || initial?.sprint_id || '',
    responsible_id: initial?.responsible_id?._id || initial?.responsible_id || '',
    start_date: initial?.start_date ? new Date(initial.start_date).toISOString().slice(0, 10) : '',
    end_date: initial?.end_date ? new Date(initial.end_date).toISOString().slice(0, 10) : '',
    objectives: initial?.objectives?.join('\n') || '',
    entry_criteria: initial?.entry_criteria?.join('\n') || '',
    exit_criteria: initial?.exit_criteria?.join('\n') || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      sprint_id: form.sprint_id || null,
      responsible_id: form.responsible_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      objectives: form.objectives.split('\n').filter(Boolean),
      entry_criteria: form.entry_criteria.split('\n').filter(Boolean),
      exit_criteria: form.exit_criteria.split('\n').filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Titre *</label>
        <input required value={form.title} onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Plan de test Sprint 3…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select value={form.test_type} onChange={e => set('test_type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            {Object.entries(TYPE_COLORS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Environnement</label>
          <select value={form.environment} onChange={e => set('environment', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            {['DEV','STAGING','PREPROD','PROD'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Projet *</label>
          <select required value={form.project_id} onChange={e => set('project_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Choisir</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Responsable QA</label>
          <select value={form.responsible_id} onChange={e => set('responsible_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Choisir</option>
            {developers.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date début</label>
          <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date fin</label>
          <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Objectifs (un par ligne)</label>
        <textarea value={form.objectives} onChange={e => set('objectives', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Valider le module de connexion&#10;Vérifier la régression sur le paiement…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Critères d'entrée</label>
          <textarea value={form.entry_criteria} onChange={e => set('entry_criteria', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Build stable disponible&#10;Environnement de test configuré…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Critères de sortie</label>
          <textarea value={form.exit_criteria} onChange={e => set('exit_criteria', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Taux de réussite ≥ 95%&#10;Aucun bug CRITICAL ouvert…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          {initial ? 'Mettre à jour' : 'Créer le plan'}
        </button>
      </div>
    </form>
  );
}

export default function TestPlansPage() {
  const [plans, setPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterProject) params.project_id = filterProject;
      if (filterStatus) params.status = filterStatus;
      const [p, proj, devs] = await Promise.all([
        api.get('/test-plans', { params }).then(r => r.data),
        api.get('/projects').then(r => r.data),
        api.get('/developers').then(r => r.data),
      ]);
      setPlans(p); setProjects(proj); setDevelopers(devs);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterProject, filterStatus]);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/test-plans', form);
      setPlans(p => [res.data, ...p]);
      setShowCreate(false);
      toast.success('Plan créé !');
    } catch { toast.error('Erreur de création'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce plan et tous ses cas de test ?')) return;
    try {
      await api.delete(`/test-plans/${id}`);
      setPlans(p => p.filter(x => String(x._id || x.id) !== String(id)));
      toast.success('Supprimé');
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Plans de Test</h1>
          <p className="text-slate-500">{plans.length} plan{plans.length !== 1 ? 's' : ''} de test</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouveau plan
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tous les projets</option>
          {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tous les statuts</option>
          {['DRAFT','ACTIVE','COMPLETED','ARCHIVED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="text-6xl mb-4">🧪</div>
          <p className="text-lg font-semibold mb-2">Aucun plan de test</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors mt-2">
            Créer le premier plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map(plan => {
            const id = plan._id || plan.id;
            const meta = TYPE_COLORS[plan.test_type] || TYPE_COLORS.FUNCTIONAL;
            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-1" style={{ backgroundColor: meta.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[plan.status]}`}>{plan.status}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 truncate">{plan.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.project_id?.name || ''} · {plan.environment}</p>
                    </div>
                    <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="flex gap-3 mb-4 text-xs text-slate-500">
                    <span>🧪 {plan.case_count || 0} cas</span>
                    <span>🔄 {plan.cycle_count || 0} cycles</span>
                    {plan.responsible_id && <span>👤 {plan.responsible_id.name}</span>}
                  </div>
                  {plan.start_date && (
                    <p className="text-xs text-slate-400 mb-4">
                      📅 {new Date(plan.start_date).toLocaleDateString('fr-FR')} → {plan.end_date ? new Date(plan.end_date).toLocaleDateString('fr-FR') : '?'}
                    </p>
                  )}
                  <Link to={`/test-plans/${id}`}
                    className="block w-full text-center py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: meta.color }}>
                    Ouvrir le plan →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="Nouveau plan de test" onClose={() => setShowCreate(false)}>
          <PlanForm projects={projects} sprints={[]} developers={developers} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
    </div>
  );
}
