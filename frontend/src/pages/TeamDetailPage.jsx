import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const ROLE_COLORS = { LEAD: 'bg-amber-100 text-amber-700', MEMBER: 'bg-slate-100 text-slate-600' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [allDevs, setAllDevs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addDevId, setAddDevId] = useState('');
  const [addRole, setAddRole] = useState('MEMBER');

  const load = async () => {
    try {
      const [t, devs, mtgs] = await Promise.all([
        api.get(`/teams/${id}`).then(r => r.data),
        api.get('/developers').then(r => r.data),
        api.get(`/meetings?team_id=${id}`).then(r => r.data),
      ]);
      setTeam(t); setAllDevs(devs); setMeetings(mtgs);
    } catch { toast.error('Équipe introuvable'); navigate('/teams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const existingIds = team?.members?.map(m => String(m.developer_id?._id || m.developer_id)) || [];
  const availableDevs = allDevs.filter(d => !existingIds.includes(String(d._id || d.id)));

  const handleAddMember = async () => {
    if (!addDevId) return;
    try {
      const res = await api.post(`/teams/${id}/members`, { developer_id: addDevId, role_in_team: addRole });
      setTeam(res.data);
      setShowAddMember(false); setAddDevId(''); setAddRole('MEMBER');
      toast.success('Membre ajouté !');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const handleRemoveMember = async (devId) => {
    if (!confirm('Retirer ce membre de l\'équipe ?')) return;
    try {
      await api.delete(`/teams/${id}/members/${devId}`);
      setTeam(t => ({ ...t, members: t.members.filter(m => String(m.developer_id?._id || m.developer_id) !== String(devId)) }));
      toast.success('Membre retiré');
    } catch { toast.error('Erreur'); }
  };

  const handleRoleChange = async (devId, role) => {
    try {
      await api.patch(`/teams/${id}/members/${devId}/role`, { role_in_team: role });
      setTeam(t => ({ ...t, members: t.members.map(m =>
        String(m.developer_id?._id || m.developer_id) === String(devId) ? { ...m, role_in_team: role } : m
      )}));
    } catch { toast.error('Erreur'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const upcoming = meetings.filter(m => new Date(m.date) >= new Date() && m.status !== 'CANCELLED');
  const past = meetings.filter(m => new Date(m.date) < new Date() || m.status === 'DONE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/teams" className="hover:text-indigo-600 transition-colors">Équipes</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-700 font-medium">{team.name}</span>
      </div>

      {/* Header équipe */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm" style={{ background: team.color + '20' }}>
            {team.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
              <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
            </div>
            {team.description && <p className="text-slate-500 text-sm">{team.description}</p>}
            <div className="flex gap-4 mt-2 text-xs text-slate-400">
              <span>{team.members?.length || 0} membres</span>
              <span>·</span>
              <span>{team.project_ids?.length || 0} projets</span>
              <span>·</span>
              <span>{meetings.length} réunions</span>
            </div>
          </div>
          <Link to={`/meetings/new?team=${id}`}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: team.color }}>
            + Réunion
          </Link>
        </div>

        {/* Projets liés */}
        {team.project_ids?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {team.project_ids.map((p, i) => (
              <Link key={i} to={`/projects/${p._id || p}`}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors">
                📁 {p.name || 'Projet'}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membres */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">👥 Membres ({team.members?.length || 0})</h2>
              <button onClick={() => setShowAddMember(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                + Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {team.members?.map((m, i) => {
                const dev = m.developer_id;
                if (!dev) return null;
                const devId = dev._id || dev;
                return (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: dev.color || '#6366f1' }}>
                      {dev.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{dev.name}</p>
                      <select value={m.role_in_team} onChange={e => handleRoleChange(devId, e.target.value)}
                        className="text-xs border-none outline-none bg-transparent cursor-pointer text-slate-500 hover:text-indigo-600 p-0">
                        <option value="LEAD">⭐ Lead</option>
                        <option value="MEMBER">Membre</option>
                      </select>
                    </div>
                    <button onClick={() => handleRemoveMember(devId)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })}
              {team.members?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Aucun membre</p>
              )}
            </div>
          </div>
        </div>

        {/* Réunions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Réunions à venir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">📅 Réunions à venir ({upcoming.length})</h2>
              <Link to={`/meetings/new?team=${id}`} className="text-xs text-indigo-600 font-medium hover:underline">Planifier</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune réunion planifiée</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(m => <MeetingRow key={m._id || m.id} meeting={m} />)}
              </div>
            )}
          </div>

          {/* Réunions passées */}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-4">📋 Réunions passées ({past.length})</h2>
              <div className="space-y-2">
                {past.slice(0, 5).map(m => <MeetingRow key={m._id || m.id} meeting={m} past />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal ajouter membre */}
      {showAddMember && (
        <Modal title="Ajouter un membre" onClose={() => setShowAddMember(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Développeur</label>
              <select value={addDevId} onChange={e => setAddDevId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Sélectionner</option>
                {availableDevs.map(d => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name} ({d.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Rôle dans l'équipe</label>
              <select value={addRole} onChange={e => setAddRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="MEMBER">Membre</option>
                <option value="LEAD">⭐ Lead</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
              <button onClick={handleAddMember} className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Ajouter</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const MEETING_TYPE_COLORS = {
  STANDUP: 'bg-emerald-100 text-emerald-700',
  SPRINT_REVIEW: 'bg-indigo-100 text-indigo-700',
  RETROSPECTIVE: 'bg-purple-100 text-purple-700',
  PLANNING: 'bg-blue-100 text-blue-700',
  AUTRE: 'bg-slate-100 text-slate-600',
};

function MeetingRow({ meeting, past }) {
  const date = new Date(meeting.date);
  return (
    <Link to={`/meetings/${meeting._id || meeting.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${past ? 'border-slate-100 bg-slate-50 opacity-75' : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
      <div className="text-center min-w-[40px]">
        <div className="text-xs font-bold text-slate-500">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
        <div className="text-xs text-slate-400">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{meeting.title}</p>
        <p className="text-xs text-slate-400">{meeting.attendees?.length || 0} participants · {meeting.duration_min} min</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${MEETING_TYPE_COLORS[meeting.type] || 'bg-slate-100 text-slate-600'}`}>
        {meeting.type}
      </span>
    </Link>
  );
}
