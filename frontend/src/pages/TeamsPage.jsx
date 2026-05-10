import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const TEAM_EMOJIS = ['👥','🚀','🎨','⚡','🔥','💡','🛡️','🎯','🧩','🌟','🦄','🔬'];
const TEAM_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6'];

function TeamForm({ initial, developers, projects, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    color: initial?.color || TEAM_COLORS[0],
    avatar: initial?.avatar || '👥',
    project_ids: initial?.project_ids?.map(p => String(p._id || p)) || [],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleProject = (id) => set('project_ids', form.project_ids.includes(id)
    ? form.project_ids.filter(p => p !== id) : [...form.project_ids, id]);

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Nom de l'équipe *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Équipe Frontend…" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Rôle de cette équipe…" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {TEAM_EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => set('avatar', e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.avatar === e ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-100'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">Couleur</label>
          <div className="flex flex-wrap gap-2 max-w-[120px]">
            {TEAM_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      {projects.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">Projets liés</label>
          <div className="flex flex-wrap gap-2">
            {projects.map(p => {
              const id = String(p._id || p.id);
              const active = form.project_ids.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleProject(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Sauvegarder</button>
      </div>
    </form>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const load = async () => {
    try {
      const [t, d, p] = await Promise.all([
        api.get('/teams').then(r => r.data),
        api.get('/developers').then(r => r.data),
        api.get('/projects').then(r => r.data),
      ]);
      setTeams(t); setDevelopers(d); setProjects(p);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/teams', form);
      setTeams(t => [res.data, ...t]);
      setShowCreate(false);
      toast.success('Équipe créée !');
    } catch { toast.error('Erreur de création'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await api.put(`/teams/${editTeam._id || editTeam.id}`, form);
      setTeams(t => t.map(x => (String(x._id || x.id) === String(res.data._id || res.data.id) ? res.data : x)));
      setEditTeam(null);
      toast.success('Équipe modifiée !');
    } catch { toast.error('Erreur de modification'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    try {
      await api.delete(`/teams/${id}`);
      setTeams(t => t.filter(x => String(x._id || x.id) !== String(id)));
      toast.success('Équipe supprimée');
    } catch { toast.error('Erreur de suppression'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Équipes</h1>
          <p className="text-slate-500">{teams.length} équipe{teams.length !== 1 ? 's' : ''} configurée{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouvelle équipe
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-lg font-semibold mb-2">Aucune équipe</p>
          <p className="text-sm mb-6">Créez votre première équipe pour organiser vos développeurs</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Créer une équipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map(team => {
            const id = team._id || team.id;
            const memberCount = team.members?.length || 0;
            const projectCount = team.project_ids?.length || 0;
            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                {/* Color bar */}
                <div className="h-1.5" style={{ background: team.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ background: team.color + '20' }}>
                        {team.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{team.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{memberCount} membre{memberCount !== 1 ? 's' : ''} · {projectCount} projet{projectCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditTeam(team)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  {team.description && (
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">{team.description}</p>
                  )}
                  {/* Membres avatars */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {team.members?.slice(0, 5).map((m, i) => {
                        const dev = m.developer_id;
                        return dev ? (
                          <div key={i} title={dev.name}
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: dev.color || '#6366f1' }}>
                            {dev.name?.charAt(0)}
                          </div>
                        ) : null;
                      })}
                      {memberCount > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          +{memberCount - 5}
                        </div>
                      )}
                    </div>
                    {memberCount === 0 && <span className="text-xs text-slate-400 italic">Aucun membre</span>}
                  </div>
                  {/* Projets */}
                  {team.project_ids?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {team.project_ids.slice(0, 3).map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{p.name || p}</span>
                      ))}
                      {team.project_ids.length > 3 && <span className="text-xs text-slate-400">+{team.project_ids.length - 3}</span>}
                    </div>
                  )}
                  <Link to={`/teams/${id}`}
                    className="block w-full text-center py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-white hover:opacity-90"
                    style={{ background: team.color }}>
                    Voir l'équipe →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouvelle équipe" onClose={() => setShowCreate(false)}>
          <TeamForm developers={developers} projects={projects} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Modal édition */}
      {editTeam && (
        <Modal title="Modifier l'équipe" onClose={() => setEditTeam(null)}>
          <TeamForm initial={editTeam} developers={developers} projects={projects} onSave={handleEdit} onCancel={() => setEditTeam(null)} />
        </Modal>
      )}
    </div>
  );
}
