import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const ROLES = {
  ADMIN: 'ADMIN',
  PO: 'PO',
  SCRUM_MASTER: 'SCRUM_MASTER',
  DEV: 'DEV',
  QA: 'QA',
  CLIENT: 'CLIENT',
};

// Labels et couleurs affichés dans l'UI
export const ROLE_META = {
  ADMIN:        { label: 'Admin',         color: 'bg-indigo-100 text-indigo-700' },
  PO:           { label: 'Product Owner', color: 'bg-amber-100 text-amber-700'   },
  SCRUM_MASTER: { label: 'Scrum Master',  color: 'bg-purple-100 text-purple-700' },
  DEV:          { label: 'Développeur',   color: 'bg-emerald-100 text-emerald-700'},
  QA:           { label: 'QA / Testeur',  color: 'bg-orange-100 text-orange-700' },
  CLIENT:       { label: 'Client',        color: 'bg-teal-100 text-teal-700'     },
};

const ROLE_LEVELS = ['CLIENT', 'QA', 'DEV', 'SCRUM_MASTER', 'PO', 'ADMIN'];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Auth init failed', error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // can(['ADMIN', 'PO']) — vrai si le rôle de l'utilisateur est dans la liste
  const can = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // canMin('DEV') — vrai si le rôle est >= DEV dans la hiérarchie
  const canMin = (minRole) => {
    if (!user) return false;
    return ROLE_LEVELS.indexOf(user.role) >= ROLE_LEVELS.indexOf(minRole);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, can, canMin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
