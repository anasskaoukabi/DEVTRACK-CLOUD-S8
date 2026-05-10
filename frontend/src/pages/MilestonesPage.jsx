import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_META = {
  UPCOMING:  { label: '📅 À venir',    cls: 'bg-blue-100 text-blue-700',    bar: '#3b82f6' },
  ON_TRACK:  { label: '🟢 Dans les temps', cls: 'bg-emerald-100 text-emerald-700', bar: '#22c55e' },
  AT_RISK:   { label: '⚠️ À risque',   cls: 'bg-amber-100 text-amber-700',  bar: '#f59e0b' },
  DELAYED:   { label: '🔴 En retard',  cls: 'bg-red-100 text-red-700',      bar: '#ef4444' },
  COMPLETED: { label: '✅ Terminé',    cls: 'bg-slate-100 text-slate-600',   bar: '#64748b' },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function MilestoneForm({ initial, projects, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    project_id: initial?.project_id?._id || initial?.project_id || '',
    target_date: initial?.target_date ? new Date(initial.target_date).toISOString().slice(0, 10) : '',
    status: initial?.status || 'UPCOMING',
    deliverables: initial?.deliverables?.join('\n') || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, deliverables: form.deliverables.split('\n').filter(Boolean) }); }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Nom du jalon *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="MVP v1.0, Go-Live, Audit…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Projet</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Aucun</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date cible *</label>
          <input required type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Statut</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_META).map(([v, m]) => (
              <button key={v} type="button" onClick={() => set('status', v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.status === v ? 'ring-2 ring-indigo-500 ' + m.cls : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Livrables (un par ligne)</label>
        <textarea value={form.deliverables} onChange={e => set('deliverables', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Documentation technique&#10;Application déployée en staging&#10;Tests de recette validés" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">{initial ? 'Mettre à jour' : 'Créer'}</button>
      </div>
    </form>
  );
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterProject, setFilterProject] = useState('');

  const load = async () => {
    try {
      const params = filterProject ? { project_id: filterProject } : {};
      const [m, p] = await Promise.all([
        api.get('/governance/milestones', { params }).then(r => r.data),
        api.get('/projects').then(r => r.data),
      ]);
      setMilestones(m); setProjects(p);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterProject]);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/governance/milestones', form);
      setMilestones(m => [...m, res.data].sort((a, b) => new Date(a.target_date) - new Date(b.target_date)));
      setShowCreate(false); toast.success('Jalon créé !');
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await api.put(`/governance/milestones/${editItem._id || editItem.id}`, form);
      setMilestones(m => m.map(x => String(x._id || x.id) === String(res.data._id || res.data.id) ? res.data : x));
      setEditItem(null); toast.success('Mis à jour !');
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce jalon ?')) return;
    try {
      await api.delete(`/governance/milestones/${id}`);
      setMilestones(m => m.filter(x => String(x._id || x.id) !== String(id)));
      toast.success('Supprimé');
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const now = new Date();
  const upcoming = milestones.filter(m => new Date(m.target_date) >= now && m.status !== 'COMPLETED');
  const past = milestones.filter(m => new Date(m.target_date) < now || m.status === 'COMPLETED');

  // Timeline data
  const all = [...milestones].sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  const timelineStart = all.length > 0 ? new Date(all[0].target_date) : now;
  const timelineEnd = all.length > 0 ? new Date(all[all.length - 1].target_date) : new Date(now.getTime() + 90 * 86400000);
  const timeSpan = timelineEnd - timelineStart || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Jalons & Roadmap</h1>
          <p className="text-slate-500">{milestones.length} jalon{milestones.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouveau jalon
          </button>
        </div>
      </div>

      {/* Timeline */}
      {all.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">📅 Timeline</h2>
          <div className="relative h-16">
            {/* Ligne de base */}
            <div className="absolute top-7 left-0 right-0 h-0.5 bg-slate-200" />
            {/* Marqueur "Aujourd'hui" */}
            {now >= timelineStart && now <= timelineEnd && (
              <div className="absolute top-2 h-12 w-0.5 bg-indigo-500 z-10"
                style={{ left: `${((now - timelineStart) / timeSpan) * 100}%` }}>
                <div className="absolute -top-5 -translate-x-1/2 text-xs text-indigo-600 font-bold whitespace-nowrap">Aujourd'hui</div>
              </div>
            )}
            {/* Jalons */}
            {all.map(m => {
              const pos = ((new Date(m.target_date) - timelineStart) / timeSpan) * 100;
              const sm = STATUS_META[m.status];
              return (
                <div key={m._id || m.id} className="absolute flex flex-col items-center" style={{ left: `${Math.min(Math.max(pos, 0), 97)}%`, top: 0 }}>
                  <div className="text-xs text-slate-500 mb-1 whitespace-nowrap -translate-x-1/2 max-w-20 truncate" title={m.name}>{m.name}</div>
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: sm.bar }} title={`${m.name} — ${new Date(m.target_date).toLocaleDateString('fr-FR')}`} />
                  <div className="text-xs text-slate-400 mt-1 -translate-x-1/2 whitespace-nowrap">{new Date(m.target_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-lg font-semibold mb-2">Aucun jalon défini</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 mt-2">Créer le premier jalon</button>
        </div>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">À venir ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map(m => <MilestoneCard key={m._id || m.id} m={m} onEdit={setEditItem} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Passés ({past.length})</h2>
              <div className="space-y-3 opacity-75">
                {past.map(m => <MilestoneCard key={m._id || m.id} m={m} onEdit={setEditItem} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <Modal title="Nouveau jalon" onClose={() => setShowCreate(false)}><MilestoneForm projects={projects} onSave={handleCreate} onCancel={() => setShowCreate(false)} /></Modal>}
      {editItem && <Modal title="Modifier le jalon" onClose={() => setEditItem(null)}><MilestoneForm initial={editItem} projects={projects} onSave={handleEdit} onCancel={() => setEditItem(null)} /></Modal>}
    </div>
  );
}

function MilestoneCard({ m, onEdit, onDelete }) {
  const sm = STATUS_META[m.status];
  const id = m._id || m.id;
  const daysLeft = Math.round((new Date(m.target_date) - new Date()) / 86400000);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sm.bar + '20' }}>
          <div className="text-center"><div className="text-xs font-bold" style={{ color: sm.bar }}>{new Date(m.target_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-slate-800 truncate">{m.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sm.cls}`}>{sm.label}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {m.project_id?.name && <span>📁 {m.project_id.name}</span>}
            {m.status !== 'COMPLETED' && <span className={daysLeft < 0 ? 'text-red-500 font-semibold' : daysLeft < 7 ? 'text-amber-500 font-semibold' : ''}>{daysLeft < 0 ? `${Math.abs(daysLeft)}j de retard` : `dans ${daysLeft}j`}</span>}
            {m.deliverables?.length > 0 && <span>📋 {m.deliverables.length} livrable{m.deliverables.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(m)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => onDelete(id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
