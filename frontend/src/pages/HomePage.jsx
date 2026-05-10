import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_META } from '../context/AuthContext';
import {
  projectsApi, portfolioApi, tasksApi, sprintsApi,
  developersApi, auditApi, notificationsApi,
} from '../services/api';

/* ─── shared helpers ─────────────────────────────────────────── */
function StatCard({ label, value, color = 'text-slate-800', sub, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      {icon && <div className="p-2.5 bg-slate-50 rounded-xl flex-shrink-0">{icon}</div>}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ShortcutBtn({ to, icon, label, color = 'bg-indigo-600 hover:bg-indigo-700' }) {
  return (
    <Link to={to} className={`flex items-center gap-2 px-4 py-2.5 ${color} text-white rounded-lg text-sm font-medium transition-colors`}>
      <span>{icon}</span>{label}
    </Link>
  );
}

function WelcomeBanner({ user }) {
  const meta = ROLE_META[user.role] ?? { label: user.role, color: 'bg-slate-100 text-slate-600' };
  const greet = new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greet}, {user.name.split(' ')[0]} 👋</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${meta.color}`}>{meta.label}</span>
          <span className="text-sm text-slate-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN ─────────────────────────────────────────────────── */
function AdminHome({ user }) {
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    Promise.all([
      projectsApi.getAll(),
      developersApi.getAll(),
      auditApi.getAll({ limit: 5 }),
      tasksApi.getAll({}),
    ]).then(([projs, devs, aud, tks]) => {
      setProjects(projs);
      setDevelopers(devs);
      setAudit(aud.logs ?? aud ?? []);
      setTasks(Array.isArray(tks) ? tks : tks.data || []);
    }).catch(() => {});
  }, []);

  const openBugs = tasks.filter(t => t.hasCriticalBug).length;

  return (
    <div className="p-8">
      <WelcomeBanner user={user} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projets actifs" value={projects.filter(p => p.status === 'ACTIVE').length}
          color="text-indigo-600"
          icon={<svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>} />
        <StatCard label="Membres" value={developers.length}
          color="text-emerald-600"
          icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>} />
        <StatCard label="Tâches totales" value={tasks.length}
          icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>} />
        <StatCard label="Bugs critiques" value={openBugs} color={openBugs > 0 ? 'text-red-600' : 'text-slate-800'}
          icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dev roles breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Répartition par rôle</h2>
          <div className="space-y-3">
            {Object.entries(ROLE_META).map(([role, meta]) => {
              const count = developers.filter(d => d.role === role).length;
              const pct = developers.length > 0 ? Math.round((count / developers.length) * 100) : 0;
              return (
                <div key={role}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent audit */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Activité récente</h2>
            <Link to="/audit" className="text-xs text-indigo-600 hover:underline">Tout voir</Link>
          </div>
          {audit.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune activité enregistrée</p>
          ) : (
            <div className="space-y-2">
              {audit.slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'CREATE' ? 'bg-emerald-400' : log.action === 'DELETE' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{log.user_name}</span> · {log.action} {log.entity_type} <span className="text-slate-400">"{log.entity_name}"</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{new Date(log.timestamp).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/developers" icon="👥" label="Gérer les membres" />
        <ShortcutBtn to="/portfolio" icon="📊" label="Portefeuille" color="bg-emerald-600 hover:bg-emerald-700" />
        <ShortcutBtn to="/audit" icon="🔍" label="Audit Trail" color="bg-slate-700 hover:bg-slate-800" />
        <ShortcutBtn to="/resources" icon="📅" label="Ressources" color="bg-purple-600 hover:bg-purple-700" />
      </div>
    </div>
  );
}

/* ─── PRODUCT OWNER ─────────────────────────────────────────── */
function POHome({ user }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portfolioApi.get().then(setPortfolio).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" /></div>;

  const { projects = [], globalStats = {} } = portfolio ?? {};
  const critical = projects.filter(p => p.health < 40);
  const atRisk = projects.filter(p => p.health >= 40 && p.health < 70);
  const healthy = projects.filter(p => p.health >= 70);

  return (
    <div className="p-8">
      <WelcomeBanner user={user} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projets" value={globalStats.totalProjects ?? 0} color="text-indigo-600" />
        <StatCard label="Tâches terminées" value={`${globalStats.totalDone ?? 0}/${globalStats.totalTasks ?? 0}`} color="text-emerald-600" />
        <StatCard label="Bugs critiques" value={globalStats.totalCriticalBugs ?? 0} color={(globalStats.totalCriticalBugs ?? 0) > 0 ? 'text-red-600' : 'text-slate-800'} />
        <StatCard label="Équipe" value={globalStats.totalDevelopers ?? 0} />
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{critical.length}</p>
          <p className="text-sm font-medium text-red-700 mt-1">🔴 Critiques</p>
          <p className="text-xs text-red-500 mt-0.5">santé &lt; 40</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{atRisk.length}</p>
          <p className="text-sm font-medium text-amber-700 mt-1">🟡 À risque</p>
          <p className="text-xs text-amber-500 mt-0.5">santé 40–70</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{healthy.length}</p>
          <p className="text-sm font-medium text-emerald-700 mt-1">🟢 Sains</p>
          <p className="text-xs text-emerald-500 mt-0.5">santé &gt; 70</p>
        </div>
      </div>

      {/* Projects needing attention */}
      {critical.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5 mb-6">
          <h2 className="font-semibold text-red-700 mb-4">⚠️ Projets nécessitant une attention immédiate</h2>
          <div className="space-y-3">
            {critical.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-red-600">{p.criticalBugs} bug(s) critique(s) · {p.completionRate}% complété</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">Santé {p.health}/100</span>
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All projects table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Tous les projets</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{['Projet','Santé','Avancement','Sprint actif'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/projects/${p.id}`}>
                <td className="px-4 py-3 font-medium text-slate-800 text-sm">{p.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.health >= 70 ? 'bg-emerald-100 text-emerald-700' : p.health >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {p.health}/100
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.completionRate}%` }} />
                    </div>
                    <span className="text-xs text-slate-600">{p.completionRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.activeSprint?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/portfolio" icon="📊" label="Portefeuille complet" />
        <ShortcutBtn to="/documents" icon="📄" label="Documents clients" color="bg-amber-600 hover:bg-amber-700" />
        <ShortcutBtn to="/resources" icon="👥" label="Ressources" color="bg-purple-600 hover:bg-purple-700" />
      </div>
    </div>
  );
}

/* ─── SCRUM MASTER ───────────────────────────────────────────── */
function ScrumMasterHome({ user }) {
  const [sprints, setSprints] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    Promise.all([
      projectsApi.getAll(),
      developersApi.getAll(),
    ]).then(async ([projs, devs]) => {
      setProjects(projs);
      setDevelopers(devs);
      const sprintArrays = await Promise.all(projs.map(p => sprintsApi.getByProject(p.id)));
      const allSprints = sprintArrays.flat().filter(s => s.status === 'ACTIVE');
      const sprWithProject = allSprints.map(s => ({
        ...s,
        projectName: projs.find(p => p.id?.toString() === s.project_id?.toString())?.name ?? '?',
      }));
      setSprints(sprWithProject);
    }).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <WelcomeBanner user={user} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sprints actifs" value={sprints.length} color="text-indigo-600" />
        <StatCard label="Développeurs" value={developers.length} color="text-emerald-600" />
        <StatCard label="Projets" value={projects.length} />
        <StatCard label="Sprints totaux" value={projects.reduce((acc, p) => acc + (p.sprints?.length ?? 0), 0)} color="text-slate-500" />
      </div>

      {/* Active sprints */}
      <div className="mb-8">
        <h2 className="font-semibold text-slate-800 mb-4">🏃 Sprints en cours ({sprints.length})</h2>
        {sprints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <p className="text-2xl mb-2">💤</p>
            <p>Aucun sprint actif en ce moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sprints.map(s => (
              <Link key={s.id} to={`/projects/${s.project_id}`}
                className="bg-white rounded-xl border border-indigo-200 p-5 hover:border-indigo-400 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">{s.projectName}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">ACTIF</span>
                </div>
                {s.objectives && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.objectives}</p>}
                {(s.start_date || s.end_date) && (
                  <p className="text-xs text-slate-400 mt-2">
                    {s.start_date && new Date(s.start_date).toLocaleDateString('fr-FR')}
                    {s.start_date && s.end_date && ' → '}
                    {s.end_date && new Date(s.end_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Team workload */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Charge de l'équipe</h2>
        <div className="space-y-3">
          {developers.map(dev => (
            <div key={dev.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: dev.color }}>{dev.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{dev.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                    ROLE_META[dev.role]?.color ?? 'bg-slate-100 text-slate-600'
                  }`}>{ROLE_META[dev.role]?.label ?? dev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/resources" icon="📅" label="Planification ressources" />
        {projects[0] && <ShortcutBtn to={`/projects/${projects[0].id}/poker`} icon="🃏" label="Planning Poker" color="bg-purple-600 hover:bg-purple-700" />}
        <ShortcutBtn to="/meetings" icon="📋" label="Rétrospectives / Réunions" color="bg-amber-600 hover:bg-amber-700" />
      </div>
    </div>
  );
}

/* ─── DEVELOPER ──────────────────────────────────────────────── */
function DevHome({ user }) {
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi.getAll({ developer_id: user.id })
      .then(r => setMyTasks(Array.isArray(r) ? r : r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const byStatus = (s) => myTasks.filter(t => t.status === s);
  const active = myTasks.filter(t => ['TODO','IN_PROGRESS','IN_REVIEW','TESTING'].includes(t.status));
  const done = byStatus('DONE');
  const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE');

  const PRIORITY_COLOR = { CRITICAL: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700', MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-slate-100 text-slate-600' };
  const STATUS_LABEL = { TODO: 'Todo', IN_PROGRESS: 'En cours', IN_REVIEW: 'En review', TESTING: 'Testing', DONE: 'Terminé', BACKLOG: 'Backlog' };
  const STATUS_DOT = { DONE: 'bg-emerald-500', IN_PROGRESS: 'bg-indigo-500', IN_REVIEW: 'bg-amber-500', TESTING: 'bg-orange-500', TODO: 'bg-blue-400', BACKLOG: 'bg-slate-300' };

  return (
    <div className="p-8">
      <WelcomeBanner user={user} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tâches actives" value={active.length} color="text-indigo-600" />
        <StatCard label="En cours" value={byStatus('IN_PROGRESS').length} color="text-blue-600" />
        <StatCard label="En retard" value={overdue.length} color={overdue.length > 0 ? 'text-red-600' : 'text-slate-800'} />
        <StatCard label="Terminées" value={done.length} color="text-emerald-600" />
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ {overdue.length} tâche(s) en retard</p>
          <div className="space-y-1">
            {overdue.map(t => (
              <Link key={t.id} to={`/tasks/${t.id}`}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {t.title} — échéance {new Date(t.deadline).toLocaleDateString('fr-FR')}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Mes tâches actives</h2>
          </div>
          {active.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm">Aucune tâche active — vous êtes à jour !</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {active.sort((a, b) => {
                const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
              }).map(t => (
                <Link key={t.id} to={`/tasks/${t.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                    <p className="text-xs text-slate-400">{STATUS_LABEL[t.status]}{t.deadline ? ` · Échéance ${new Date(t.deadline).toLocaleDateString('fr-FR')}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.hasCriticalBug && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">🐛 Bug</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                    {t.story_points && <span className="text-xs text-slate-400 font-mono">{t.story_points}SP</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/projects" icon="📋" label="Voir tous les projets" />
        <ShortcutBtn to="/notifications" icon="🔔" label="Mes notifications" color="bg-slate-700 hover:bg-slate-800" />
      </div>
    </div>
  );
}

/* ─── QA ─────────────────────────────────────────────────────── */
function QAHome({ user }) {
  const [reviewTasks, setReviewTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      tasksApi.getAll({ status: 'IN_REVIEW,TESTING' }),
      fetch('/api/bugs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
    ]).then(([tks, bgs]) => {
      setReviewTasks(Array.isArray(tks) ? tks : tks.data || []);
      setBugs(Array.isArray(bgs) ? bgs : []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const openBugs = bugs.filter(b => b.status === 'OPEN');
  const critBugs = openBugs.filter(b => b.severity === 'CRITICAL');
  const highBugs = openBugs.filter(b => b.severity === 'HIGH');
  const fixedBugs = bugs.filter(b => ['FIXED','CLOSED'].includes(b.status));
  const fixRate = bugs.length > 0 ? Math.round((fixedBugs.length / bugs.length) * 100) : 0;

  const SEV_COLOR = { CRITICAL: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700', MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-slate-100 text-slate-600' };

  return (
    <div className="p-8">
      <WelcomeBanner user={user} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="En révision" value={reviewTasks.filter(t => t.status === 'IN_REVIEW').length} color="text-amber-600" />
        <StatCard label="En test" value={reviewTasks.filter(t => t.status === 'TESTING').length} color="text-orange-600" />
        <StatCard label="Bugs critiques" value={critBugs.length} color={critBugs.length > 0 ? 'text-red-600' : 'text-slate-800'} />
        <StatCard label="Taux de résolution" value={`${fixRate}%`} color="text-emerald-600" sub={`${fixedBugs.length}/${bugs.length} bugs`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tasks to review/test */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Tâches à tester ({reviewTasks.length})</h2>
          </div>
          {loading ? <div className="h-32 animate-pulse bg-slate-50" /> : (
            reviewTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Aucune tâche à réviser</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {reviewTasks.map(t => (
                  <button key={t.id} onClick={() => navigate(`/tasks/${t.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-left">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.status === 'TESTING' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.status === 'TESTING' ? 'En test' : 'En révision'}{t.developer_name ? ` · ${t.developer_name}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Open bugs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Bugs ouverts ({openBugs.length})</h2>
          </div>
          {openBugs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">🎉 Aucun bug ouvert</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {openBugs.sort((a, b) => {
                const ord = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                return (ord[a.severity] ?? 4) - (ord[b.severity] ?? 4);
              }).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${SEV_COLOR[b.severity]}`}>{b.severity}</span>
                  <p className="text-sm text-slate-700 truncate flex-1">{b.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/projects" icon="🔬" label="Voir les projets" />
        <ShortcutBtn to="/notifications" icon="🔔" label="Mes notifications" color="bg-slate-700 hover:bg-slate-800" />
      </div>
    </div>
  );
}

/* ─── CLIENT ─────────────────────────────────────────────────── */
function ClientHome({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <WelcomeBanner user={user} />

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
        <p className="text-sm text-indigo-800">
          Bienvenue dans votre espace client. Vous pouvez suivre l'avancement des projets, consulter les jalons et accéder aux documents partagés.
        </p>
      </div>

      <h2 className="font-semibold text-slate-800 mb-4">Vos projets</h2>
      {loading ? <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" /> : (
        <div className="space-y-4 mb-8">
          {projects.map(p => {
            const done = p.stats?.doneTasks ?? 0;
            const total = p.stats?.totalTasks ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    {p.description && <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.status === 'ACTIVE' ? 'En cours' : 'Terminé'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-12 text-right">{pct}%</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span>{done}/{total} tâches terminées</span>
                  {p.deadline && <span>Deadline: {new Date(p.deadline).toLocaleDateString('fr-FR')}</span>}
                </div>
              </Link>
            );
          })}
          {projects.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-2xl mb-2">📂</p>
              <p>Aucun projet associé pour le moment</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <ShortcutBtn to="/documents" icon="📄" label="Documents partagés" />
        <ShortcutBtn to="/meetings" icon="📋" label="Comptes rendus" color="bg-amber-600 hover:bg-amber-700" />
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  switch (user.role) {
    case 'ADMIN':        return <AdminHome user={user} />;
    case 'PO':           return <POHome user={user} />;
    case 'SCRUM_MASTER': return <ScrumMasterHome user={user} />;
    case 'DEV':          return <DevHome user={user} />;
    case 'QA':           return <QAHome user={user} />;
    case 'CLIENT':       return <ClientHome user={user} />;
    default:             return <AdminHome user={user} />;
  }
}
