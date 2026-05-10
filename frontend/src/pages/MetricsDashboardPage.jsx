import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────── */
const STATUS = (val, warn, err, lowIsGood) => {
  if (val === null || val === undefined) return 'none';
  return lowIsGood
    ? val >= err ? 'error' : val >= warn ? 'warn' : 'ok'
    : val <= err ? 'error' : val <= warn ? 'warn' : 'ok';
};
const CLR  = { ok: '#22c55e', warn: '#f59e0b', error: '#ef4444', none: '#94a3b8' };
const BG   = { ok: '#f0fdf4', warn: '#fffbeb', error: '#fef2f2', none: '#f8fafc' };

/* ──────────────────────────────────────────────
   Petit composant jauge
──────────────────────────────────────────────── */
function Gauge({ label, value, unit = '', status, desc }) {
  const c = CLR[status]; const b = BG[status];
  return (
    <div className="rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all" style={{ background: b }} title={desc}>
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: c }}>{value ?? '—'}{value != null ? unit : ''}</p>
      <p className="text-xs text-slate-400 mt-1 truncate">{desc}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Formulaire saisie manuelle
──────────────────────────────────────────────── */
const FIELDS = [
  { key:'module_name',           label:'Module / Classe *', type:'text',   required:true },
  { key:'language',              label:'Langage',           type:'text' },
  { key:'loc',                   label:'LOC',               type:'number' },
  { key:'sloc',                  label:'SLOC',              type:'number' },
  { key:'comment_ratio',         label:'Ratio Commentaires (%)', type:'number' },
  { key:'cyclomatic_complexity', label:'Complexité Cyclomatique V(G)', type:'number' },
  { key:'cognitive_complexity',  label:'Complexité Cognitive', type:'number' },
  { key:'max_nesting_depth',     label:'Profondeur imbrication max', type:'number' },
  { key:'maintainability_index', label:'Indice Maintenabilité (0-100)', type:'number' },
  { key:'halstead_volume',       label:'Volume Halstead',   type:'number' },
  { key:'halstead_difficulty',   label:'Difficulté Halstead', type:'number' },
  { key:'wmc',                   label:'WMC (Weighted Methods/Class)', type:'number' },
  { key:'dit',                   label:'DIT (Depth Inheritance)', type:'number' },
  { key:'cbo',                   label:'CBO (Coupling Objects)', type:'number' },
  { key:'rfc',                   label:'RFC (Response for Class)', type:'number' },
  { key:'lcom',                  label:'LCOM (Lack Cohesion)', type:'number', step:'0.01' },
  { key:'num_methods',           label:'Nb méthodes',       type:'number' },
  { key:'avg_method_length',     label:'Longueur moy. méthode (LOC)', type:'number' },
  { key:'duplication_pct',       label:'Duplication (%)',   type:'number' },
  { key:'test_coverage_pct',     label:'Couverture tests (%)', type:'number' },
  { key:'branch_coverage_pct',   label:'Couverture branches (%)', type:'number' },
  { key:'mutation_score',        label:'Score mutation (%)', type:'number' },
  { key:'notes',                 label:'Notes',             type:'textarea' },
];

function ManualForm({ projects, onSave, onCancel }) {
  const [projectId, setProjectId] = useState('');
  const [form, setForm] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v === '' ? null : v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) { toast.error('Choisissez un projet'); return; }
    try {
      await api.post('/metrics/manual', { ...form, project_id: projectId, source: 'MANUAL' });
      toast.success('Métriques enregistrées !');
      onSave();
    } catch { toast.error('Erreur'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Projet *</label>
        <select required value={projectId} onChange={e => setProjectId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">— Choisir</option>
          {projects.map(p => <option key={p._id||p.id} value={p._id||p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(f => (
          <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : ''}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
            {f.type === 'textarea'
              ? <textarea rows={2} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              : <input type={f.type} step={f.step || (f.type === 'number' ? '1' : undefined)}
                  required={f.required} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value === '' ? '' : f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={f.type === 'number' ? '0' : ''} />
            }
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Enregistrer</button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────
   Modal générique
──────────────────────────────────────────────── */
function Modal({ title, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page principale
──────────────────────────────────────────────── */
export default function MetricsDashboardPage() {
  const [projects, setProjects]     = useState([]);
  const [project, setProject]       = useState('');
  const [dashboard, setDashboard]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [tab, setTab]               = useState('overview');
  const [deleting, setDeleting]     = useState(null);

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)).catch(() => {}); }, []);

  const load = () => {
    if (!project) return;
    setLoading(true);
    api.get(`/metrics/dashboard/${project}`)
      .then(r => setDashboard(r.data))
      .catch(() => toast.error('Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [project]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/metrics/${id}`);
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
    setDeleting(null);
  };

  const s = dashboard?.summary;

  const tabs = [
    ['overview', '📊 Vue d\'ensemble'],
    ['complexity', '🔀 Complexité'],
    ['oop', '🔷 Suite CK (OOP)'],
    ['quality', '✅ Qualité'],
    ['modules', '📁 Modules'],
    ['guide', '📖 Guide'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">📐 Métriques de Qualité</h1>
          <p className="text-slate-500 text-sm mt-0.5">Saisie manuelle · Import SonarQube · Visualisation</p>
        </div>
        <div className="flex gap-2">
          <select value={project} onChange={e => setProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            <option value="">— Choisir un projet</option>
            {projects.map(p => <option key={p._id||p.id} value={p._id||p.id}>{p.name}</option>)}
          </select>
          {project && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-sm">
              + Saisir métriques
            </button>
          )}
        </div>
      </div>

      {!project && (
        <div className="text-center py-28 text-slate-400">
          <div className="text-6xl mb-4">📐</div>
          <p className="text-xl font-bold mb-2">Sélectionnez un projet</p>
          <p className="text-sm">Les métriques sont saisies manuellement ou importées via SonarQube / vos outils d'analyse</p>
        </div>
      )}

      {project && loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>}

      {project && !loading && dashboard && (
        <>
          {/* KPI Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              ['Modules',s?.modules_analyzed,''],
              ['Total LOC',(s?.total_loc||0).toLocaleString(),''],
              ['V(G) moyen',s?.avg_cyclomatic_complexity,''],
              ['Maintenabilité',s?.avg_maintainability_index,'/100'],
              ['Couverture tests',s?.avg_test_coverage,'%'],
            ].map(([lbl,val,u]) => (
              <div key={lbl} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs text-slate-400">{lbl}</p>
                <p className="text-2xl font-black text-slate-900">{val ?? '—'}{val != null ? u : ''}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-200 rounded-xl p-1 mb-5 w-fit">
            {tabs.map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab===v?'bg-white text-indigo-700 shadow-sm':'text-slate-600 hover:text-slate-800'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Gauge label="Complexité Cyclomatique" value={s?.avg_cyclomatic_complexity} status={STATUS(s?.avg_cyclomatic_complexity,10,20,true)} desc="V(G) — chemins indépendants" />
                <Gauge label="Complexité Cognitive" value={s?.avg_cognitive_complexity} status={STATUS(s?.avg_cognitive_complexity,15,25,true)} desc="Difficulté de compréhension" />
                <Gauge label="Indice Maintenabilité" value={s?.avg_maintainability_index} unit="/100" status={STATUS(s?.avg_maintainability_index,50,25,false)} desc="171 − 5.2ln(V) − 0.23V(G) − 16.2ln(SLOC)" />
                <Gauge label="Duplication" value={s?.avg_duplication_pct} unit="%" status={STATUS(s?.avg_duplication_pct,5,15,true)} desc="% code dupliqué" />
              </div>
              {/* Hotspots */}
              {s?.hotspots?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-4">🔥 Hotspots — modules les plus complexes</h2>
                  <div className="space-y-2">
                    {s.hotspots.map((h,i) => {
                      const cc = h.cyclomatic_complexity;
                      const col = cc>=20?'#ef4444':cc>=10?'#f59e0b':'#22c55e';
                      return (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-sm font-black text-slate-300 w-5">{i+1}</span>
                          <p className="flex-1 font-mono text-sm font-semibold text-slate-700 truncate">{h.module_name}</p>
                          <div className="flex gap-4 text-xs flex-shrink-0">
                            <div className="text-center"><div className="font-black text-lg" style={{color:col}}>{cc??'—'}</div><div className="text-slate-400">V(G)</div></div>
                            <div className="text-center"><div className="font-bold text-lg text-slate-700">{h.maintainability_index??'—'}</div><div className="text-slate-400">MI</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMPLEXITÉ ── */}
          {tab === 'complexity' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="V(G) moyen" value={s?.avg_cyclomatic_complexity} status={STATUS(s?.avg_cyclomatic_complexity,10,20,true)} desc="McCabe — points de décision" />
              <Gauge label="V(G) max" value={s?.max_cyclomatic_complexity} status={STATUS(s?.max_cyclomatic_complexity,10,20,true)} desc="Module le plus complexe" />
              <Gauge label="Complexité Cognitive" value={s?.avg_cognitive_complexity} status={STATUS(s?.avg_cognitive_complexity,15,25,true)} desc="Style SonarQube" />
              <Gauge label="Profondeur imbrication" value={dashboard.metrics?.reduce((m,x)=>Math.max(m,x.max_nesting_depth||0),0)||null} status={STATUS(dashboard.metrics?.reduce((m,x)=>Math.max(m,x.max_nesting_depth||0),0),4,6,true)} desc="Max { imbriquées" />
              <Gauge label="Longueur moy. méthode" value={s?.avg_method_length??null} status={STATUS(s?.avg_method_length,30,60,true)} desc="LOC par méthode" unit=" LOC" />
              <Gauge label="Indice Maintenabilité" value={s?.avg_maintainability_index} unit="/100" status={STATUS(s?.avg_maintainability_index,50,25,false)} desc="Composite MI" />
            </div>
          )}

          {/* ── OOP CK ── */}
          {tab === 'oop' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Gauge label="WMC" value={s?.avg_wmc} status={STATUS(s?.avg_wmc,20,40,true)} desc="Weighted Methods per Class — complexité totale" />
                <Gauge label="DIT" value={s?.avg_dit} status={STATUS(s?.avg_dit,3,5,true)} desc="Depth of Inheritance Tree" />
                <Gauge label="CBO" value={s?.avg_cbo} status={STATUS(s?.avg_cbo,10,20,true)} desc="Coupling Between Objects" />
                <Gauge label="RFC" value={s?.avg_rfc} status={STATUS(s?.avg_rfc,50,100,true)} desc="Response For a Class" />
                <Gauge label="LCOM" value={s?.avg_lcom} status={STATUS(s?.avg_lcom,0.5,0.8,true)} desc="Lack of Cohesion (0=cohésif, 1=dispersé)" />
              </div>
            </div>
          )}

          {/* ── QUALITÉ ── */}
          {tab === 'quality' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="Couverture Tests" value={s?.avg_test_coverage} unit="%" status={STATUS(s?.avg_test_coverage,60,40,false)} desc="% code couvert par les tests" />
              <Gauge label="Couverture Branches" value={dashboard.metrics?.filter(m=>m.branch_coverage_pct!=null).reduce((s,m,_,a)=>s+m.branch_coverage_pct/a.length,0)||null} unit="%" status={STATUS(null,70,50,false)} desc="% branches testées" />
              <Gauge label="Score Mutation" value={dashboard.metrics?.filter(m=>m.mutation_score!=null).reduce((s,m,_,a)=>s+m.mutation_score/a.length,0)||null} unit="%" status={STATUS(null,80,60,false)} desc="% mutations tuées" />
              <Gauge label="Ratio Commentaires" value={s?.avg_comment_ratio} unit="%" status={STATUS(s?.avg_comment_ratio,10,5,false)} desc="% lignes documentées" />
              <Gauge label="Duplication" value={s?.avg_duplication_pct} unit="%" status={STATUS(s?.avg_duplication_pct,5,15,true)} desc="% code dupliqué (DRY)" />
            </div>
          )}

          {/* ── MODULES ── */}
          {tab === 'modules' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{['Module','LOC','V(G)','Cognitif','MI','Couverture','Source',''].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboard.metrics?.map(m => {
                      const cc=m.cyclomatic_complexity; const mi=m.maintainability_index;
                      const ccC=cc>=20?'#ef4444':cc>=10?'#f59e0b':cc?'#22c55e':'#94a3b8';
                      const miC=mi<=25?'#ef4444':mi<=50?'#f59e0b':mi?'#22c55e':'#94a3b8';
                      return (
                        <tr key={m._id||m.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 max-w-[180px] truncate">{m.module_name}</td>
                          <td className="px-4 py-3 text-slate-500">{m.loc??'—'}</td>
                          <td className="px-4 py-3 font-bold" style={{color:ccC}}>{cc??'—'}</td>
                          <td className="px-4 py-3 text-slate-500">{m.cognitive_complexity??'—'}</td>
                          <td className="px-4 py-3 font-bold" style={{color:miC}}>{mi??'—'}</td>
                          <td className="px-4 py-3 text-slate-500">{m.test_coverage_pct!=null?`${m.test_coverage_pct}%`:'—'}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.source}</span></td>
                          <td className="px-4 py-3">
                            <button onClick={() => setDeleting(m._id||m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!dashboard.metrics?.length && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="mb-3">Aucun module enregistré</p>
                    <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">+ Saisir des métriques</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── GUIDE ── */}
          {tab === 'guide' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                ['🔀 Complexité Cyclomatique V(G)', [['1–10','Faible ✅ Code simple, facile à tester'],['11–20','Moyen ⚠️ Attention, ajouter des tests'],['21–50','Élevé 🔴 Refactoring recommandé'],['>50','Critique ❌ Impossible à tester']]],
                ['🧠 Complexité Cognitive', [['0–15','Facile ✅'],['16–25','Acceptable ⚠️'],['26–50','Difficile 🔴'],['>50','Critique ❌']]],
                ['📊 Indice de Maintenabilité (MI)', [['>65','Facile à maintenir ✅'],['40–65','Moyen ⚠️'],['<40','Difficile 🔴']]],
                ['🔷 WMC — Weighted Methods per Class', [['<20','Acceptable ✅'],['20–40','Classe trop grande ⚠️'],['>40','Scinder la classe 🔴']]],
                ['🔗 CBO — Coupling Between Objects', [['<5','Faible couplage ✅'],['5–10','Acceptable ⚠️'],['>10','Trop couplé 🔴']]],
                ['🌳 DIT — Depth of Inheritance', [['1–2','Idéal ✅'],['3–4','Acceptable ⚠️'],['>5','Trop d\'héritage 🔴']]],
                ['💧 LCOM — Lack of Cohesion', [['0–0.3','Très cohésif ✅'],['0.3–0.7','Acceptable ⚠️'],['0.7–1','Scinder la classe 🔴']]],
                ['🧪 Couverture de Tests', [['>80%','Bonne ✅'],['60–80%','Acceptable ⚠️'],['<60%','Insuffisante 🔴']]],
              ].map(([title, rows]) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">{title}</h3>
                  <div className="space-y-1.5">
                    {rows.map(([range, desc]) => (
                      <div key={range} className="flex gap-3 text-xs">
                        <span className="font-mono font-bold text-indigo-600 w-20 flex-shrink-0">{range}</span>
                        <span className="text-slate-600">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <Modal title="➕ Saisir des métriques" onClose={() => setShowForm(false)} wide>
          <ManualForm projects={projects} onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600 mb-4">Voulez-vous supprimer ce module et ses métriques ?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={() => handleDelete(deleting)} className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
