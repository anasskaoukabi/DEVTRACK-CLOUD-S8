import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  TASK_ASSIGNED:  { icon: '👤', color: 'bg-indigo-50 border-indigo-200',  label: 'Assignation' },
  TASK_STATUS:    { icon: '🔄', color: 'bg-blue-50 border-blue-200',      label: 'Statut' },
  BUG_CRITICAL:   { icon: '🐛', color: 'bg-red-50 border-red-200',        label: 'Bug critique' },
  SPRINT_STARTED: { icon: '▶', color: 'bg-emerald-50 border-emerald-200', label: 'Sprint démarré' },
  SPRINT_ENDED:   { icon: '■', color: 'bg-slate-50 border-slate-200',     label: 'Sprint terminé' },
  MENTION:        { icon: '@',  color: 'bg-purple-50 border-purple-200',   label: 'Mention' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    toast.success('Tout marqué comme lu');
  };

  const remove = async (id) => {
    await notificationsApi.delete(id);
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const handleClick = async (notif) => {
    if (!notif.read) await markRead(notif.id);
    if (notif.entity_type === 'task' && notif.entity_id) navigate(`/tasks/${notif.entity_id}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="p-8">
      <div className="space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">{unreadCount} non lue(s)</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium text-slate-600">Aucune notification</p>
          <p className="text-sm mt-1">Vous êtes à jour !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const meta = TYPE_META[notif.type] ?? { icon: '•', color: 'bg-slate-50 border-slate-200', label: notif.type };
            return (
              <div key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${meta.color} ${notif.read ? 'opacity-70' : 'shadow-sm'}`}
                onClick={() => handleClick(notif)}>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 border border-slate-200 shadow-xs">
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{meta.label}</span>
                    {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-slate-800 font-medium">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.read && (
                    <button onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                      className="p-1.5 rounded-lg hover:bg-white/70 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Marquer comme lu">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); remove(notif.id); }}
                    className="p-1.5 rounded-lg hover:bg-white/70 text-slate-400 hover:text-red-500 transition-colors"
                    title="Supprimer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
