import React, { useState } from 'react';

const SP_OPTIONS = [1, 2, 3, 5, 8, 13];

export default function TaskForm({ projectId, sprints = [], developers = [], onSubmit, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    type: initial.type || 'FEATURE',
    priority: initial.priority || 'MEDIUM',
    status: initial.status || 'BACKLOG',
    story_points: initial.story_points || '',
    estimated_hours: initial.estimated_hours || '',
    deadline: initial.deadline || '',
    developer_id: initial.developer_id || '',
    sprint_id: initial.sprint_id || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        story_points: form.story_points ? parseInt(form.story_points) : null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        developer_id: form.developer_id ? form.developer_id : null,
        sprint_id: form.sprint_id ? form.sprint_id : null,
        deadline: form.deadline || null,
      });
    } finally { setSubmitting(false); }
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
          placeholder="ex: Implémenter auth JWT"
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
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="REFACTOR">Refactor</option>
            <option value="TEST">Test</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
          <select
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Statut initial</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sprint</label>
          <select
            value={form.sprint_id}
            onChange={e => setForm(f => ({ ...f, sprint_id: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Aucun sprint</option>
            {sprints.filter(s => s.status === 'ACTIVE').map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Story points */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Story Points {form.type === 'FEATURE' && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          {SP_OPTIONS.map(sp => (
            <button
              key={sp}
              type="button"
              onClick={() => setForm(f => ({ ...f, story_points: f.story_points === sp ? '' : sp }))}
              className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-colors ${
                form.story_points === sp
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}>
              {sp}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Heures estimées</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.estimated_hours}
            onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="ex: 4.5"
          />
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
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Assigné à</label>
        <select
          value={form.developer_id}
          onChange={e => setForm(f => ({ ...f, developer_id: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Non assigné</option>
          {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Création...' : (initial.id ? 'Enregistrer' : 'Créer la tâche')}
        </button>
      </div>
    </form>
  );
}
