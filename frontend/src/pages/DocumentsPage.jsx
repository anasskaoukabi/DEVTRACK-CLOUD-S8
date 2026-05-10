import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi, sprintsApi, tasksApi, documentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DOC_TYPES = [
  {
    id: 'cahier-des-charges',
    title: 'Cahier des Charges',
    emoji: '📋',
    description: 'Page de garde, périmètre fonctionnel, critères d\'acceptation, annexes bugs.',
    scope: 'project',
    roles: ['PO', 'ADMIN'],
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'fiche-fonctionnelle',
    title: 'Fiche Fonctionnelle',
    emoji: '📊',
    description: 'Vision produit, fonctionnalités par sprint, matrice de priorités, évolution des livraisons.',
    scope: 'project',
    roles: ['PO', 'ADMIN'],
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'rapport-bugs',
    title: 'Rapport de Bugs',
    emoji: '🐛',
    description: 'Résumé exécutif, tableau détaillé, analyse CRITICAL, tendance par sprint.',
    scope: 'project',
    roles: ['PO', 'ADMIN'],
    gradient: 'from-red-500 to-orange-500',
  },
  {
    id: 'rapport-temps',
    title: 'Rapport de Temps',
    emoji: '⏱️',
    description: 'Heures loggées par développeur, détail par tâche, heures estimées vs réelles.',
    scope: 'project',
    roles: ['ADMIN'],
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'fiche-technique',
    title: 'Fiche Technique',
    emoji: '⚙️',
    description: 'Description technique, historique des statuts, notes, bugs et time logs d\'une tâche.',
    scope: 'task',
    roles: ['DEV', 'PO', 'ADMIN'],
    gradient: 'from-slate-500 to-gray-600',
  },
  {
    id: 'pv-sprint',
    title: 'PV de Sprint',
    emoji: '📝',
    description: 'Résultats, vélocité, qualité, décisions et bloc signatures officiels.',
    scope: 'sprint',
    roles: ['PO', 'ADMIN'],
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'release-notes',
    title: 'Release Notes',
    emoji: '🚀',
    description: 'Nouvelles fonctionnalités, améliorations, corrections de bugs, problèmes connus.',
    scope: 'sprint',
    roles: ['PO', 'ADMIN'],
    gradient: 'from-pink-500 to-rose-600',
  },
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [generating, setGenerating] = useState(null);
  const [savedDocs, setSavedDocs] = useState([]);
  const [tab, setTab] = useState('auto'); // 'auto' | 'editor'

  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(console.error);
    api.get('/document-editor').then(r => setSavedDocs(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      sprintsApi.getByProject(selectedProject).then(setSprints).catch(console.error);
      tasksApi.getAll({ project_id: selectedProject }).then(setTasks).catch(console.error);
    } else {
      setSprints([]);
      setTasks([]);
      setSelectedSprint('');
      setSelectedTask('');
    }
  }, [selectedProject]);

  const canSee = (doc) => {
    if (!user) return false;
    return doc.roles.includes(user.role);
  };

  const handleDownload = async (docType, id, filename) => {
    if (!id) {
      toast.error('Veuillez sélectionner un projet / sprint / tâche');
      return;
    }
    setGenerating(docType.id);
    try {
      await documentsApi.download(docType.id, id, filename);
      toast.success(`${docType.title} généré avec succès !`);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Accès refusé — Vous n\'avez pas les droits pour ce document.');
      } else {
        toast.error(`Erreur lors de la génération : ${err.message}`);
      }
    } finally {
      setGenerating(null);
    }
  };

  const getActionFor = (doc) => {
    if (doc.scope === 'project') {
      const project = projects.find(p => String(p._id || p.id) === selectedProject);
      return {
        id: selectedProject,
        filename: `${doc.id}-${project?.name || 'projet'}.pdf`,
        label: 'Sélectionner un projet ci-dessus',
        ready: !!selectedProject,
      };
    }
    if (doc.scope === 'sprint') {
      const sprint = sprints.find(s => String(s._id || s.id) === selectedSprint);
      return {
        id: selectedSprint,
        filename: `${doc.id}-${sprint?.name || 'sprint'}.pdf`,
        label: 'Sélectionner un sprint ci-dessous',
        ready: !!selectedSprint,
      };
    }
    if (doc.scope === 'task') {
      const task = tasks.find(t => String(t._id || t.id) === selectedTask);
      return {
        id: selectedTask,
        filename: `fiche-technique-${task?.title?.substring(0, 30).replace(/\s+/g, '-') || 'tache'}.pdf`,
        label: 'Sélectionner une tâche ci-dessous',
        ready: !!selectedTask,
      };
    }
  };

  const projectDocs = DOC_TYPES.filter(d => d.scope === 'project');
  const sprintDocs = DOC_TYPES.filter(d => d.scope === 'sprint');
  const taskDocs = DOC_TYPES.filter(d => d.scope === 'task');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Documents</h1>
          <p className="text-slate-500">Générez automatiquement ou rédigez manuellement vos documents</p>
        </div>
        <Link
          to="/documents/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouveau document
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 rounded-xl p-1 mb-6 w-fit">
        {[['auto', '⚡ Génération auto'], ['editor', '✏️ Documents rédigés']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB : Génération auto */}
      {tab === 'auto' && (
        <>
          {/* Sélecteur de projet */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Contexte</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Projet</label>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Sélectionner un projet</option>
                  {projects.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Sprint (pour PV / Release Notes)</label>
                <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} disabled={!selectedProject}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                  <option value="">— Sélectionner un sprint</option>
                  {sprints.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name} {s.status === 'COMPLETED' ? '✓' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Tâche (pour Fiche Technique)</label>
                <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} disabled={!selectedProject}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                  <option value="">— Sélectionner une tâche</option>
                  {tasks.map(t => (
                    <option key={t._id || t.id} value={t._id || t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Section title="📁 Documents de Projet">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projectDocs.filter(canSee).map(doc => {
                const action = getActionFor(doc);
                return <DocumentCard key={doc.id} doc={doc} action={action} generating={generating === doc.id} onDownload={handleDownload} />;
              })}
            </div>
          </Section>
          <Section title="🏃 Documents de Sprint">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sprintDocs.filter(canSee).map(doc => {
                const action = getActionFor(doc);
                return <DocumentCard key={doc.id} doc={doc} action={action} generating={generating === doc.id} onDownload={handleDownload} />;
              })}
            </div>
          </Section>
          <Section title="🔧 Documents de Tâche">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskDocs.filter(canSee).map(doc => {
                const action = getActionFor(doc);
                return <DocumentCard key={doc.id} doc={doc} action={action} generating={generating === doc.id} onDownload={handleDownload} />;
              })}
            </div>
          </Section>
        </>
      )}

      {/* TAB : Documents rédigés */}
      {tab === 'editor' && (
        <div>
          {savedDocs.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-lg font-semibold mb-2">Aucun document rédigé</p>
              <p className="text-sm mb-6">Créez votre premier document avec l'éditeur riche</p>
              <Link to="/documents/new" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Créer un document
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDocs.map(doc => (
                <Link key={doc._id || doc.id} to={`/documents/edit/${doc._id || doc.id}`}
                  className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                      {{'cahier-des-charges':'📋','fiche-fonctionnelle':'📊','rapport-bugs':'🐛','rapport-temps':'⏱️','fiche-technique':'⚙️','pv-sprint':'📝','release-notes':'🚀','custom':'📄'}[doc.type] || '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{doc.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Modifié le {doc.updated_at ? new Date(doc.updated_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <span className="inline-block text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{doc.type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DocumentCard({ doc, action, generating, onDownload }) {
  const isReady = action?.ready;
  const isGenerating = generating;

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      {/* Gradient accent */}
      <div className={`h-1.5 bg-gradient-to-r ${doc.gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.gradient} flex items-center justify-center text-2xl shadow-sm`}>
            {doc.emoji}
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {doc.roles.map(r => (
              <span key={r} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{r}</span>
            ))}
          </div>
        </div>

        <h3 className="font-bold text-slate-800 mb-1">{doc.title}</h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{doc.description}</p>

        <button
          onClick={() => onDownload(doc, action?.id, action?.filename)}
          disabled={isGenerating || !isReady}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${isReady
              ? `bg-gradient-to-r ${doc.gradient} text-white shadow-sm hover:shadow-md hover:opacity-90`
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Génération...
            </>
          ) : isReady ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger PDF
            </>
          ) : (
            `Sélectionner un ${doc.scope === 'project' ? 'projet' : doc.scope === 'sprint' ? 'sprint' : 'tâche'}`
          )}
        </button>
      </div>
    </div>
  );
}
