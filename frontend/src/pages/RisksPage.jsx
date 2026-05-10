import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const LEVEL_META = {
  CRITICAL: { label: 'CRITIQUE',  color: '#dc2626', bg: '#fee2e2' },
  HIGH:     { label: 'ÉLEVÉ',     color: '#ea580c', bg: '#ffedd5' },
  MEDIUM:   { label: 'MOYEN',     color: '#ca8a04', bg: '#fef9c3' },
  LOW:      { label: 'FAIBLE',    color: '#16a34a', bg: '#dcfce7' },
};
const STATUS_OPTS = ['IDENTIFIED','ANALYSED','MITIGATING','MITIGATED','CLOSED'];
const CATEGORY_OPTS = ['TECHNIQUE','DÉLAIS','RESSOURCES','CLIENT','SÉCURITÉ','BUDGET','AUTRE'];

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

function RiskForm({ initial, projects, developers, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || 'TECHNIQUE',
    probability: initial?.probability || 3,
    impact: initial?.impact || 3,
    status: initial?.status || 'IDENTIFIED',
    project_id: initial?.project_id?._id || initial?.project_id || '',
    owner_id: initial?.owner_id?._id || initial?.owner_id || '',
    mitigation_plan: initial?.mitigation_plan || '',
    contingency_plan: initial?.contingency_plan || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const score = form.probability * form.impact;
  const level = score >= 15 ? 'CRITICAL' : score >= 9 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
  const lm = LEVEL_META[level];

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Titre *</label>
        <input required value={form.title} onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Risque de retard de livraison…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            {CATEGORY_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Statut</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Probabilité (1-5)</label>
          <input type="range" min={1} max={5} value={form.probability} onChange={e => set('probability', +e.target.value)} className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Faible</span><span className="font-bold text-slate-700">{form.probability}</span><span>Élevée</span></div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Impact (1-5)</label>
          <input type="range" min={1} max={5} value={form.impact} onChange={e => set('impact', +e.target.value)} className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Faible</span><span className="font-bold text-slate-700">{form.impact}</span><span>Critique</span></div>
        </div>
      </div>
      {/* Score */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: lm.bg }}>
        <div className="text-2xl font-black" style={{ color: lm.color }}>{score}</div>
        <div><p className="font-bold text-sm" style={{ color: lm.color }}>Niveau : {lm.label}</p><p className="text-xs" style={{ color: lm.color }}>Probabilité {form.probability} × Impact {form.impact}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Projet</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Aucun</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Responsable</label>
          <select value={form.owner_id} onChange={e => set('owner_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Aucun</option>
            {developers.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Plan de mitigation</label>
        <textarea value={form.mitigation_plan} onChange={e => set('mitigation_plan', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Actions pour réduire la probabilité ou l'impact…" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Plan de contingence</label>
        <textarea value={form.contingency_plan} onChange={e => set('contingency_plan', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Actions si le risque se matérialise…" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">{initial ? 'Mettre à jour' : 'Créer'}</button>
      </div>
    </form>
  );
}

export default function RisksPage() {
  const [risks, setRisks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRisk, setEditRisk] = useState(null);
  const [filterProject, setFilterProject] = useState('');

  const load = async () => {
    try {
      const params = filterProject ? { project_id: filterProject } : {};
      const [r, p, d] = await Promise.all([
        api.get('/governance/risks', { params }).then(x => x.data),
        api.get('/projects').then(x => x.data),
        api.get('/developers').then(x => x.data),
      ]);
      setRisks(r); setProjects(p); setDevelopers(d);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterProject]);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/governance/risks', form);
      setRisks(r => [res.data, ...r]);
      setShowCreate(false);
      toast.success('Risque créé !');
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await api.put(`/governance/risks/${editRisk._id || editRisk.id}`, form);
      setRisks(r => r.map(x => String(x._id || x.id) === String(res.data._id || res.data.id) ? res.data : x));
      setEditRisk(null);
      toast.success('Mis à jour !');
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce risque ?')) return;
    try {
      await api.delete(`/governance/risks/${id}`);
      setRisks(r => r.filter(x => String(x._id || x.id) !== String(id)));
      toast.success('Supprimé');
    } catch { toast.error('Erreur'); }
  };

  // Matrice 5x5
  const matrixRisks = {};
  risks.forEach(r => {
    const key = `${r.probability}-${r.impact}`;
    if (!matrixRisks[key]) matrixRisks[key] = [];
    matrixRisks[key].push(r);
  });

  const cellColor = (p, i) => {
    const s = p * i;
    if (s >= 15) return '#fee2e2';
    if (s >= 9) return '#ffedd5';
    if (s >= 4) return '#fef9c3';
    return '#f0fdf4';
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const byLevel = { CRITICAL: risks.filter(r => r.probability * r.impact >= 15), HIGH: risks.filter(r => { const s = r.probability * r.impact; return s >= 9 && s < 15; }), MEDIUM: risks.filter(r => { const s = r.probability * r.impact; return s >= 4 && s < 9; }), LOW: risks.filter(r => r.probability * r.impact < 4) };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Registre des Risques</h1>
          <p className="text-slate-500">{risks.length} risque{risks.length !== 1 ? 's' : ''} identifié{risks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouveau risque
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(LEVEL_META).map(([level, meta]) => (
          <div key={level} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black" style={{ backgroundColor: meta.bg, color: meta.color }}>
              {byLevel[level]?.length || 0}
            </div>
            <div><p className="text-xs text-slate-500">Niveau</p><p className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-4">🎯 Matrice Probabilité × Impact</h2>
          <div className="relative">
            <div className="grid grid-cols-6 gap-1 text-xs">
              <div />
              {[1,2,3,4,5].map(i => <div key={i} className="text-center font-bold text-slate-500 py-1">I={i}</div>)}
              {[5,4,3,2,1].map(p => (
                <React.Fragment key={p}>
                  <div className="font-bold text-slate-500 flex items-center justify-center text-right">P={p}</div>
                  {[1,2,3,4,5].map(i => {
                    const key = `${p}-${i}`;
                    const cellRisks = matrixRisks[key] || [];
                    return (
                      <div key={i} className="rounded-lg flex items-center justify-center min-h-[36px] text-xs font-bold cursor-default transition-transform hover:scale-105"
                        style={{ backgroundColor: cellColor(p, i) }}
                        title={cellRisks.map(r => r.title).join(', ')}>
                        {cellRisks.length > 0 ? cellRisks.length : ''}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 space-y-3">
          {risks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="text-5xl mb-3">⚠️</div>
              <p>Aucun risque identifié</p>
            </div>
          ) : (
            risks.sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact)).map(risk => {
              const score = risk.probability * risk.impact;
              const level = score >= 15 ? 'CRITICAL' : score >= 9 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
              const lm = LEVEL_META[level];
              const id = risk._id || risk.id;
              return (
                <div key={id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0" style={{ backgroundColor: lm.bg, color: lm.color }}>{score}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-800 truncate">{risk.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: lm.bg, color: lm.color }}>{lm.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{risk.category}</span>
                        <span>·</span>
                        <span>{risk.status}</span>
                        {risk.owner_id && <><span>·</span><span>👤 {risk.owner_id.name}</span></>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditRisk(risk)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreate && <Modal title="Nouveau risque" onClose={() => setShowCreate(false)}><RiskForm projects={projects} developers={developers} onSave={handleCreate} onCancel={() => setShowCreate(false)} /></Modal>}
      {editRisk && <Modal title="Modifier le risque" onClose={() => setEditRisk(null)}><RiskForm initial={editRisk} projects={projects} developers={developers} onSave={handleEdit} onCancel={() => setEditRisk(null)} /></Modal>}
    </div>
  );
}
