import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const COLUMN_STYLES = {
  BACKLOG: { header: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', label: 'Backlog' },
  TODO: { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400', label: 'Todo' },
  IN_PROGRESS: { header: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', label: 'En cours' },
  IN_REVIEW: { header: 'bg-purple-50 border-purple-200', dot: 'bg-purple-400', label: 'En review' },
  TESTING: { header: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400', label: 'Testing' },
  DONE: { header: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400', label: 'Terminé' },
};

export default function KanbanColumn({ status, tasks, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status] || COLUMN_STYLES.BACKLOG;

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${style.header} mb-1`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-sm font-semibold text-slate-700">{style.label}</span>
          <span className="text-xs bg-white/80 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{tasks.length}</span>
        </div>
        {status === 'BACKLOG' || status === 'TODO' ? (
          <button
            onClick={() => onAddTask(status)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Ajouter une tâche">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-2 rounded-b-xl border border-t-0 transition-colors space-y-2 ${
          isOver ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-100/50 border-slate-200'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-400 text-center py-4">Déposez une tâche ici</p>
          </div>
        )}
      </div>
    </div>
  );
}
