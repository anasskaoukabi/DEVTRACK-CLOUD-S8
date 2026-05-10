import React, { useState, useEffect } from 'react';
import { developersApi, tasksApi, projectsApi } from '../services/api';

const DAYS_LABEL = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const STATUS_COLORS = {
  DONE: 'bg-emerald-500', IN_PROGRESS: 'bg-indigo-500', IN_REVIEW: 'bg-amber-500',
  TESTING: 'bg-orange-500', TODO: 'bg-blue-400', BACKLOG: 'bg-slate-300',
};

function getWeekDates(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return a.toDateString() === new Date(b).toDateString();
}

export default function ResourcesPage() {
  const [developers, setDevelopers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    Promise.all([
      developersApi.getAll(),
      projectsApi.getAll(),
    ]).then(async ([devs, projs]) => {
      setDevelopers(devs);
      setProjects(projs);
      const taskArrays = await Promise.all(projs.map(p => tasksApi.getAll({ project_id: p.id })));
      const tasks = taskArrays.flatMap(r => Array.isArray(r) ? r : r.data || []);
      setAllTasks(tasks);
    }).finally(() => setLoading(false));
  }, []);

  const weekDays = getWeekDates(weekOffset);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[4];

  const filteredTasks = selectedProject
    ? allTasks.filter(t => t.project_id?.toString() === selectedProject)
    : allTasks;

  const getTasksForDevDay = (devId, day) =>
    filteredTasks.filter(t =>
      t.developer_id?.toString() === devId.toString() &&
      t.deadline && isSameDay(day, t.deadline)
    );

  const getWorkloadForDev = (devId) => {
    const active = filteredTasks.filter(t =>
      t.developer_id?.toString() === devId.toString() &&
      ['TODO','IN_PROGRESS','IN_REVIEW','TESTING'].includes(t.status)
    );
    return active.length;
  };

  const isToday = (day) => isSameDay(day, new Date());

  if (loading) return (
    <div className="p-8">
      <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ressources & Capacité</h1>
          <p className="text-slate-500 text-sm mt-1">Vue hebdomadaire de la charge de travail</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-slate-700 w-48 text-center">
            {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            {' — '}
            {weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Cette semaine
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{developers.length}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Développeurs</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {filteredTasks.filter(t => ['IN_PROGRESS','TODO'].includes(t.status)).length}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Tâches actives</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {developers.filter(d => getWorkloadForDev(d.id) >= 4).length}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Surchargés</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {developers.filter(d => getWorkloadForDev(d.id) === 0).length}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Disponibles</p>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '200px repeat(5, 1fr)' }}>
          <div className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide border-r border-slate-200">
            Développeur
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className={`px-3 py-3 text-center border-r border-slate-200 last:border-r-0 ${isToday(day) ? 'bg-indigo-50' : ''}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase">{DAYS_LABEL[i]}</p>
              <p className={`text-sm font-bold mt-0.5 ${isToday(day) ? 'text-indigo-600' : 'text-slate-700'}`}>
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        {developers.map(dev => {
          const workload = getWorkloadForDev(dev.id);
          const workloadColor = workload >= 5 ? 'text-red-600' : workload >= 3 ? 'text-amber-600' : 'text-emerald-600';
          return (
            <div key={dev.id} className="grid border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              style={{ gridTemplateColumns: '200px repeat(5, 1fr)' }}>
              <div className="px-4 py-3 border-r border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: dev.color }}>
                  {dev.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{dev.name}</p>
                  <p className={`text-xs font-semibold ${workloadColor}`}>{workload} tâches</p>
                </div>
              </div>
              {weekDays.map((day, i) => {
                const dayTasks = getTasksForDevDay(dev.id, day);
                return (
                  <div key={i} className={`px-2 py-2 border-r border-slate-100 last:border-r-0 min-h-16 ${isToday(day) ? 'bg-indigo-50/50' : ''}`}>
                    {dayTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-1 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[t.status]}`} />
                        <span className="text-xs text-slate-600 truncate leading-tight" title={t.title}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}

        {developers.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-400 text-sm">
            Aucun développeur enregistré
          </div>
        )}
      </div>

      {/* Workload chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Charge par développeur</h2>
        <div className="space-y-3">
          {developers.map(dev => {
            const workload = getWorkloadForDev(dev.id);
            const max = 8;
            const pct = Math.min((workload / max) * 100, 100);
            const barColor = workload >= 6 ? 'bg-red-500' : workload >= 4 ? 'bg-amber-500' : 'bg-indigo-500';
            return (
              <div key={dev.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: dev.color }}>
                  {dev.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dev.name}</span>
                    <span className="text-slate-400">{workload}/{max} tâches</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-semibold w-16 text-right ${pct >= 75 ? 'text-red-600' : pct >= 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full ${c}`} /> {s.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
