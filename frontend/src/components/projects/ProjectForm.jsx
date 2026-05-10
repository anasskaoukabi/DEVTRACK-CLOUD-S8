import React, { useState, useEffect } from 'react';
import { developersApi } from '../../services/api';

const STACK_SUGGESTIONS = ['React', 'React Native', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Java', 'Spring', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'TypeScript'];

export default function ProjectForm({ onSubmit, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    deadline: initial.deadline || '',
    stack: initial.stack || [],
    developer_ids: [],
  });
  const [stackInput, setStackInput] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    developersApi.getAll().then(setDevelopers).catch(() => {});
  }, []);

  const addTag = (tag) => {
    const t = tag.trim();
    if (t && !form.stack.includes(t)) {
      setForm(f => ({ ...f, stack: [...f.stack, t] }));
    }
    setStackInput('');
  };

  const removeTag = (tag) => setForm(f => ({ ...f, stack: f.stack.filter(s => s !== tag) }));

  const toggleDev = (id) => setForm(f => ({
    ...f,
    developer_ids: f.developer_ids.includes(id) ? f.developer_ids.filter(d => d !== id) : [...f.developer_ids, id],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nom du projet *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="ex: Mobile App"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Décrivez le projet..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Stack technique</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.stack.map(s => (
            <span key={s} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">
              {s}
              <button type="button" onClick={() => removeTag(s)} className="text-indigo-400 hover:text-indigo-600">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={stackInput}
            onChange={e => setStackInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(stackInput); } }}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ajouter une techno..."
            list="stack-suggestions"
          />
          <datalist id="stack-suggestions">
            {STACK_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
          <button type="button" onClick={() => addTag(stackInput)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">
            Ajouter
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {STACK_SUGGESTIONS.filter(s => !form.stack.includes(s)).slice(0, 8).map(s => (
            <button key={s} type="button" onClick={() => addTag(s)} className="px-2 py-0.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono">
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
        <input
          type="date"
          value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {developers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Équipe</label>
          <div className="space-y-2">
            {developers.map(d => (
              <label key={d.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.developer_ids.includes(d.id)}
                  onChange={() => toggleDev(d.id)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: d.color }}>
                  {d.name.charAt(0)}
                </div>
                <span className="text-sm text-slate-700">{d.name}</span>
                <span className="text-xs text-slate-400">{d.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Création...' : 'Créer le projet'}
        </button>
      </div>
    </form>
  );
}
