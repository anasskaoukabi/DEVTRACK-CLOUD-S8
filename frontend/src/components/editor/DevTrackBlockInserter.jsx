import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DOC_TYPES = [
  { value: 'cahier-des-charges', label: '📋 Cahier des Charges', scope: 'project' },
  { value: 'fiche-fonctionnelle', label: '📊 Fiche Fonctionnelle', scope: 'project' },
  { value: 'rapport-bugs', label: '🐛 Rapport de Bugs', scope: 'project' },
  { value: 'rapport-temps', label: '⏱️ Rapport de Temps', scope: 'project' },
  { value: 'fiche-technique', label: '⚙️ Fiche Technique', scope: 'task' },
  { value: 'pv-sprint', label: '📝 PV de Sprint', scope: 'sprint' },
  { value: 'release-notes', label: '🚀 Release Notes', scope: 'sprint' },
];

export default function DevTrackBlockInserter({ editor, projects = [], sprints = [], tasks = [], currentType, currentProjectId, currentSprintId, currentTaskId, onPreFill }) {
  const [loading, setLoading] = useState(null);

  const insertBlock = (content) => {
    if (!editor) return;
    editor.chain().focus().insertContent(content).run();
  };

  const insertTeamBlock = () => {
    const proj = projects.find(p => String(p._id || p.id) === currentProjectId);
    const devs = proj?.developers || [];
    if (devs.length === 0) { toast.error('Aucun développeur trouvé dans ce projet.'); return; }
    const content = {
      type: 'bulletList',
      content: devs.map(d => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `${d.name} — ${d.role || 'DEV'} (${d.email || ''})` }] }]
      }))
    };
    insertBlock(content);
    toast.success('Équipe insérée !');
  };

  const insertTasksTable = () => {
    const projectTasks = tasks.filter(t => String(t.project_id) === currentProjectId);
    if (projectTasks.length === 0) { toast.error('Aucune tâche dans ce projet.'); return; }
    
    const table = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: ['Tâche', 'Type', 'Priorité', 'Statut', 'SP'].map(h => ({
            type: 'tableHeader',
            attrs: { colspan: 1, rowspan: 1 },
            content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: h }] }]
          }))
        },
        ...projectTasks.map(t => ({
          type: 'tableRow',
          content: [t.title, t.type, t.priority, t.status, String(t.story_points || '—')].map(cell => ({
            type: 'tableCell',
            attrs: { colspan: 1, rowspan: 1 },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }]
          }))
        }))
      ]
    };
    insertBlock(table);
    toast.success(`${projectTasks.length} tâches insérées !`);
  };

  const insertSprintBlock = () => {
    if (!currentSprintId) { toast.error('Sélectionnez un sprint d\'abord.'); return; }
    const sprint = sprints.find(s => String(s._id || s.id) === currentSprintId);
    if (!sprint) return;
    const content = [
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: `Sprint : ${sprint.name}` }] },
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Objectifs : ' }, { type: 'text', text: sprint.objectives || 'Non définis' }] },
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Dates : ' }, { type: 'text', text: `${sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('fr-FR') : '—'} → ${sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('fr-FR') : '—'}` }] },
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Statut : ' }, { type: 'text', text: sprint.status }] },
    ];
    content.forEach(node => insertBlock(node));
    toast.success('Bloc sprint inséré !');
  };

  const insertSignatureBlock = () => {
    const content = [
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Signatures' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'SCRUM MASTER : ___________________________' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'PRODUCT OWNER : ___________________________' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'CLIENT : ___________________________' }] },
    ];
    content.forEach(node => insertBlock(node));
    toast.success('Bloc signatures inséré !');
  };

  const insertPageBreakMarker = () => {
    insertBlock({ type: 'horizontalRule' });
    insertBlock({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: '↓ Nouvelle section' }] });
  };

  const blocks = [
    { label: '👥 Équipe du projet', action: insertTeamBlock, disabled: !currentProjectId },
    { label: '📋 Tableau des tâches', action: insertTasksTable, disabled: !currentProjectId },
    { label: '🏃 Infos Sprint', action: insertSprintBlock, disabled: !currentSprintId },
    { label: '✍️ Bloc Signatures', action: insertSignatureBlock },
    { label: '── Séparateur de section', action: insertPageBreakMarker },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Insérer un bloc</h3>
      <div className="space-y-1.5">
        {blocks.map((block, i) => (
          <button
            key={i}
            onClick={block.action}
            disabled={block.disabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
              ${block.disabled
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium'
              }`}
          >
            {block.label}
          </button>
        ))}
      </div>

      {onPreFill && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Pré-remplissage</h3>
          <button
            onClick={onPreFill}
            className="w-full px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Importer depuis DevTrack
          </button>
          <p className="text-xs text-slate-400 mt-1.5 text-center">Remplace le contenu par les données du projet</p>
        </div>
      )}
    </div>
  );
}
