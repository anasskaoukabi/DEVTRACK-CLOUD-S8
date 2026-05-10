import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const TYPE_META = {
  STANDUP:       { label: 'Standup',        color: '#22c55e', bg: '#f0fdf4' },
  SPRINT_REVIEW: { label: 'Sprint Review',  color: '#6366f1', bg: '#eef2ff' },
  RETROSPECTIVE: { label: 'Rétro',          color: '#8b5cf6', bg: '#f5f3ff' },
  PLANNING:      { label: 'Planning',       color: '#3b82f6', bg: '#eff6ff' },
  AUTRE:         { label: 'Autre',          color: '#94a3b8', bg: '#f8fafc' },
};
const STATUS_META = {
  SCHEDULED:   { label: '📅 Planifiée',   cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: '🟢 En cours',    cls: 'bg-emerald-100 text-emerald-700' },
  DONE:        { label: '✅ Terminée',    cls: 'bg-slate-100 text-slate-600' },
  CANCELLED:   { label: '❌ Annulée',    cls: 'bg-red-100 text-red-600' },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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

function MeetingForm({ initial, teams, projects, developers, onSave, onCancel }) {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    title: initial?.title || '',
    type: initial?.type || 'AUTRE',
    team_id: initial?.team_id?._id || initial?.team_id || searchParams.get('team') || '',
    project_id: initial?.project_id?._id || initial?.project_id || '',
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 16) : '',
    duration_min: initial?.duration_min || 30,
    location: initial?.location || '',
    attendees: initial?.attendees?.map(a => String(a._id || a)) || [],
    agenda: initial?.agenda || [],
    notes: initial?.notes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAttendee = (id) => set('attendees', form.attendees.includes(id)
    ? form.attendees.filter(x => x !== id) : [...form.attendees, id]);

  const addAgendaItem = () => set('agenda', [...form.agenda, { order: form.agenda.length + 1, topic: '', duration_min: 10, owner: '' }]);
  const updateAgenda = (i, k, v) => set('agenda', form.agenda.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const removeAgenda = (i) => set('agenda', form.agenda.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Titre *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Daily Standup, Sprint Review…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Durée (min)</label>
          <input type="number" min={5} max={480} value={form.duration_min} onChange={e => set('duration_min', +e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date & heure *</label>
          <input required type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Lieu / lien visio</label>
          <input value={form.location} onChange={e => set('location', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Salle A3 / https://meet.google.com/…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Équipe</label>
          <select value={form.team_id} onChange={e => set('team_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Aucune</option>
            {teams.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.avatar} {t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Projet</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Aucun</option>
            {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Participants */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">Participants ({form.attendees.length} sélectionnés)</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
          {developers.map(d => {
            const did = String(d._id || d.id);
            const selected = form.attendees.includes(did);
            return (
              <button key={did} type="button" onClick={() => toggleAttendee(did)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selected ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={selected ? { backgroundColor: d.color || '#6366f1' } : {}}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: d.color || '#6366f1' }}>{d.name?.charAt(0)}</span>
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500">Ordre du jour</label>
          <button type="button" onClick={addAgendaItem} className="text-xs text-indigo-600 font-medium hover:underline">+ Ajouter un point</button>
        </div>
        {form.agenda.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Aucun point à l'ordre du jour. Cliquez pour en ajouter.</p>
        ) : (
          <div className="space-y-2">
            {form.agenda.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                <input value={item.topic} onChange={e => updateAgenda(i, 'topic', e.target.value)} placeholder="Sujet…"
                  className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="number" value={item.duration_min} onChange={e => updateAgenda(i, 'duration_min', +e.target.value)} min={1} max={120}
                  className="w-14 text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500" title="Durée (min)" />
                <input value={item.owner} onChange={e => updateAgenda(i, 'owner', e.target.value)} placeholder="Responsable"
                  className="w-28 text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500" />
                <button type="button" onClick={() => removeAgenda(i)} className="text-red-400 hover:text-red-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          {initial ? 'Sauvegarder' : 'Créer la réunion'}
        </button>
      </div>
    </form>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [viewMeeting, setViewMeeting] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    try {
      const [m, t, p, d] = await Promise.all([
        api.get('/meetings').then(r => r.data),
        api.get('/teams').then(r => r.data),
        api.get('/projects').then(r => r.data),
        api.get('/developers').then(r => r.data),
      ]);
      setMeetings(m); setTeams(t); setProjects(p); setDevelopers(d);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/meetings', form);
      setMeetings(m => [...m, res.data].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setShowCreate(false);
      toast.success('Réunion créée !');
    } catch { toast.error('Erreur de création'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await api.put(`/meetings/${editMeeting._id || editMeeting.id}`, form);
      setMeetings(m => m.map(x => String(x._id || x.id) === String(res.data._id || res.data.id) ? res.data : x));
      setEditMeeting(null);
      toast.success('Réunion modifiée !');
    } catch { toast.error('Erreur'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/meetings/${id}/status`, { status });
      setMeetings(m => m.map(x => String(x._id || x.id) === String(id) ? { ...x, status } : x));
      if (viewMeeting && String(viewMeeting._id || viewMeeting.id) === String(id)) setViewMeeting(v => ({ ...v, status }));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette réunion ?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      setMeetings(m => m.filter(x => String(x._id || x.id) !== String(id)));
      setViewMeeting(null);
      toast.success('Réunion supprimée');
    } catch { toast.error('Erreur'); }
  };

  const filtered = filterStatus === 'all' ? meetings : meetings.filter(m => m.status === filterStatus);
  const grouped = {};
  filtered.forEach(m => {
    const day = new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(m);
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Réunions</h1>
          <p className="text-slate-500">{meetings.length} réunion{meetings.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouvelle réunion
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-1 bg-slate-200 rounded-xl p-1 mb-6 w-fit">
        {[['all', 'Toutes'], ['SCHEDULED', '📅 Planifiées'], ['IN_PROGRESS', '🟢 En cours'], ['DONE', '✅ Terminées'], ['CANCELLED', '❌ Annulées']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === v ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg font-semibold mb-2">Aucune réunion</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors mt-2">
            Planifier une réunion
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayMeetings]) => (
            <div key={day}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 capitalize">{day}</h2>
              <div className="space-y-3">
                {dayMeetings.map(m => {
                  const meta = TYPE_META[m.type] || TYPE_META.AUTRE;
                  const statusMeta = STATUS_META[m.status];
                  const date = new Date(m.date);
                  return (
                    <div key={m._id || m.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => setViewMeeting(m)}>
                      <div className="flex items-center gap-4">
                        {/* Heure */}
                        <div className="text-center w-12 flex-shrink-0">
                          <div className="text-sm font-bold text-slate-700">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-xs text-slate-400">{m.duration_min}min</div>
                        </div>
                        {/* Barre couleur */}
                        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-slate-800 truncate">{m.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {m.team_id && <span>👥 {m.team_id.name}</span>}
                            {m.project_id && <span>📁 {m.project_id.name}</span>}
                            {m.location && <span>📍 {m.location}</span>}
                            <span>{m.attendees?.length || 0} participants</span>
                          </div>
                        </div>
                        {/* Participants avatars */}
                        <div className="flex -space-x-2 flex-shrink-0">
                          {m.attendees?.slice(0, 4).map((a, i) => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: a.color || '#6366f1' }} title={a.name}>
                              {a.name?.charAt(0)}
                            </div>
                          ))}
                        </div>
                        {/* Statut */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusMeta?.cls}`}>{statusMeta?.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouvelle réunion" onClose={() => setShowCreate(false)}>
          <MeetingForm teams={teams} projects={projects} developers={developers} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Modal édition */}
      {editMeeting && (
        <Modal title="Modifier la réunion" onClose={() => setEditMeeting(null)}>
          <MeetingForm initial={editMeeting} teams={teams} projects={projects} developers={developers} onSave={handleEdit} onCancel={() => setEditMeeting(null)} />
        </Modal>
      )}

      {/* Modal vue détail */}
      {viewMeeting && (
        <Modal title={viewMeeting.title} onClose={() => setViewMeeting(null)}>
          <MeetingDetail meeting={viewMeeting} onEdit={() => { setEditMeeting(viewMeeting); setViewMeeting(null); }} onDelete={handleDelete} onStatusChange={handleStatusChange} />
        </Modal>
      )}
    </div>
  );
}

function MeetingDetail({ meeting, onEdit, onDelete, onStatusChange }) {
  const meta = TYPE_META[meeting.type] || TYPE_META.AUTRE;
  const date = new Date(meeting.date);
  const id = meeting._id || meeting.id;

  return (
    <div className="space-y-4">
      {/* Infos principales */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
        <span className={`px-2.5 py-1 rounded-full font-medium ${STATUS_META[meeting.status]?.cls}`}>{STATUS_META[meeting.status]?.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-xs text-slate-400">Date</span><p className="font-medium text-slate-800">{date.toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
        <div><span className="text-xs text-slate-400">Durée</span><p className="font-medium text-slate-800">{meeting.duration_min} min</p></div>
        {meeting.location && <div className="col-span-2"><span className="text-xs text-slate-400">Lieu</span><p className="font-medium text-slate-800">{meeting.location}</p></div>}
        {meeting.team_id && <div><span className="text-xs text-slate-400">Équipe</span><p className="font-medium text-slate-800">{meeting.team_id.avatar} {meeting.team_id.name}</p></div>}
        {meeting.project_id && <div><span className="text-xs text-slate-400">Projet</span><p className="font-medium text-slate-800">{meeting.project_id.name}</p></div>}
      </div>

      {/* Participants */}
      {meeting.attendees?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Participants ({meeting.attendees.length})</p>
          <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: a.color || '#6366f1' }}>{a.name?.charAt(0)}</div>
                <span className="text-xs font-medium text-slate-700">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      {meeting.agenda?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Ordre du jour</p>
          <div className="space-y-1.5">
            {meeting.agenda.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-sm">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{item.order || i + 1}</span>
                <span className="flex-1 text-slate-700">{item.topic}</span>
                <span className="text-xs text-slate-400">{item.duration_min}min</span>
                {item.owner && <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{item.owner}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {meeting.notes && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Notes / Compte-rendu</p>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">{meeting.notes}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
        <select value={meeting.status} onChange={e => onStatusChange(id, e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="SCHEDULED">📅 Planifiée</option>
          <option value="IN_PROGRESS">🟢 En cours</option>
          <option value="DONE">✅ Terminée</option>
          <option value="CANCELLED">❌ Annulée</option>
        </select>
        <button onClick={onEdit} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">✏️ Modifier</button>
        <button onClick={() => onDelete(id)} className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">🗑️ Supprimer</button>
      </div>
    </div>
  );
}
