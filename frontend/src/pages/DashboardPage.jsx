import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Badge from '../components/common/Badge';

function StatCard({ label, value, sub, color = 'text-slate-800', icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="p-2.5 bg-slate-50 rounded-xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkloadBar({ developer }) {
  const max = 5;
  const pct = Math.min((developer.active_tasks / max) * 100, 100);
  const color = developer.active_tasks >= max ? 'bg-red-500' : developer.active_tasks >= 3 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: developer.color }}>
        {developer.name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-700">{developer.name}</span>
          <span className="text-slate-400">{developer.active_tasks} tâches actives</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [dash, proj] = await Promise.all([
      projectsApi.getDashboard(id),
      projectsApi.getOne(id),
    ]);
    setDashboard(dash);
    setProject(proj);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="p-8">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
      </div>
    </div>
  );

  const { completionRate, doneTasks, remainingTasks, totalTasks, openBugs, criticalBugs, velocity, activeSprint, burndown, workload } = dashboard;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
        <span>/</span>
        <Link to={`/projects/${id}`} className="hover:text-indigo-600">{project?.name}</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Dashboard</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{project?.name} — Dashboard</h1>
        <div className="flex gap-2">
          <Link to={`/projects/${id}`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Tâches
          </Link>
          <Link to={`/projects/${id}/kanban`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Kanban
          </Link>
        </div>
      </div>

      {/* Critical bugs alert */}
      {criticalBugs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-800 text-sm">{criticalBugs.length} bug(s) critique(s) ouvert(s)</p>
            <div className="mt-2 space-y-1">
              {criticalBugs.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <Badge type="bugStatus" value={b.status} />
                  <span className="text-sm text-red-700">{b.title}</span>
                  <span className="text-xs text-red-400">— {b.task_title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Taux de complétion"
          value={`${completionRate}%`}
          sub={`${doneTasks} / ${totalTasks} tâches`}
          color="text-indigo-600"
          icon={<svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Tâches restantes"
          value={remainingTasks}
          sub="hors DONE"
          color="text-amber-600"
          icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Bugs ouverts"
          value={openBugs}
          sub={criticalBugs.length > 0 ? `dont ${criticalBugs.length} critique(s)` : 'aucun critique'}
          color={openBugs > 0 ? 'text-red-600' : 'text-emerald-600'}
          icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Vélocité sprint"
          value={velocity}
          sub={activeSprint ? `Sprint: ${activeSprint.name}` : 'aucun sprint actif'}
          color="text-emerald-600"
          icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burndown chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">
            Burndown Chart
            {activeSprint && <span className="ml-2 text-sm font-normal text-slate-400">{activeSprint.name}</span>}
          </h2>
          {burndown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={burndown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v, name) => [v !== null ? `${v} SP` : '—', name === 'ideal' ? 'Idéal' : 'Réel']}
                />
                <Legend formatter={v => v === 'ideal' ? 'Idéal' : 'Réel'} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="ideal" stroke="#c7d2fe" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Aucun sprint actif pour afficher le burndown
            </div>
          )}
        </div>

        {/* Workload */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Charge équipe</h2>
          {workload.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun développeur assigné</p>
          ) : (
            <div className="space-y-4">
              {workload.map(dev => <WorkloadBar key={dev.id} developer={dev} />)}
            </div>
          )}

          {/* Progress ring */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate} ${100 - completionRate}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{completionRate}%</span>
                <span className="text-xs text-slate-400">complété</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint details */}
      {activeSprint && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Sprint actif — {activeSprint.name}</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Période</p>
              <p className="font-medium text-slate-700">
                {activeSprint.start_date ? new Date(activeSprint.start_date).toLocaleDateString('fr-FR') : '—'}
                {' → '}
                {activeSprint.end_date ? new Date(activeSprint.end_date).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Objectifs</p>
              <p className="text-slate-700">{activeSprint.objectives || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Vélocité actuelle</p>
              <p className="font-bold text-indigo-600 text-lg">{velocity} SP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
