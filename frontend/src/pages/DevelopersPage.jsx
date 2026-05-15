import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { developersApi } from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { ROLE_META, useAuth } from '../context/AuthContext';

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6',
  '#ec4899', '#0ea5e9', '#84cc16', '#6b7280',
];

const ROLES = ['ADMIN', 'PO', 'SCRUM_MASTER', 'DEV', 'QA', 'CLIENT'];

const roleHierarchy = { CLIENT: 1, QA: 2, DEV: 3, SCRUM_MASTER: 4, PO: 5, ADMIN: 6 };

// ─── Small helpers ────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 10 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: color, fontSize: size * 1.6 }}
    >
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] ?? { label: role, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Couleur d'avatar</label>
      <div className="flex flex-wrap gap-2">
        {COLORS.map(c => (
          <button
            key={c} type="button" onClick={() => onChange(c)}
            className={`w-8 h-8 rounded-full transition-all ${value === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-500' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────

function AccountForm({ initial, onSubmit, onCancel, mode = 'create' }) {
  const [form, setForm] = useState(
    initial ?? { name: '', email: '', password: '', role: 'DEV', color: COLORS[0] }
  );
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nom complet" required value={form.name}
          onChange={e => set('name', e.target.value)} placeholder="ex : Sarah Martin" />
        <Input label="Adresse email" required type="email" value={form.email}
          onChange={e => set('email', e.target.value)} placeholder="admin@g2i.io" />
      </div>

      {mode === 'create' && (
        <Input label="Mot de passe" type="password" value={form.password}
          onChange={e => set('password', e.target.value)}
          placeholder="Laisser vide → password123 par défaut" />
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
        <select value={form.role} onChange={e => set('role', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {ROLES.map(r => (
            <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
          ))}
        </select>
      </div>

      <ColorPicker value={form.color} onChange={v => set('color', v)} />

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <Avatar name={form.name || '?'} color={form.color} size={10} />
        <div>
          <p className="text-sm font-medium text-slate-800">{form.name || 'Aperçu du compte'}</p>
          <p className="text-xs text-slate-500">{form.email || 'email@exemple.com'}</p>
          <RoleBadge role={form.role} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium">
          {submitting ? 'Enregistrement…' : mode === 'create' ? 'Créer le compte' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

function PasswordForm({ devName, onSubmit, onCancel }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 6) { toast.error('Minimum 6 caractères'); return; }
    setSubmitting(true);
    try { await onSubmit(form.password); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-sm text-amber-700">
          Vous êtes sur le point de modifier le mot de passe de <strong>{devName}</strong>.
        </p>
      </div>

      <div className="relative">
        <Input label="Nouveau mot de passe" required type={show ? 'text' : 'password'}
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="Minimum 6 caractères" />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
          {show
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          }
        </button>
      </div>

      <Input label="Confirmer le mot de passe" required type={show ? 'text' : 'password'}
        value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
        placeholder="Répétez le mot de passe" />

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium">
          {submitting ? 'Mise à jour…' : 'Changer le mot de passe'}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({ dev, onConfirm, onCancel }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try { await onConfirm(); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <Avatar name={dev.name} color={dev.color} size={12} />
        <div>
          <p className="font-semibold text-slate-800">{dev.name}</p>
          <p className="text-sm text-slate-500">{dev.email}</p>
          <RoleBadge role={dev.role} />
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Cette action est <strong className="text-red-600">irréversible</strong>. Le compte sera supprimé et toutes les tâches assignées à cet utilisateur seront désassignées.
      </p>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onCancel}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Annuler
        </button>
        <button onClick={handleConfirm} disabled={submitting}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2">
          {submitting
            ? 'Suppression…'
            : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Supprimer définitivement</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Admin Table Row ──────────────────────────────────────────────────────────

function TableRow({ dev, workload, isSelf, onEdit, onPassword, onDelete }) {
  const isOnlyAdmin = dev.role === 'ADMIN' && isSelf;

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      {/* Avatar + identity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={dev.name} color={dev.color} size={9} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{dev.name}</span>
              {isSelf && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Vous</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{dev.email}</span>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={dev.role} />
      </td>

      {/* Workload */}
      <td className="px-4 py-3">
        {workload ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-600">{workload.inProgress}</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm text-slate-500">{workload.totalActive} actives</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Created at */}
      <td className="px-4 py-3 text-xs text-slate-400">
        {dev.created_at ? new Date(dev.created_at).toLocaleDateString('fr-FR') : '—'}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit */}
          <button onClick={() => onEdit(dev)} title="Modifier le compte"
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Password */}
          <button onClick={() => onPassword(dev)} title="Changer le mot de passe"
            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>

          {/* Delete */}
          {!isOnlyAdmin && !isSelf && (
            <button onClick={() => onDelete(dev)} title="Supprimer le compte"
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  const { user, can } = useAuth();
  const isAdmin = can(['ADMIN']);

  const [developers, setDevelopers] = useState([]);
  const [workloads, setWorkloads]   = useState({});
  const [loading, setLoading]       = useState(true);

  // Search / filter
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modals
  const [showCreate,   setShowCreate]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [pwdTarget,    setPwdTarget]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── data loading ──────────────────────────────────────────────────────────

  const loadDevelopers = async () => {
    setLoading(true);
    try {
      const devs = await developersApi.getAll();
      setDevelopers(devs);
      // load workloads in background
      const wl = {};
      await Promise.all(devs.map(async d => {
        try { const w = await developersApi.getWorkload(d.id); wl[d.id] = w; } catch {}
      }));
      setWorkloads(wl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevelopers(); }, []);

  // ── filtered list ─────────────────────────────────────────────────────────

  const filtered = developers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q);
    const matchRole   = filterRole === 'ALL' || d.role === filterRole;
    return matchSearch && matchRole;
  });

  // sort: ADMIN first, then by hierarchy desc, then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    const diff = (roleHierarchy[b.role] ?? 0) - (roleHierarchy[a.role] ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'fr');
  });

  // ── stats ─────────────────────────────────────────────────────────────────

  const stats = ROLES.map(r => ({ role: r, count: developers.filter(d => d.role === r).length }))
    .filter(s => s.count > 0);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async (data) => {
    await developersApi.create(data);
    toast.success(`Compte créé pour ${data.name}`);
    setShowCreate(false);
    loadDevelopers();
  };

  const handleEdit = async (data) => {
    await developersApi.update(editTarget.id, { name: data.name, email: data.email, role: data.role, color: data.color });
    toast.success('Compte mis à jour');
    setEditTarget(null);
    loadDevelopers();
  };

  const handlePassword = async (pwd) => {
    await developersApi.resetPassword(pwdTarget.id, pwd);
    toast.success(`Mot de passe modifié pour ${pwdTarget.name}`);
    setPwdTarget(null);
  };

  const handleDelete = async () => {
    await developersApi.delete(deleteTarget.id);
    toast.success(`Compte de ${deleteTarget.name} supprimé`);
    setDeleteTarget(null);
    loadDevelopers();
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? 'Gestion des comptes' : 'Équipe'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {developers.length} compte{developers.length !== 1 ? 's' : ''} enregistré{developers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Nouveau compte
          </button>
        )}
      </div>

      {/* ── Stats chips (admin only) ── */}
      {isAdmin && !loading && (
        <div className="flex flex-wrap gap-2 mb-5">
          {stats.map(({ role, count }) => {
            const meta = ROLE_META[role];
            return (
              <button key={role}
                onClick={() => setFilterRole(filterRole === role ? 'ALL' : role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${filterRole === role
                    ? `${meta.color} border-current shadow-sm`
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <span>{meta.label}</span>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs
                  ${filterRole === role ? 'bg-white/60' : 'bg-slate-100'}`}>
                  {count}
                </span>
              </button>
            );
          })}
          {filterRole !== 'ALL' && (
            <button onClick={() => setFilterRole('ALL')}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              ✕ Tous
            </button>
          )}
        </div>
      )}

      {/* ── Search bar (admin only) ── */}
      {isAdmin && (
        <div className="relative mb-5">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Admin table view ── */}
      {!loading && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {sorted.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">Aucun compte trouvé</p>
              {(search || filterRole !== 'ALL') && (
                <button onClick={() => { setSearch(''); setFilterRole('ALL'); }}
                  className="mt-2 text-sm text-indigo-600 hover:underline">Réinitialiser les filtres</button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Membre ({sorted.length})
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Rôle
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Charge active
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Créé le
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map(dev => (
                  <TableRow
                    key={dev.id}
                    dev={dev}
                    workload={workloads[dev.id]}
                    isSelf={dev.id === user?.id || dev._id === user?._id}
                    onEdit={setEditTarget}
                    onPassword={setPwdTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Non-admin cards view ── */}
      {!loading && !isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {developers.map(dev => {
            const wl = workloads[dev.id];
            return (
              <div key={dev.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar name={dev.name} color={dev.color} size={12} />
                  <div>
                    <h3 className="font-semibold text-slate-800">{dev.name}</h3>
                    <p className="text-sm text-slate-400">{dev.email}</p>
                    <RoleBadge role={dev.role} />
                  </div>
                </div>

                {wl && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-600">{wl.inProgress}</p>
                        <p className="text-xs text-amber-500">En cours</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-purple-600">{wl.inReview}</p>
                        <p className="text-xs text-purple-500">En review</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-600">{wl.totalActive}</p>
                        <p className="text-xs text-slate-400">Total actif</p>
                      </div>
                    </div>

                    {wl.tasks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tâches actives</p>
                        <div className="space-y-1.5">
                          {wl.tasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-xs">
                              <Badge type="status" value={t.status} />
                              <span className="text-slate-600 truncate">{t.title}</span>
                            </div>
                          ))}
                          {wl.tasks.length > 3 && (
                            <p className="text-xs text-slate-400">+{wl.tasks.length - 3} autres…</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────── Modals ─────────────── */}

      {/* Create */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Créer un nouveau compte" size="md">
        <AccountForm mode="create" onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier le compte" size="md">
        {editTarget && (
          <AccountForm
            mode="edit"
            initial={{ name: editTarget.name, email: editTarget.email, role: editTarget.role, color: editTarget.color }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Password */}
      <Modal isOpen={!!pwdTarget} onClose={() => setPwdTarget(null)} title="Modifier le mot de passe" size="sm">
        {pwdTarget && (
          <PasswordForm
            devName={pwdTarget.name}
            onSubmit={handlePassword}
            onCancel={() => setPwdTarget(null)}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le compte" size="sm">
        {deleteTarget && (
          <DeleteConfirm
            dev={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
