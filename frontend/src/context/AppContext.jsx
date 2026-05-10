import React, { createContext, useContext, useState, useCallback } from 'react';
import { developersApi } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [developers, setDevelopers] = useState([]);
  const [developersLoaded, setDevelopersLoaded] = useState(false);

  const loadDevelopers = useCallback(async () => {
    if (developersLoaded) return;
    const data = await developersApi.getAll();
    setDevelopers(data);
    setDevelopersLoaded(true);
  }, [developersLoaded]);

  const refreshDevelopers = useCallback(async () => {
    const data = await developersApi.getAll();
    setDevelopers(data);
  }, []);

  return (
    <AppContext.Provider value={{ developers, loadDevelopers, refreshDevelopers }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
