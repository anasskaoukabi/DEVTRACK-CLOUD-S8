import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { testPlansApi } from '../services/api';
import Modal from '../components/common/Modal';
import Can from '../components/common/Can';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const EXECUTION_STATUS = {
  NOT_RUN: { label: 'Non exécuté', color: 'text-slate-400', bg: 'bg-slate-100' },
  PASS: { label: 'Succès', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  FAIL: { label: 'Échec', color: 'text-red-600', bg: 'bg-red-100' },
  BLOCKED: { label: 'Bloqué', color: 'text-orange-500', bg: 'bg-orange-100' },
  SKIPPED: { label: 'Ignoré', color: 'text-slate-500', bg: 'bg-slate-200' },
};

export default function TestPlanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cases');

  const load = async () => {
    try {
      setLoading(true);
      const data = await testPlansApi.getOne(id);
      setPlan(data);
    } catch (err) {
      toast.error('Erreur lors du chargement du plan');
      navigate('/test-plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4 text-sm text-slate-500 font-medium">
            <button onClick={() => navigate('/test-plans')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Plans de test
            </button>
            <span>/</span>
            <span className="text-slate-800">{plan.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{plan.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[plan.status]}`}>
                  {plan.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {plan.test_type}
                </span>
              </div>
              <p className="text-slate-500 max-w-2xl">{plan.description || 'Aucune description'}</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-6 mt-8 border-b border-slate-200">
            {['details', 'cases', 'cycles'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab === 'details' && 'Détails du Plan'}
                {tab === 'cases' && `Cas de Test (${plan.cases?.length || 0})`}
                {tab === 'cycles' && `Cycles d'exécution (${plan.cycles?.length || 0})`}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB: DETAILS */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Objectifs</h3>
                {plan.objectives?.length > 0 ? (
                  <ul className="space-y-2">
                    {plan.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {obj}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">Non défini</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Critères d'entrée</h3>
                  {plan.entry_criteria?.length > 0 ? (
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                      {plan.entry_criteria.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-400">Non défini</p>}
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Critères de sortie</h3>
                  {plan.exit_criteria?.length > 0 ? (
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                      {plan.exit_criteria.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-400">Non défini</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Informations</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-slate-400 mb-1">Projet</span>
                    <span className="font-medium text-slate-800">{plan.project_id?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Environnement</span>
                    <span className="font-medium text-slate-800">{plan.environment}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Responsable QA</span>
                    <span className="font-medium text-slate-800">{plan.responsible_id?.name || 'Non assigné'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Dates</span>
                    <span className="font-medium text-slate-800">
                      {plan.start_date ? new Date(plan.start_date).toLocaleDateString('fr-FR') : 'N/A'}
                      {' → '}
                      {plan.end_date ? new Date(plan.end_date).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CASES */}
        {activeTab === 'cases' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Scénarios de Test</h3>
            </div>
            {plan.cases?.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                Aucun cas de test défini.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-5 py-3 font-semibold">Titre</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Priorité</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 font-semibold">Créateur</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.cases.map(tc => (
                    <tr key={tc._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800">{tc.title}</td>
                      <td className="px-5 py-4 text-slate-500">{tc.test_type}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${tc.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {tc.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-500">{tc.status}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{tc.created_by?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: CYCLES */}
        {activeTab === 'cycles' && (
          <div className="space-y-6">
            {plan.cycles?.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
                Aucun cycle d'exécution lancé.
              </div>
            ) : (
              plan.cycles.map(cycle => (
                <div key={cycle._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{cycle.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Env: {cycle.environment} · {cycle.executions?.length} exécutions</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                      {cycle.status}
                    </span>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-white">
                          <th className="px-5 py-3 font-semibold">Cas de Test</th>
                          <th className="px-5 py-3 font-semibold">Statut</th>
                          <th className="px-5 py-3 font-semibold">Exécuté par</th>
                          <th className="px-5 py-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycle.executions?.map(exec => {
                          const statusMeta = EXECUTION_STATUS[exec.status] || EXECUTION_STATUS.NOT_RUN;
                          return (
                            <tr key={exec._id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-5 py-3 font-medium text-slate-800">
                                {exec.test_case_id?.title || 'Cas introuvable'}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-500">
                                {exec.executed_by?.name || '-'}
                              </td>
                              <td className="px-5 py-3 text-slate-500">
                                {exec.executed_at ? new Date(exec.executed_at).toLocaleString('fr-FR') : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
