import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ShareModal({ doc, onClose, onUpdated }) {
  const [teams, setTeams] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [shareType, setShareType] = useState('team');
  const [refId, setRefId] = useState('');
  const [access, setAccess] = useState('READ');
  const [isPublic, setIsPublic] = useState(doc?.is_public || false);
  const [sharedWith, setSharedWith] = useState(doc?.shared_with || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/teams').then(r => r.data),
      api.get('/developers').then(r => r.data),
    ]).then(([t, d]) => { setTeams(t); setDevelopers(d); }).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!refId) { toast.error('Sélectionnez une équipe ou un développeur'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/document-editor/${doc._id || doc.id}/share`, {
        type: shareType, ref_id: refId, access,
      });
      setSharedWith(res.data.shared_with || []);
      onUpdated && onUpdated(res.data);
      setRefId('');
      toast.success('Document partagé !');
    } catch { toast.error('Erreur de partage'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (shareId) => {
    try {
      const res = await api.delete(`/document-editor/${doc._id || doc.id}/share/${shareId}`);
      setSharedWith(res.data.shared_with || []);
      onUpdated && onUpdated(res.data);
    } catch { toast.error('Erreur'); }
  };

  const handleTogglePublic = async () => {
    try {
      const res = await api.patch(`/document-editor/${doc._id || doc.id}/public`, { is_public: !isPublic });
      setIsPublic(!isPublic);
      onUpdated && onUpdated(res.data);
      toast.success(isPublic ? 'Document privé' : 'Visible par tout le projet');
    } catch { toast.error('Erreur'); }
  };

  const getLabel = (entry) => {
    if (entry.type === 'team') {
      const t = teams.find(x => String(x._id || x.id) === String(entry.ref_id));
      return t ? `${t.avatar} ${t.name}` : 'Équipe';
    }
    const d = developers.find(x => String(x._id || x.id) === String(entry.ref_id));
    return d ? `👤 ${d.name}` : 'Développeur';
  };

  const options = shareType === 'team'
    ? teams.map(t => ({ value: String(t._id || t.id), label: `${t.avatar} ${t.name}` }))
    : developers.map(d => ({ value: String(d._id || d.id), label: `👤 ${d.name}` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">🔗 Partager le document</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500 truncate">📄 <span className="font-medium text-slate-700">{doc?.title}</span></p>

          {/* Ajouter un partage */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setShareType('team')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${shareType === 'team' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                👥 Équipe
              </button>
              <button onClick={() => setShareType('developer')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${shareType === 'developer' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                👤 Développeur
              </button>
            </div>

            <select value={refId} onChange={e => setRefId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">— Sélectionner</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Niveau d'accès</p>
              <div className="flex gap-2">
                {[['READ', '👁 Lecture'], ['EDIT', '✏️ Édition']].map(([v, l]) => (
                  <button key={v} onClick={() => setAccess(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${access === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} disabled={!refId || loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? 'Partage…' : 'Ajouter le partage'}
            </button>
          </div>

          {/* Liste des partages existants */}
          {sharedWith.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Partagé avec :</p>
              <div className="space-y-2">
                {sharedWith.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">{getLabel(entry)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.access === 'EDIT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                        {entry.access === 'EDIT' ? '✏️ Édition' : '👁 Lecture'}
                      </span>
                      <button onClick={() => handleRemove(entry._id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public */}
          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-slate-700">🌐 Visible par tout le projet</p>
              <p className="text-xs text-slate-400">Tous les membres du projet peuvent voir ce document</p>
            </div>
            <button onClick={handleTogglePublic}
              className={`w-11 h-6 rounded-full transition-all relative ${isPublic ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPublic ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
