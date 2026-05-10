import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { planningPokerApi, tasksApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Can from '../components/common/Can';

const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

function VoteCard({ value, selected, revealed, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all select-none
        ${selected
          ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg scale-105'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}
        ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}>
      {value}
    </button>
  );
}

function SessionCard({ session, onOpen, onDelete }) {
  const statusColor = session.status === 'DONE' ? 'bg-emerald-100 text-emerald-700'
    : session.status === 'VOTING' ? 'bg-indigo-100 text-indigo-700'
    : session.status === 'REVEALED' ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-indigo-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-lg">
          🃏
        </div>
        <div>
          <p className="font-medium text-slate-800">{session.task_title || 'Tâche sans titre'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{session.status}</span>
            {session.consensus != null && (
              <span className="text-xs text-emerald-600 font-semibold">Consensus: {session.consensus} SP</span>
            )}
            <span className="text-xs text-slate-400">{session.votes?.length ?? 0} vote(s)</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onOpen(session)}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Ouvrir
        </button>
        <Can roles={['ADMIN','PO','SCRUM_MASTER']}>
          <button onClick={() => onDelete(session.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </Can>
      </div>
    </div>
  );
}

export default function PlanningPokerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [active, setActive] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTaskId, setNewTaskId] = useState('');
  const pollRef = useRef(null);

  const load = async () => {
    const [proj, ss, tks] = await Promise.all([
      projectsApi.getOne(id),
      planningPokerApi.getSessions(id),
      tasksApi.getAll({ project_id: id }),
    ]);
    setProject(proj);
    setSessions(ss);
    setTasks(Array.isArray(tks) ? tks : tks.data || []);
    setLoading(false);
  };

  const refreshActive = async (sessionId) => {
    const ss = await planningPokerApi.getSessions(id);
    const updated = ss.find(s => s.id === sessionId);
    if (updated) {
      setActive(updated);
      setSessions(ss);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (active && active.status !== 'DONE') {
      pollRef.current = setInterval(() => refreshActive(active.id), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [active?.id, active?.status]);

  const handleOpen = (session) => {
    setActive(session);
    setMyVote(session.votes?.find(v => v.developer_id?.toString() === user?.id?.toString())?.value ?? null);
  };

  const handleCreate = async () => {
    if (!newTaskId) return;
    const task = tasks.find(t => t.id === newTaskId);
    await planningPokerApi.create({ project_id: id, task_id: newTaskId, task_title: task?.title });
    toast.success('Session créée');
    setShowNew(false);
    setNewTaskId('');
    load();
  };

  const handleStart = async () => {
    await planningPokerApi.start(active.id);
    toast.success('Vote démarré');
    refreshActive(active.id);
  };

  const handleVote = async (value) => {
    setMyVote(value);
    await planningPokerApi.vote(active.id, { developer_id: user?.id, name: user?.name, value });
    toast.success('Vote enregistré');
    refreshActive(active.id);
  };

  const handleReveal = async () => {
    await planningPokerApi.reveal(active.id);
    refreshActive(active.id);
  };

  const handleConsensus = async (value) => {
    await planningPokerApi.consensus(active.id, { consensus: Number(value) });
    toast.success(`Consensus: ${value} SP`);
    refreshActive(active.id);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Supprimer cette session ?')) return;
    await planningPokerApi.delete(sessionId);
    toast.success('Session supprimée');
    if (active?.id === sessionId) setActive(null);
    load();
  };

  if (loading) return <div className="p-8"><div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200" /></div>;

  const voteValues = active?.votes?.map(v => v.value).filter(v => v !== '?' && v !== '☕').map(Number).filter(n => !isNaN(n));
  const avgVote = voteValues?.length > 0 ? (voteValues.reduce((a, b) => a + b, 0) / voteValues.length).toFixed(1) : null;
  const consensusSuggestion = avgVote ? [1, 2, 3, 5, 8, 13, 21].find(v => v >= Number(avgVote)) ?? 21 : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-indigo-600">{project?.name}</Link>
            <span>/</span>
            <span className="text-slate-600">Planning Poker</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Planning Poker</h1>
          <p className="text-slate-500 text-sm mt-1">{sessions.length} session(s)</p>
        </div>
        <Can roles={['ADMIN','PO','SCRUM_MASTER']}>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle session
          </button>
        </Can>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sessions list */}
        <div className="lg:col-span-2 space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Aucune session. Créez-en une pour commencer.
            </div>
          ) : (
            sessions.map(s => (
              <SessionCard key={s.id} session={s} onOpen={handleOpen} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Active session panel */}
        <div className="lg:col-span-3">
          {!active ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">🃏</p>
              <p className="font-medium text-slate-600">Sélectionnez une session</p>
              <p className="text-sm mt-1">pour commencer à voter</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{active.task_title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
                    ${active.status === 'DONE' ? 'bg-emerald-100 text-emerald-700'
                      : active.status === 'VOTING' ? 'bg-indigo-100 text-indigo-700'
                      : active.status === 'REVEALED' ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'}`}>
                    {active.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {active.status === 'WAITING' && (
                    <Can roles={['ADMIN','PO','SCRUM_MASTER']}>
                      <button onClick={handleStart}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Démarrer le vote
                      </button>
                    </Can>
                  )}
                  {active.status === 'VOTING' && (
                    <Can roles={['ADMIN','PO','SCRUM_MASTER']}>
                      <button onClick={handleReveal}
                        className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                        Révéler les votes
                      </button>
                    </Can>
                  )}
                </div>
              </div>

              <div className="p-5">
                {/* Vote cards */}
                {active.status === 'VOTING' && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Votre estimation :</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {CARD_VALUES.map(v => (
                        <VoteCard key={v} value={v} selected={myVote === v}
                          onClick={() => handleVote(v)} disabled={active.status !== 'VOTING'} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {active.votes?.length ?? 0} participant(s) ont voté
                    </p>
                  </div>
                )}

                {/* Revealed results */}
                {(active.status === 'REVEALED' || active.status === 'DONE') && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Résultats :</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {active.votes?.map(v => (
                        <div key={v.developer_id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                            {v.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 truncate">{v.name}</p>
                            <p className="text-lg font-bold text-slate-800">{v.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {avgVote && (
                      <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm text-indigo-800">
                          Moyenne: <strong>{avgVote}</strong> SP — Suggestion: <strong>{consensusSuggestion}</strong> SP
                        </p>
                      </div>
                    )}

                    {active.status === 'REVEALED' && (
                      <Can roles={['ADMIN','PO','SCRUM_MASTER']}>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Définir le consensus :</p>
                          <div className="flex flex-wrap gap-2">
                            {[1,2,3,5,8,13,21].map(v => (
                              <button key={v} onClick={() => handleConsensus(v)}
                                className={`w-12 h-14 rounded-xl border-2 font-bold text-sm transition-all
                                  ${v === consensusSuggestion
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Can>
                    )}

                    {active.consensus != null && (
                      <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">Consensus atteint</p>
                          <p className="text-2xl font-bold text-emerald-700">{active.consensus} SP</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {active.status === 'WAITING' && (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-3xl mb-2">⏳</p>
                    <p className="text-sm">En attente du démarrage...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New session modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg text-slate-800 mb-4">Nouvelle session</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tâche à estimer</label>
              <select value={newTaskId} onChange={e => setNewTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Sélectionner une tâche</option>
                {tasks.filter(t => t.status !== 'DONE').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={!newTaskId}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
