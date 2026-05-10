import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [], bugs: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], bugs: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setResults({ projects: [], tasks: [], bugs: [] });
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (type, item) => {
    setIsOpen(false);
    if (type === 'PROJECT') {
      navigate(`/projects/${item.id}`);
    } else if (type === 'TASK') {
      navigate(`/tasks/${item.id}`);
    } else if (type === 'BUG') {
      navigate(`/tasks/${item.task_id}`); // navigate to task containing bug for now
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 w-full px-4 py-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
            placeholder="Search projects, tasks, and bugs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-6 py-4 text-sm text-slate-500 flex justify-center">
              Searching...
            </div>
          )}

          {!loading && query && results.projects.length === 0 && results.tasks.length === 0 && results.bugs.length === 0 && (
            <div className="px-6 py-14 text-center text-sm sm:px-14">
              <p className="text-slate-900 font-medium">No results found</p>
              <p className="text-slate-500 mt-1">We couldn't find anything matching "{query}"</p>
            </div>
          )}

          {!loading && (results.projects.length > 0 || results.tasks.length > 0 || results.bugs.length > 0) && (
            <ul className="py-2 text-sm text-slate-700">
              {results.projects.length > 0 && (
                <li className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase tracking-wider">Projects</li>
              )}
              {results.projects.map((p) => (
                <li 
                  key={`p-${p.id}`}
                  className="px-6 py-3 cursor-pointer hover:bg-indigo-50 flex items-center group"
                  onClick={() => handleSelect('PROJECT', p)}
                >
                  <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 group-hover:bg-indigo-200">
                    P
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{p.name}</span>
                    <span className="text-xs text-slate-500 truncate w-96">{p.description}</span>
                  </div>
                </li>
              ))}

              {results.tasks.length > 0 && (
                <li className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase tracking-wider mt-2">Tasks</li>
              )}
              {results.tasks.map((t) => (
                <li 
                  key={`t-${t.id}`}
                  className="px-6 py-3 cursor-pointer hover:bg-indigo-50 flex items-center group"
                  onClick={() => handleSelect('TASK', t)}
                >
                  <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 group-hover:bg-emerald-200 text-xs font-bold">
                    T{t.id}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{t.title}</span>
                    <span className="text-xs text-slate-500">in {t.project_name} • <span className="uppercase text-xs font-semibold">{t.status.replace('_', ' ')}</span></span>
                  </div>
                </li>
              ))}

              {results.bugs.length > 0 && (
                <li className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase tracking-wider mt-2">Bugs</li>
              )}
              {results.bugs.map((b) => (
                <li 
                  key={`b-${b.id}`}
                  className="px-6 py-3 cursor-pointer hover:bg-indigo-50 flex items-center group"
                  onClick={() => handleSelect('BUG', b)}
                >
                  <span className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-200">
                    B
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{b.title}</span>
                    <span className="text-xs text-slate-500 truncate w-96">{b.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {!query && (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Type to start searching across all your projects, tasks, and bugs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
