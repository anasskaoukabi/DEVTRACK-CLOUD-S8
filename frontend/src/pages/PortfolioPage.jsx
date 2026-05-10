import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioApi } from '../services/api';

const LEVEL = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function HealthBadge({ score }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const label = score >= 70 ? 'Sain' : score >= 40 ? 'Attention' : 'Critique';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label} {score}/100</span>;
}

function StatGlobal({ label, value, color = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('health');
  const navigate = useNavigate();

  useEffect(() => {
    portfolioApi.get().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" /></div>;
  if (!data) return <div className="p-8 text-slate-400">Accès refusé ou erreur</div>;

  const { projects, globalStats } = data;

  const sorted = [...projects].sort((a, b) => {
    if (sortBy === 'health') return a.health - b.health;
    if (sortBy === 'completion') return b.completionRate - a.completionRate;
    if (sortBy === 'bugs') return b.criticalBugs - a.criticalBugs;
    return a.name.localeCompare(b.name);
  });

  const globalCompletion = globalStats.totalTasks > 0
    ? Math.round((globalStats.totalDone / globalStats.totalTasks) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portefeuille de projets</h1>
          <p className="text-slate-500 text-sm mt-1">Vue globale multi-projets</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Trier par</span>
          {['health','completion','bugs','name'].map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'health' ? 'Santé' : s === 'completion' ? 'Avancement' : s === 'bugs' ? 'Bugs' : 'Nom'}
            </button>
          ))}
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <StatGlobal label="Projets" value={globalStats.totalProjects} />
        <StatGlobal label="Actifs" value={globalStats.activeProjects} color="text-emerald-600" />
        <StatGlobal label="Tâches" value={globalStats.totalTasks} />
        <StatGlobal label="Terminées" value={`${globalCompletion}%`} color="text-indigo-600" />
        <StatGlobal label="Bugs critiques" value={globalStats.totalCriticalBugs} color={globalStats.totalCriticalBugs > 0 ? 'text-red-600' : 'text-slate-800'} />
        <StatGlobal label="Développeurs" value={globalStats.totalDevelopers} />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Projet','Santé','Avancement','Tâches','Bugs','Sprint actif','Équipe'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map(p => (
              <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                className="hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                      {p.deadline && <p className="text-xs text-slate-400">Deadline: {new Date(p.deadline).toLocaleDateString('fr-FR')}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><HealthBadge score={p.health} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.completionRate}%` }} />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{p.completionRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.doneTasks}/{p.totalTasks}</td>
                <td className="px-4 py-3">
                  {p.criticalBugs > 0
                    ? <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{p.criticalBugs} critiques</span>
                    : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.activeSprint?.name ?? <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {p.developers?.slice(0, 4).map(d => (
                      <div key={d._id} title={d.name}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: d.color }}>
                        {d.name.charAt(0)}
                      </div>
                    ))}
                    {p.developers?.length > 4 && <span className="text-xs text-slate-400 ml-1">+{p.developers.length - 4}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
