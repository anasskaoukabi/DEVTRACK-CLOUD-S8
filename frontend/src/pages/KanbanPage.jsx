import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { tasksApi, projectsApi } from '../services/api';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskCard from '../components/kanban/TaskCard';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';

const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE'];

export default function KanbanPage() {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('BACKLOG');
  const [filter, setFilter] = useState({ developer_id: '', priority: '', type: '', sprint_id: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async () => {
    const [projectData, taskData] = await Promise.all([
      projectsApi.getOne(id),
      tasksApi.getAll({ project_id: id }),
    ]);
    setProject(projectData);
    setTasks(taskData);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const filteredTasks = tasks.filter(t => {
    if (filter.developer_id && t.developer_id !== filter.developer_id) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.type && t.type !== filter.type) return false;
    if (filter.sprint_id && t.sprint_id !== filter.sprint_id) return false;
    return true;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Determine new status: if over a column id (string), use it; if over a task, use that task's status
    let newStatus = null;
    if (STATUSES.includes(overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await tasksApi.update(taskId, { status: newStatus });
      toast.success(`Tâche déplacée vers ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Impossible de déplacer la tâche';
      toast.error(msg);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  };

  const handleAddTask = (status) => {
    setDefaultStatus(status);
    setShowTaskForm(true);
  };

  const handleCreateTask = async (data) => {
    await tasksApi.create({ ...data, project_id: id, status: defaultStatus });
    toast.success('Tâche créée !');
    setShowTaskForm(false);
    load();
  };

  if (!project) return (
    <div className="p-8">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-indigo-600">{project.name}</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Kanban</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          {project.developers?.length > 0 && (
            <select
              value={filter.developer_id}
              onChange={e => setFilter(f => ({ ...f, developer_id: e.target.value }))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Tous les devs</option>
              {project.developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select
            value={filter.priority}
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Toutes priorités</option>
            {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous types</option>
            {['FEATURE','BUG','REFACTOR','TEST'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            onClick={() => { setDefaultStatus('BACKLOG'); setShowTaskForm(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tâche
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status] || []}
                onAddTask={handleAddTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} overlay />}
          </DragOverlay>
        </DndContext>
      </div>

      <Modal isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} title="Nouvelle tâche" size="lg">
        <TaskForm
          projectId={id}
          sprints={project.sprints || []}
          developers={project.developers || []}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
          initial={{ status: defaultStatus }}
        />
      </Modal>
    </div>
  );
}
