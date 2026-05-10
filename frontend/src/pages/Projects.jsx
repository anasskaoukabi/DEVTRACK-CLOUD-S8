import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi } from '../services/api';
import Modal from '../components/common/Modal';
import ProjectForm from '../components/projects/ProjectForm';
import Can from '../components/common/Can';

function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const statusColors = { ACTIVE: 'bg-emerald-400', ARCHIVED: 'bg-slate-400' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[project.status] || 'bg-slate-400'}`} />
          <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/dashboard`); }}
            className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
            title="Dashboard">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/kanban`); }}
            className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
            title="Kanban">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <Can roles={['ADMIN']}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(project); }}
              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
              title="Supprimer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </Can>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Stack tags */}
      {project.stack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.stack.slice(0, 4).map(s => (
            <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-mono">{s}</span>
          ))}
          {project.stack.length > 4 && <span className="text-xs text-slate-400">+{project.stack.length - 4}</span>}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{project.doneTasks}/{project.totalTasks} tâches</span>
          <span>{project.completionRate}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${project.completionRate}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {project.criticalBugs > 0 && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {project.criticalBugs} bug(s) critique(s)
            </span>
          )}
          {project.deadline && (
            <span>Deadline: {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
          )}
        </div>
        <div className="flex -space-x-1.5">
          {project.developers?.slice(0, 4).map(d => (
            <div key={d.id} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
              style={{ backgroundColor: d.color }} title={d.name}>
              {d.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      const data = await projectsApi.getAll();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    await projectsApi.create(data);
    toast.success('Projet créé !');
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    await projectsApi.delete(deleteTarget.id);
    toast.success('Projet supprimé');
    setDeleteTarget(null);
    load();
  };

  const active = projects.filter(p => p.status === 'ACTIVE');
  const archived = projects.filter(p => p.status !== 'ACTIVE');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projets</h1>
          <p className="text-slate-500 text-sm mt-1">{active.length} projet(s) actif(s)</p>
        </div>
        <Can roles={['ADMIN', 'PO']}>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </button>
        </Can>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun projet</h3>
          <p className="text-slate-400 text-sm mb-6">Créez votre premier projet pour commencer</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Créer un projet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {active.map(p => <ProjectCard key={p.id} project={p} onDelete={setDeleteTarget} />)}
          </div>
          {archived.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Archivés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 opacity-60">
                {archived.map(p => <ProjectCard key={p.id} project={p} onDelete={setDeleteTarget} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau projet">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le projet" size="sm">
        <p className="text-slate-600 mb-6">
          Supprimer <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible et supprimera tous les sprints et tâches associés.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
