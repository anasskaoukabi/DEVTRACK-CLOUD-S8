import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { developersApi } from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Can from '../components/common/Can';
import { ROLE_META } from '../context/AuthContext';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#f97316','#14b8a6'];

function DeveloperForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', color: COLORS[0], role: 'DEV' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="ex: Sarah Martin" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="sarah@devtrack.io" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
        <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {Object.entries(ROLE_META).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({...f, color: c}))}
              className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Création...' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState([]);
  const [workloads, setWorkloads] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const devs = await developersApi.getAll();
    setDevelopers(devs);
    setLoading(false);

    const wl = {};
    await Promise.all(devs.map(async d => {
      try {
        const w = await developersApi.getWorkload(d.id);
        wl[d.id] = w;
      } catch {}
    }));
    setWorkloads(wl);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    await developersApi.create(data);
    toast.success('Développeur ajouté !');
    setShowForm(false);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Développeurs</h1>
          <p className="text-slate-500 text-sm mt-1">{developers.length} membre(s) de l'équipe</p>
        </div>
        <Can roles={['ADMIN']}>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajouter
          </button>
        </Can>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {developers.map(dev => {
            const wl = workloads[dev.id];
            return (
              <div key={dev.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: dev.color }}>
                    {dev.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{dev.name}</h3>
                    <p className="text-sm text-slate-400">{dev.email}</p>
                    {dev.role && (() => {
                      const meta = ROLE_META[dev.role] ?? { label: dev.role, color: 'bg-slate-100 text-slate-600' };
                      return (
                        <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-1 ${meta.color}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {wl && (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-600">{wl.inProgress}</p>
                        <p className="text-xs text-amber-500">En cours</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-purple-600">{wl.inReview}</p>
                        <p className="text-xs text-purple-500">En review</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-600">{wl.totalActive}</p>
                        <p className="text-xs text-slate-400">Total actif</p>
                      </div>
                    </div>

                    {wl.tasks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tâches actives</p>
                        <div className="space-y-1.5">
                          {wl.tasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-xs">
                              <Badge type="status" value={t.status} />
                              <span className="text-slate-600 truncate">{t.title}</span>
                            </div>
                          ))}
                          {wl.tasks.length > 3 && (
                            <p className="text-xs text-slate-400">+{wl.tasks.length - 3} autres...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Ajouter un développeur">
        <DeveloperForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
