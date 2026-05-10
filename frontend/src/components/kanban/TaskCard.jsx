import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';

const PRIORITY_DOT = {
  LOW: 'bg-slate-300',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-500',
};

const TYPE_ICON = {
  FEATURE: '✦',
  BUG: '⚡',
  REFACTOR: '↻',
  TEST: '✓',
};

export default function TaskCard({ task, overlay = false }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all select-none ${overlay ? 'shadow-xl rotate-1 border-indigo-300' : ''}`}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          navigate(`/tasks/${task.id}`);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-mono">#{task.id}</span>
          <span className="text-xs font-medium text-slate-500">{TYPE_ICON[task.type]}</span>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 leading-snug mb-2 line-clamp-2">{task.title}</p>

      {/* Bugs alert */}
      {task.hasCriticalBug && (
        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
          <span>⚠</span>
          <span>Bug critique</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <Badge type="type" value={task.type} />
          {task.story_points && (
            <span className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-mono">{task.story_points}SP</span>
          )}
        </div>
        {task.developer_name && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: task.developer_color || '#6366f1' }}
            title={task.developer_name}
          >
            {task.developer_name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}
