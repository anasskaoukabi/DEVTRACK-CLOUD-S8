import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { EditorContent } from '@tiptap/react';
import toast from 'react-hot-toast';
import useRichEditor from '../components/editor/RichEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import DevTrackBlockInserter from '../components/editor/DevTrackBlockInserter';
import ShareModal from '../components/documents/ShareModal';
import { projectsApi, sprintsApi, tasksApi } from '../services/api';
import api from '../services/api';
import '../components/editor/RichEditor.css';

const DOC_TYPE_LABELS = {
  'cahier-des-charges': '📋 Cahier des Charges',
  'fiche-fonctionnelle': '📊 Fiche Fonctionnelle',
  'rapport-bugs': '🐛 Rapport de Bugs',
  'rapport-temps': '⏱️ Rapport de Temps',
  'fiche-technique': '⚙️ Fiche Technique',
  'pv-sprint': '📝 PV de Sprint',
  'release-notes': '🚀 Release Notes',
  'custom': '📄 Document personnalisé',
};

export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState('Nouveau document');
  const [docType, setDocType] = useState('custom');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [wordCount, setWordCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);

  const contentRef = useRef(null);
  const htmlRef = useRef('');
  const autoSaveTimer = useRef(null);
  const docIdRef = useRef(isNew ? null : id);

  const editor = useRichEditor({
    content: null,
    onChange: (json, html) => {
      htmlRef.current = html;
      setSaved(false);
      // Count words
      const text = editor?.getText() || '';
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      // Auto-save après 2s d'inactivité
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(json, html, true);
      }, 2000);
    }
  });

  // Charger les projets
  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(console.error);
  }, []);

  // Charger sprints + tâches quand projet change
  useEffect(() => {
    if (selectedProject) {
      sprintsApi.getByProject(selectedProject).then(setSprints).catch(console.error);
      tasksApi.getAll({ project_id: selectedProject }).then(setTasks).catch(console.error);
    } else {
      setSprints([]);
      setTasks([]);
    }
  }, [selectedProject]);

  // Charger le document existant
  useEffect(() => {
    if (!isNew && id && editor) {
      api.get(`/document-editor/${id}`)
        .then(r => {
          const doc = r.data;
          setDocMeta(doc);
          setCurrentDoc(doc);
          setTitle(doc.title);
          setDocType(doc.type);
          if (doc.project_id) setSelectedProject(String(doc.project_id._id || doc.project_id));
          if (doc.sprint_id) setSelectedSprint(String(doc.sprint_id));
          if (doc.task_id) setSelectedTask(String(doc.task_id));
          if (doc.content && Object.keys(doc.content).length > 0) {
            editor.commands.setContent(doc.content);
          }
          setLoading(false);
        })
        .catch(err => {
          toast.error('Document introuvable');
          navigate('/documents');
        });
    } else {
      setLoading(false);
    }
  }, [id, editor]);

  const handleSave = async (json, html, isAuto = false) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        title,
        content: json || editor?.getJSON(),
        html: html || htmlRef.current || editor?.getHTML(),
        project_id: selectedProject || null,
        sprint_id: selectedSprint || null,
        task_id: selectedTask || null,
      };

      if (docIdRef.current) {
        await api.put(`/document-editor/${docIdRef.current}`, payload);
      } else {
        const res = await api.post('/document-editor', { ...payload, type: docType });
        docIdRef.current = res.data._id || res.data.id;
        navigate(`/documents/edit/${docIdRef.current}`, { replace: true });
      }

      setSaved(true);
      if (!isAuto) toast.success('Document sauvegardé !');
    } catch (err) {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePreFill = async () => {
    const refId = docType === 'fiche-technique' ? selectedTask
      : (docType === 'pv-sprint' || docType === 'release-notes') ? selectedSprint
      : selectedProject;

    if (!refId) {
      toast.error('Sélectionnez d\'abord un projet/sprint/tâche');
      return;
    }

    const confirmed = !editor?.getText() || window.confirm('⚠️ Cela va remplacer le contenu actuel. Continuer ?');
    if (!confirmed) return;

    const toastId = toast.loading('Import depuis DevTrack…');
    try {
      const res = await api.post(`/document-editor/pre-fill/${docType}/${refId}`);
      editor.commands.setContent(res.data.content);
      toast.success('Document pré-rempli !', { id: toastId });
      setSaved(false);
    } catch (err) {
      toast.error('Erreur lors du pré-remplissage', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Chargement du document…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Panneau latéral gauche ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
        {/* Header panneau */}
        <div className="px-4 py-4 border-b border-slate-100">
          <Link to="/documents" className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 mb-3 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux documents
          </Link>
          <h2 className="font-semibold text-slate-800 text-sm truncate">{title}</h2>
          <span className="text-xs text-slate-400">{DOC_TYPE_LABELS[docType]}</span>
        </div>

        {/* Propriétés */}
        <div className="p-4 space-y-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Propriétés</h3>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} disabled={!isNew}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400">
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Projet lié</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">— Aucun</option>
              {projects.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sprint lié</label>
              <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Aucun</option>
                {sprints.map(s => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedProject && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tâche liée</label>
              <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Aucune</option>
                {tasks.map(t => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Blocs DevTrack */}
        <div className="p-4 flex-1">
          <DevTrackBlockInserter
            editor={editor}
            projects={projects}
            sprints={sprints}
            tasks={tasks}
            currentType={docType}
            currentProjectId={selectedProject}
            currentSprintId={selectedSprint}
            currentTaskId={selectedTask}
            onPreFill={handlePreFill}
          />
        </div>

        {/* Stats */}
        <div className="p-3 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-400">{wordCount} mots</span>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barre d'outils sticky */}
        <div className="flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-2">
          {/* Titre éditable */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setSaved(false); }}
            className="flex-1 text-base font-semibold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300 max-w-md"
            placeholder="Titre du document…"
          />
          {/* Statut sauvegarde */}
          <span className={`text-xs flex items-center gap-1.5 flex-shrink-0 ${saved ? 'text-emerald-600' : 'text-slate-400'}`}>
            {saving ? (
              <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>Sauvegarde…</>
            ) : saved ? (
              <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Sauvegardé</>
            ) : 'Non sauvegardé'}
          </span>
          <button
            onClick={() => handleSave()}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            Sauvegarder
          </button>
          {docIdRef.current && (
            <button
              onClick={() => setShowShare(true)}
              className="px-3 py-1.5 border border-indigo-300 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-colors flex-shrink-0 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Partager
            </button>
          )}
        </div>

        {/* Toolbar TipTap */}
        <EditorToolbar
          editor={editor}
          docId={docIdRef.current}
          docTitle={title}
        />

        {/* Zone d'édition */}
        <div className="flex-1 overflow-y-auto tiptap-content">
          <EditorContent editor={editor} />
        </div>
      </main>

      {showShare && docIdRef.current && (
        <ShareModal
          doc={{ ...(currentDoc || docMeta || {}), _id: docIdRef.current, title }}
          onClose={() => setShowShare(false)}
          onUpdated={(updated) => setCurrentDoc(updated)}
        />
      )}
    </div>
  );
}
