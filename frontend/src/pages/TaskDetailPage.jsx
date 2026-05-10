import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tasksApi, bugsApi, commentsApi, projectsApi, attachmentsApi } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import BugForm from '../components/bugs/BugForm';
import TimeLogs from '../components/tasks/TimeLogs';

const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE'];
const STATUS_LABELS = {
  BACKLOG: 'Backlog', TODO: 'Todo', IN_PROGRESS: 'En cours',
  IN_REVIEW: 'En review', TESTING: 'Testing', DONE: 'Terminé',
};

function CommentItem({ comment, onDelete }) {
  const renderContent = (text) => {
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="text-indigo-600 font-semibold">{part}</span>
        : part
    );
  };
  return (
    <div className={`rounded-lg p-4 ${comment.is_technical_note ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {(comment.author || 'A').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-slate-800">{comment.author}</span>
          {comment.is_technical_note && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Note technique</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString('fr-FR')}</span>
          <button onClick={() => onDelete(comment.id)} className="text-slate-300 hover:text-red-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-700 ml-9 leading-relaxed">{renderContent(comment.content)}</p>
    </div>
  );
}

function SubtaskItem({ subtask, taskId, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 group">
      <input type="checkbox" checked={subtask.done} onChange={() => onToggle(subtask._id, !subtask.done)}
        className="rounded border-slate-300 text-indigo-600 cursor-pointer" />
      <span className={`flex-1 text-sm ${subtask.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
        {subtask.title}
      </span>
      <button onClick={() => onDelete(subtask._id)}
        className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function AttachmentItem({ attachment, onDelete }) {
  const isImage = attachment.mimetype?.startsWith('image/');
  const ext = attachment.originalname?.split('.').pop()?.toUpperCase() ?? 'FILE';
  const size = attachment.size ? (attachment.size / 1024).toFixed(1) + ' KB' : '';
  const url = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 group">
      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
        {isImage ? '🖼' : ext.slice(0, 4)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{attachment.originalname}</p>
        <p className="text-xs text-slate-400">{size}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <a href={url} target="_blank" rel="noreferrer"
          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
        <button onClick={() => onDelete(attachment.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 rounded">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBugForm, setShowBugForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isTechNote, setIsTechNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef();

  const load = useCallback(async () => {
    try {
      const t = await tasksApi.getOne(id);
      setTask(t);
      if (t.project_id) {
        const p = await projectsApi.getOne(t.project_id);
        setProject(p);
      }
      const atts = await attachmentsApi.getByTask(id);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch {
      toast.error('Tâche introuvable');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (status) => {
    if (status === task.status) return;
    setChangingStatus(true);
    try {
      await tasksApi.update(id, { status });
      toast.success(`Statut mis à jour: ${STATUS_LABELS[status]}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;
    await commentsApi.create({ task_id: id, author: commentAuthor, content: newComment, is_technical_note: isTechNote });
    toast.success('Commentaire ajouté');
    setNewComment('');
    setIsTechNote(false);
    load();
  };

  const handleDeleteComment = async (commentId) => {
    await commentsApi.delete(commentId);
    toast.success('Commentaire supprimé');
    load();
  };

  const handleCreateBug = async (data) => {
    await bugsApi.create({ ...data, task_id: id });
    toast.success('Bug signalé !');
    setShowBugForm(false);
    load();
  };

  const handleUpdateBug = async (bugId, data) => {
    await bugsApi.update(bugId, data);
    toast.success('Bug mis à jour');
    load();
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    await tasksApi.delete(id);
    toast.success('Tâche supprimée');
    navigate(`/projects/${task.project_id}`);
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await tasksApi.addSubtask(id, { title: newSubtask });
    toast.success('Sous-tâche ajoutée');
    setNewSubtask('');
    load();
  };

  const handleToggleSubtask = async (subId, done) => {
    await tasksApi.updateSubtask(id, subId, { done });
    load();
  };

  const handleDeleteSubtask = async (subId) => {
    await tasksApi.deleteSubtask(id, subId);
    load();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await attachmentsApi.upload(id, file);
      toast.success('Fichier joint');
      const atts = await attachmentsApi.getByTask(id);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attId) => {
    await attachmentsApi.delete(attId);
    setAttachments(a => a.filter(att => att.id !== attId));
    toast.success('Fichier supprimé');
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-4" />
    </div>
  );

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter(s => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/projects" className="hover:text-indigo-600">Projets</Link>
        {project && <>
          <span>/</span>
          <Link to={`/projects/${task.project_id}`} className="hover:text-indigo-600">{project.name}</Link>
        </>}
        <span>/</span>
        <span className="text-slate-600 font-medium">Tâche #{task.id}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900 flex-1 pr-4">{task.title}</h1>
          <button onClick={handleDeleteTask} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge type="type" value={task.type} />
          <Badge type="priority" value={task.priority} />
          <Badge type="status" value={task.status} />
          {task.story_points != null && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold font-mono">{task.story_points} SP</span>
          )}
          {task.estimated_hours && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{task.estimated_hours}h estimées</span>
          )}
          {/* Tags */}
          {task.tag_ids?.map(tag => (
            <span key={tag._id ?? tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color || '#6366f1' }}>
              {tag.name}
            </span>
          ))}
        </div>

        {task.description && (
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">{task.description}</p>
        )}

        {/* Blocked by */}
        {task.blocked_by?.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bloqué par
            </p>
            <div className="flex flex-wrap gap-2">
              {task.blocked_by.map(dep => (
                <Link key={dep._id ?? dep.id} to={`/tasks/${dep._id ?? dep.id}`}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-medium
                    ${dep.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {dep.status === 'DONE' ? '✓' : '⚠'} {dep.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">Assigné à</p>
            {task.developer_name ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: task.developer_color }}>
                  {task.developer_name.charAt(0)}
                </div>
                <span className="font-medium text-slate-700">{task.developer_name}</span>
              </div>
            ) : <span className="text-slate-400">—</span>}
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Deadline</p>
            <p className="font-medium text-slate-700">
              {task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Créée le</p>
            <p className="font-medium text-slate-700">{new Date(task.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Mise à jour</p>
            <p className="font-medium text-slate-700">{new Date(task.updated_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Status change */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-3 text-sm">Changer le statut</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} disabled={changingStatus} onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                s === task.status
                  ? 'bg-indigo-600 text-white cursor-default'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
              }`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Subtasks */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">
            Sous-tâches
            <span className="ml-2 text-sm font-normal text-slate-400">{doneSubtasks}/{subtasks.length}</span>
          </h2>
          {subtasks.length > 0 && (
            <span className="text-xs text-slate-500">{subtaskProgress}%</span>
          )}
        </div>
        {subtasks.length > 0 && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${subtaskProgress}%` }} />
          </div>
        )}
        <div className="space-y-0.5 mb-3">
          {subtasks.map(st => (
            <SubtaskItem key={st._id} subtask={st} taskId={id}
              onToggle={handleToggleSubtask} onDelete={handleDeleteSubtask} />
          ))}
          {subtasks.length === 0 && <p className="text-sm text-slate-400 px-3">Aucune sous-tâche</p>}
        </div>
        <form onSubmit={handleAddSubtask} className="flex gap-2">
          <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
            placeholder="Ajouter une sous-tâche..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={!newSubtask.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            Ajouter
          </button>
        </form>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Pièces jointes ({attachments.length})</h2>
          <label className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {uploading ? 'Envoi...' : 'Joindre un fichier'}
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune pièce jointe</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map(att => (
              <AttachmentItem key={att.id} attachment={att} onDelete={handleDeleteAttachment} />
            ))}
          </div>
        )}
      </div>

      {/* Bugs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Bugs liés ({task.bugs?.length || 0})</h2>
          <button onClick={() => setShowBugForm(true)} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Signaler un bug
          </button>
        </div>
        {task.bugs?.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun bug signalé</p>
        ) : (
          <div className="space-y-3">
            {task.bugs.map(bug => (
              <div key={bug.id} className={`rounded-lg border p-4 ${bug.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge type="severity" value={bug.severity} />
                    <Badge type="bugStatus" value={bug.status} />
                    <span className="font-medium text-sm text-slate-800">{bug.title}</span>
                  </div>
                </div>
                {bug.description && <p className="text-sm text-slate-600 mb-3">{bug.description}</p>}
                {bug.steps && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded p-2 font-mono mb-3 whitespace-pre-wrap">{bug.steps}</p>
                )}
                <div className="flex gap-2">
                  {['OPEN','IN_PROGRESS','FIXED','CLOSED'].map(s => (
                    <button key={s} onClick={() => handleUpdateBug(bug.id, { status: s })}
                      className={`text-xs px-2 py-1 rounded ${bug.status === s ? 'bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Tracking */}
      <TimeLogs taskId={task.id} estimatedHours={task.estimated_hours} />

      {/* Comments */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-4">Commentaires ({task.comments?.length || 0})</h2>
        <div className="space-y-3 mb-4">
          {task.comments?.map(c => (
            <CommentItem key={c.id} comment={c} onDelete={handleDeleteComment} />
          ))}
          {task.comments?.length === 0 && (
            <p className="text-sm text-slate-400">Aucun commentaire</p>
          )}
        </div>
        <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4">
          <div className="flex gap-3 mb-3">
            <input type="text" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
              placeholder="Votre nom"
              className="w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire... (utilisez @nom pour mentionner)"
              rows={2}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" required />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={isTechNote} onChange={e => setIsTechNote(e.target.checked)}
                className="rounded border-slate-300 text-amber-500" />
              Note technique
            </label>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Commenter
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      {task.history?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Historique des transitions</h2>
          <div className="space-y-2">
            {task.history.map(h => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-slate-400">{new Date(h.changed_at).toLocaleString('fr-FR')}</span>
                {h.from_status && <Badge type="status" value={h.from_status} />}
                {h.from_status && <span className="text-slate-300">→</span>}
                <Badge type="status" value={h.to_status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showBugForm} onClose={() => setShowBugForm(false)} title="Signaler un bug">
        <BugForm onSubmit={handleCreateBug} onCancel={() => setShowBugForm(false)} />
      </Modal>
    </div>
  );
}
