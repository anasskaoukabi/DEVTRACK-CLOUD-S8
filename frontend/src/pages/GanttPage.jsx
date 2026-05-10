import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, sprintsApi, tasksApi } from '../services/api';

const STATUS_COLORS = {
  DONE: '#10b981', IN_PROGRESS: '#6366f1', IN_REVIEW: '#f59e0b',
  TESTING: '#f97316', TODO: '#3b82f6', BACKLOG: '#94a3b8',
};

function dateToOffset(date, start, totalDays) {
  const d = new Date(date);
  const s = new Date(start);
  const diff = Math.max(0, (d - s) / (1000 * 60 * 60 * 24));
  return Math.min((diff / totalDays) * 100, 100);
}

function dateToWidth(startDate, endDate, projectStart, totalDays) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const days = Math.max(1, (e - s) / (1000 * 60 * 60 * 24));
  return Math.min((days / totalDays) * 100, 100);
}

export default function GanttPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | sprint | deadline

  useEffect(() => {
    Promise.all([
      projectsApi.getOne(id),
      sprintsApi.getByProject(id),
      tasksApi.getAll({ project_id: id }),
    ]).then(([proj, sps, tks]) => {
      setProject(proj);
      setSprints(sps);
      setTasks(Array.isArray(tks) ? tks : tks.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8"><div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" /></div>;

  // Compute timeline bounds
  const allDates = [
    ...sprints.filter(s => s.start_date).map(s => new Date(s.start_date)),
    ...sprints.filter(s => s.end_date).map(s => new Date(s.end_date)),
    ...tasks.filter(t => t.deadline).map(t => new Date(t.deadline)),
    project?.deadline ? new Date(project.deadline) : null,
  ].filter(Boolean);

  if (allDates.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Aucune date définie dans ce projet. Ajoutez des dates de début/fin aux sprints et des deadlines aux tâches pour afficher le Gantt.</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 2);
  const totalDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));

  // Generate week labels
  const weeks = [];
  const cur = new Date(minDate);
  while (cur <= maxDate) {
    weeks.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }

  const today = new Date();
  const todayOffset = dateToOffset(today, minDate, totalDays);

  const tasksToShow = filter === 'deadline'
    ? tasks.filter(t => t.deadline)
    : filter === 'sprint'
    ? tasks.filter(t => t.sprint_id)
    : tasks;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-indigo-600">{project?.name}</Link>
            <span>/</span>
            <span className="text-slate-600">Gantt</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Diagramme de Gantt</h1>
        </div>
        <div className="flex gap-2">
          {['all','sprint','deadline'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f === 'all' ? 'Tout' : f === 'sprint' ? 'Avec sprint' : 'Avec deadline'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {/* Timeline header */}
        <div className="border-b border-slate-200 flex">
          <div className="w-56 flex-shrink-0 px-4 py-2 text-xs font-semibold text-slate-400 border-r border-slate-200">Élément</div>
          <div className="flex-1 relative h-8">
            {weeks.map((w, i) => (
              <div key={i} className="absolute top-0 h-full flex items-center"
                style={{ left: `${dateToOffset(w, minDate, totalDays)}%` }}>
                <span className="text-xs text-slate-400 pl-1">{w.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
            {/* Today line */}
            <div className="absolute top-0 h-full border-l-2 border-red-400 border-dashed z-10"
              style={{ left: `${todayOffset}%` }} />
          </div>
        </div>

        {/* Sprints */}
        {sprints.filter(s => s.start_date && s.end_date).map(sprint => {
          const left = dateToOffset(sprint.start_date, minDate, totalDays);
          const width = dateToWidth(sprint.start_date, sprint.end_date, minDate, totalDays);
          const sprintTasks = tasksToShow.filter(t => t.sprint_id?.toString() === sprint._id?.toString() || t.sprint_id === sprint.id);

          return (
            <div key={sprint.id || sprint._id}>
              {/* Sprint row */}
              <div className="flex border-b border-slate-100 bg-slate-50">
                <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-slate-200 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">{sprint.name}</span>
                  <span className={`text-xs px-1.5 rounded ${sprint.status === 'COMPLETED' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                    {sprint.status === 'COMPLETED' ? 'Terminé' : 'Actif'}
                  </span>
                </div>
                <div className="flex-1 relative h-8 py-1.5">
                  <div className="absolute h-5 rounded bg-indigo-200 border border-indigo-300 flex items-center px-2"
                    style={{ left: `${left}%`, width: `${width}%` }}>
                    <span className="text-xs text-indigo-700 truncate font-medium">{sprint.name}</span>
                  </div>
                  <div className="absolute top-0 h-full border-l border-slate-200 opacity-30"
                    style={{ left: `${todayOffset}%` }} />
                </div>
              </div>

              {/* Tasks in sprint */}
              {sprintTasks.map(task => {
                if (!task.deadline) return (
                  <div key={task.id} className="flex border-b border-slate-50">
                    <div className="w-56 flex-shrink-0 px-6 py-1.5 border-r border-slate-200">
                      <span className="text-xs text-slate-500 truncate block">{task.title}</span>
                    </div>
                    <div className="flex-1 flex items-center px-2">
                      <span className="text-xs text-slate-300">Pas de deadline</span>
                    </div>
                  </div>
                );
                const taskLeft = dateToOffset(task.deadline, minDate, totalDays);
                return (
                  <div key={task.id} className="flex border-b border-slate-50 hover:bg-slate-50">
                    <div className="w-56 flex-shrink-0 px-6 py-1.5 border-r border-slate-200">
                      <span className="text-xs text-slate-600 truncate block">{task.title}</span>
                    </div>
                    <div className="flex-1 relative h-7 py-1">
                      <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow"
                        style={{ left: `calc(${taskLeft}% - 6px)`, top: '4px', backgroundColor: STATUS_COLORS[task.status] }}
                        title={`${task.title} — ${task.status}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Tasks without sprint */}
        {tasksToShow.filter(t => !t.sprint_id && t.deadline).length > 0 && (
          <div>
            <div className="flex border-b border-slate-100 bg-slate-50">
              <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Sans sprint</span>
              </div>
              <div className="flex-1" />
            </div>
            {tasksToShow.filter(t => !t.sprint_id && t.deadline).map(task => {
              const taskLeft = dateToOffset(task.deadline, minDate, totalDays);
              return (
                <div key={task.id} className="flex border-b border-slate-50 hover:bg-slate-50">
                  <div className="w-56 flex-shrink-0 px-4 py-1.5 border-r border-slate-200">
                    <span className="text-xs text-slate-600 truncate block">{task.title}</span>
                  </div>
                  <div className="flex-1 relative h-7 py-1">
                    <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow"
                      style={{ left: `calc(${taskLeft}% - 6px)`, top: '4px', backgroundColor: STATUS_COLORS[task.status] }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-xs text-slate-500">{s}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-0 h-3 border-l-2 border-red-400 border-dashed" />
            <span className="text-xs text-slate-500">Aujourd'hui</span>
          </div>
        </div>
      </div>
    </div>
  );
}
