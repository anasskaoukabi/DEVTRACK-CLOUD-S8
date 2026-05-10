import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksApi, milestonesApi, sprintsApi, projectsApi } from '../services/api';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_DOT = {
  DONE: 'bg-emerald-500', IN_PROGRESS: 'bg-indigo-500', IN_REVIEW: 'bg-amber-500',
  TESTING: 'bg-orange-500', TODO: 'bg-blue-400', BACKLOG: 'bg-slate-400',
};

export default function CalendarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [today] = useState(new Date());
  const [current, setCurrent] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  useEffect(() => {
    Promise.all([
      projectsApi.getOne(id),
      tasksApi.getAll({ project_id: id }),
      milestonesApi.getByProject(id),
      sprintsApi.getByProject(id),
    ]).then(([proj, tks, mls, sps]) => {
      setProject(proj);
      setTasks(Array.isArray(tks) ? tks : tks.data || []);
      setMilestones(mls);
      setSprints(sps);
    });
  }, [id]);

  const getDaysInMonth = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() + 6) % 7; // Monday = 0
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const isSameDay = (a, b) => a && b && a.toDateString() === new Date(b).toDateString();

  const getItemsForDay = (day) => {
    if (!day) return { tasks: [], milestones: [], sprintStarts: [], sprintEnds: [] };
    return {
      tasks: tasks.filter(t => t.deadline && isSameDay(day, t.deadline)),
      milestones: milestones.filter(m => isSameDay(day, m.date)),
      sprintStarts: sprints.filter(s => s.start_date && isSameDay(day, s.start_date)),
      sprintEnds: sprints.filter(s => s.end_date && isSameDay(day, s.end_date)),
    };
  };

  const days = getDaysInMonth(current.year, current.month);
  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-indigo-600">{project?.name}</Link>
            <span>/</span>
            <span className="text-slate-600">Calendrier</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Calendrier</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-semibold text-slate-800 w-40 text-center">{MONTHS[current.month]} {current.year}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => setCurrent({ year: today.getFullYear(), month: today.getMonth() })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Aujourd'hui
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const items = getItemsForDay(day);
            const isToday = isSameDay(day, today);
            const hasItems = items.tasks.length + items.milestones.length + items.sprintStarts.length + items.sprintEnds.length > 0;

            return (
              <div key={i} className={`min-h-24 p-1.5 border-b border-r border-slate-100 ${!day ? 'bg-slate-50' : isToday ? 'bg-indigo-50' : 'hover:bg-slate-50'} transition-colors`}>
                {day && (
                  <>
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {items.sprintStarts.map(s => (
                        <div key={`start-${s.id}`} className="text-xs bg-indigo-100 text-indigo-700 rounded px-1 truncate font-medium">
                          ▶ {s.name}
                        </div>
                      ))}
                      {items.sprintEnds.map(s => (
                        <div key={`end-${s.id}`} className="text-xs bg-slate-100 text-slate-600 rounded px-1 truncate">
                          ■ Fin: {s.name}
                        </div>
                      ))}
                      {items.milestones.map(m => (
                        <div key={m.id} className="text-xs bg-amber-100 text-amber-700 rounded px-1 truncate font-medium">
                          🏁 {m.name}
                        </div>
                      ))}
                      {items.tasks.slice(0, 3).map(t => (
                        <div key={t.id} onClick={() => navigate(`/tasks/${t.id}`)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 cursor-pointer rounded px-1 hover:bg-indigo-50 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                          {t.title}
                        </div>
                      ))}
                      {items.tasks.length > 3 && (
                        <div className="text-xs text-slate-400 px-1">+{items.tasks.length - 3} autres</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 bg-indigo-100 rounded" /> Début sprint</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 bg-slate-100 rounded" /> Fin sprint</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 bg-amber-100 rounded" /> Jalon</div>
        {Object.entries(STATUS_DOT).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${c}`} /> {s}
          </div>
        ))}
      </div>
    </div>
  );
}
