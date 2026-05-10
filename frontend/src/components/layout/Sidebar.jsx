import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { projectsApi, notificationsApi } from '../../services/api';
import { useAuth, ROLE_META } from '../../context/AuthContext';

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const ICONS = {
  projects:    'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  kanban:      'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  dashboard:   'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  developers:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  teams:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  meetings:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  documents:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  portfolio:   'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  resources:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  bell:        'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  gantt:       'M9 17V7m0 10H5m4 0h4m4-10v10m0 0h-4m4 0h2M5 7h14',
  calendar:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  milestone:   'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  risk:        'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  poker:       'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  logout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevron:     'M19 9l-7 7-7-7',
};

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

const subNavClass = ({ isActive }) =>
  `flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
    isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
  }`;

export default function Sidebar() {
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();

  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      notificationsApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleProject = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleMeta = user ? (ROLE_META[user.role] ?? { label: user.role, color: 'bg-slate-100 text-slate-600' }) : null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">DevTrack</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <NavLink to="/projects" end className={navClass}>
          <Icon path={ICONS.projects} />
          Projets
        </NavLink>

        {/* Portfolio — PO+ */}
        {can(['ADMIN','PO','SCRUM_MASTER']) && (
          <NavLink to="/portfolio" className={navClass}>
            <Icon path={ICONS.portfolio} />
            Portefeuille
          </NavLink>
        )}

        {/* Développeurs — masqué pour CLIENT */}
        {can(['ADMIN', 'PO', 'SCRUM_MASTER', 'DEV', 'QA']) && (
          <NavLink to="/developers" className={navClass}>
            <Icon path={ICONS.developers} />
            Développeurs
          </NavLink>
        )}

        {/* Ressources */}
        {can(['ADMIN','PO','SCRUM_MASTER']) && (
          <NavLink to="/resources" className={navClass}>
            <Icon path={ICONS.resources} />
            Ressources
          </NavLink>
        )}

        {/* Équipes */}
        <NavLink to="/teams" className={navClass}>
          <Icon path={ICONS.teams} />
          Équipes
        </NavLink>

        {/* Réunions */}
        <NavLink to="/meetings" className={navClass}>
          <Icon path={ICONS.meetings} />
          Réunions
        </NavLink>

        {/* Documents */}
        <NavLink to="/documents" className={navClass}>
          <Icon path={ICONS.documents} />
          Documents
        </NavLink>

        {/* ── QUALITÉ & PILOTAGE ── */}
        <p className="px-3 mt-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualité & Pilotage</p>

        <NavLink to="/test-plans" className={navClass}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          Plans de Test
        </NavLink>

        <NavLink to="/risks" className={navClass}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Risques
        </NavLink>

        <NavLink to="/milestones" className={navClass}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
          Jalons
        </NavLink>

        <NavLink to="/metrics" className={navClass}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Métriques Code
        </NavLink>


        {/* Notifications */}
        <NavLink to="/notifications" className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-sm font-medium transition-colors ${
            isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}>
          <div className="relative">
            <Icon path={ICONS.bell} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>

        {/* Projects list */}
        {projects.length > 0 && (
          <div className="mt-6">
            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mes Projets</p>
            {projects.filter(p => p.status === 'ACTIVE').map(project => (
              <div key={project.id}>
                <button
                  onClick={() => toggleProject(project.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  <span className="truncate flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    {project.name}
                  </span>
                  <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${expanded[project.id] ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.chevron} />
                  </svg>
                </button>

                {expanded[project.id] && (
                  <div className="ml-4 mt-1 mb-1 border-l border-slate-700 pl-3 space-y-0.5">
                    <NavLink to={`/projects/${project.id}/dashboard`} className={subNavClass}>
                      <Icon path={ICONS.dashboard} className="w-3.5 h-3.5" />
                      Dashboard
                    </NavLink>
                    <NavLink to={`/projects/${project.id}/kanban`} className={subNavClass}>
                      <Icon path={ICONS.kanban} className="w-3.5 h-3.5" />
                      Kanban
                    </NavLink>
                    <NavLink to={`/projects/${project.id}`} end className={subNavClass}>
                      <Icon path={ICONS.projects} className="w-3.5 h-3.5" />
                      Tâches
                    </NavLink>
                    <NavLink to={`/projects/${project.id}/gantt`} className={subNavClass}>
                      <Icon path={ICONS.gantt} className="w-3.5 h-3.5" />
                      Gantt
                    </NavLink>
                    <NavLink to={`/projects/${project.id}/calendar`} className={subNavClass}>
                      <Icon path={ICONS.calendar} className="w-3.5 h-3.5" />
                      Calendrier
                    </NavLink>
                    <NavLink to={`/projects/${project.id}/milestones`} className={subNavClass}>
                      <Icon path={ICONS.milestone} className="w-3.5 h-3.5" />
                      Jalons
                    </NavLink>
                    <NavLink to={`/projects/${project.id}/risks`} className={subNavClass}>
                      <Icon path={ICONS.risk} className="w-3.5 h-3.5" />
                      Risques
                    </NavLink>
                    {can(['ADMIN','PO','SCRUM_MASTER','DEV']) && (
                      <NavLink to={`/projects/${project.id}/poker`} className={subNavClass}>
                        <Icon path={ICONS.poker} className="w-3.5 h-3.5" />
                        Planning Poker
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer utilisateur */}
      <div className="px-4 py-3 border-t border-slate-800">
        {user && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: user.color || '#6366f1' }}>
              {user.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${roleMeta?.color}`}>
                {roleMeta?.label}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
          <Icon path={ICONS.logout} className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
