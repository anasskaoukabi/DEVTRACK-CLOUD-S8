import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { timeLogsApi } from '../../services/api';

export default function TimeLogs({ taskId, estimatedHours }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const loadLogs = async () => {
    try {
      const data = await timeLogsApi.getByTask(taskId);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hours || isNaN(hours) || Number(hours) <= 0) {
      toast.error('Veuillez entrer un nombre d\'heures valide');
      return;
    }
    
    try {
      await timeLogsApi.create({
        task_id: taskId,
        hours: Number(hours),
        description
      });
      toast.success('Temps loggé avec succès');
      setHours('');
      setDescription('');
      loadLogs();
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const totalLogged = logs.reduce((sum, log) => sum + log.hours, 0);
  const percentage = estimatedHours ? Math.min(100, Math.round((totalLogged / estimatedHours) * 100)) : 0;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <h2 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
        <span>Time Tracking</span>
        <span className="text-sm font-medium text-slate-500">
          {totalLogged}h {estimatedHours ? `/ ${estimatedHours}h` : 'loggées'}
        </span>
      </h2>

      {estimatedHours > 0 && (
        <div className="mb-4">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="number"
          step="0.25"
          min="0.25"
          placeholder="0.0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="text"
          placeholder="Description (ex: refactoring, review...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 transition-colors">
          Log
        </button>
      </form>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun temps loggé</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start justify-between text-sm py-2 border-b border-slate-50 last:border-0">
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">{log.hours}h <span className="font-normal text-slate-500 ml-1">{log.description}</span></span>
                <span className="text-xs text-slate-400">par {log.developer_name} le {new Date(log.logged_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
