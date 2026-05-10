import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi, sprintsApi, tasksApi } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import SprintForm from '../components/sprints/SprintForm';

function TaskRow({ task, onClick }) {
  return (
    <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => onClick(task.id)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {task.hasCriticalBug && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Bug critique" />}
          <span className="text-sm font-medium text-slate-800 hover:text-indigo-600">#{task.id} {task.title}</span>
        </div>
      </td>
      <td className="px-4 py-3"><Badge type="type" value={task.type} /></td>
      <td className="px-4 py-3"><Badge type="priority" value={task.priority} /></td>
      <td className="px-4 py-3"><Badge type="status" value={task.status} /></td>
      <td className="px-4 py-3 text-sm text-slate-500 text-center">{task.story_points ?? '—'}</td>
      <td className="px-4 py-3">
        {task.developer_name ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: task.developer_color || '#6366f1' }}>
              {task.developer_name.charAt(0)}
            </div>
            <span className="text-sm text-slate-600">{task.developer_name}</span>
          </div>
        ) : <span className="text-slate-300 text-sm">—</span>}
      </td>
    </tr>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [filter, setFilter] = useState({ status: '', priority: '', type: '', sprint: '' });

  const load = useCallback(async () => {
    try {
      const data = await projectsApi.getOne(id);
      setProject(data);
    } catch {
      toast.error('Projet introuvable');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCreateTask = async (data) => {
    await tasksApi.create({ ...data, project_id: id });
    toast.success('Tâche créée !');
    setShowTaskForm(false);
    load();
  };

  const handleCreateSprint = async (data) => {
    await sprintsApi.create({ ...data, project_id: id });
    toast.success('Sprint créé !');
    setShowSprintForm(false);
    load();
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
    </div>
  );

  if (!project) return null;

  const filteredTasks = project.tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.type && t.type !== filter.type) return false;
    if (filter.sprint) {
      if (filter.sprint === 'none' && t.sprint_id) return false;
      if (filter.sprint !== 'none' && t.sprint_id !== filter.sprint) return false;
    }
    return true;
  });

  const activeSprint = project.sprints.find(s => s.status === 'ACTIVE');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
            <span>/</span>
            <span className="text-slate-600">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            {project.stack.map(s => (
              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-mono">{s}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/projects/${id}/dashboard`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Dashboard
          </Link>
          <Link to={`/projects/${id}/kanban`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Kanban
          </Link>
          <Link to={`/projects/${id}/gantt`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Gantt
          </Link>
          <Link to={`/projects/${id}/calendar`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Calendrier
          </Link>
          <Link to={`/projects/${id}/milestones`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Jalons
          </Link>
          <Link to={`/projects/${id}/risks`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Risques
          </Link>
          <Link to={`/projects/${id}/poker`} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Poker
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tâches totales', value: project.stats.totalTasks, color: 'text-slate-700' },
          { label: 'Terminées', value: project.stats.doneTasks, color: 'text-emerald-600' },
          { label: 'Restantes', value: project.stats.remainingTasks, color: 'text-amber-600' },
          { label: 'Bugs ouverts', value: project.stats.openBugs, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sprints */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Sprints</h2>
          <button onClick={() => setShowSprintForm(true)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            + Nouveau sprint
          </button>
        </div>
        {project.sprints.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucun sprint — créez le premier !</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.sprints.map(sprint => (
              <div key={sprint.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge type="status" value={sprint.status} />
                  <span className="font-medium text-sm text-slate-800">{sprint.name}</span>
                  {sprint.start_date && (
                    <span className="text-xs text-slate-400">
                      {new Date(sprint.start_date).toLocaleDateString('fr-FR')} → {new Date(sprint.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {sprint.velocity > 0 && <span className="text-indigo-600 font-medium">{sprint.velocity} SP vélocité</span>}
                  {sprint.objectives && <span className="truncate max-w-xs hidden lg:block">{sprint.objectives}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Tâches ({filteredTasks.length})</h2>
          <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouvelle tâche
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-5 py-3 border-b border-slate-100">
          {[
            { key: 'status', label: 'Statut', options: ['BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','TESTING','DONE'] },
            { key: 'priority', label: 'Priorité', options: ['LOW','MEDIUM','HIGH','URGENT'] },
            { key: 'type', label: 'Type', options: ['FEATURE','BUG','REFACTOR','TEST'] },
          ].map(f => (
            <select
              key={f.key}
              value={filter[f.key]}
              onChange={e => setFilter(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{f.label}</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {(filter.status || filter.priority || filter.type) && (
            <button onClick={() => setFilter({ status: '', priority: '', type: '', sprint: '' })} className="text-xs text-slate-400 hover:text-slate-600">
              Réinitialiser
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-400 text-center">Aucune tâche</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Tâche</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Priorité</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-center">SP</th>
                  <th className="px-4 py-3 text-left">Assigné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTasks.map(t => (
                  <TaskRow key={t.id} task={t} onClick={(id) => navigate(`/tasks/${id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} title="Nouvelle tâche" size="lg">
        <TaskForm
          projectId={id}
          sprints={project.sprints}
          developers={project.developers}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      </Modal>

      <Modal isOpen={showSprintForm} onClose={() => setShowSprintForm(false)} title="Nouveau sprint">
        <SprintForm onSubmit={handleCreateSprint} onCancel={() => setShowSprintForm(false)} />
      </Modal>
    </div>
  );
}
