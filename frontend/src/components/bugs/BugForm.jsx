import React, { useState } from 'react';

export default function BugForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', steps: '', severity: 'MEDIUM' });
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="ex: Crash au lancement sur Android 12"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sévérité</label>
        <div className="flex gap-2">
          {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: s }))}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                form.severity === s
                  ? s === 'CRITICAL' ? 'bg-red-600 text-white border-red-600'
                    : s === 'HIGH' ? 'bg-orange-500 text-white border-orange-500'
                    : s === 'MEDIUM' ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-slate-500 text-white border-slate-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Décrivez le problème..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Étapes de reproduction</label>
        <textarea
          value={form.steps}
          onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
          placeholder="1. Ouvrir l'app&#10;2. Naviguer vers...&#10;3. Observer le crash"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          {submitting ? 'Envoi...' : 'Signaler le bug'}
        </button>
      </div>
    </form>
  );
}
