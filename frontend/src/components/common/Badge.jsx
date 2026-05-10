import React from 'react';

const STATUS_STYLES = {
  BACKLOG: 'bg-slate-100 text-slate-600',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  TESTING: 'bg-orange-100 text-orange-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const TYPE_STYLES = {
  FEATURE: 'bg-indigo-100 text-indigo-700',
  BUG: 'bg-red-100 text-red-700',
  REFACTOR: 'bg-cyan-100 text-cyan-700',
  TEST: 'bg-green-100 text-green-700',
};

const SEVERITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const BUG_STATUS_STYLES = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  FIXED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-500',
};

const LABELS = {
  BACKLOG: 'Backlog', TODO: 'Todo', IN_PROGRESS: 'En cours', IN_REVIEW: 'En review',
  TESTING: 'Test', DONE: 'Terminé', ACTIVE: 'Actif', COMPLETED: 'Complété', ARCHIVED: 'Archivé',
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent', CRITICAL: 'Critical',
  FEATURE: 'Feature', BUG: 'Bug', REFACTOR: 'Refactor', TEST: 'Test',
  OPEN: 'Ouvert', FIXED: 'Corrigé', CLOSED: 'Fermé',
};

export default function Badge({ type = 'status', value, className = '' }) {
  let style = '';
  if (type === 'status') style = STATUS_STYLES[value] || 'bg-slate-100 text-slate-600';
  else if (type === 'priority') style = PRIORITY_STYLES[value] || 'bg-slate-100 text-slate-600';
  else if (type === 'type') style = TYPE_STYLES[value] || 'bg-slate-100 text-slate-600';
  else if (type === 'severity') style = SEVERITY_STYLES[value] || 'bg-slate-100 text-slate-600';
  else if (type === 'bugStatus') style = BUG_STATUS_STYLES[value] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {LABELS[value] || value}
    </span>
  );
}
