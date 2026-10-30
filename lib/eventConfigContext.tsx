'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { ConfiguracionEvento } from './types';
import { EMPTY_EVENT_CONFIG, getConfiguracionEvento, getEventos } from './storage';
import { initializeFirebase } from './firebase';

export const DEFAULT_EVENT_CONFIG: ConfiguracionEvento = EMPTY_EVENT_CONFIG;

interface EventConfigContextType {
  config: ConfiguracionEvento;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracionEvento>>;
  eventos: ConfiguracionEvento[];
  loadingConfig: boolean;
  refreshEventos: () => Promise<void>;
}

const EventConfigContext = createContext<EventConfigContextType>({
  config: EMPTY_EVENT_CONFIG,
  setConfig: () => {},
  eventos: [],
  loadingConfig: true,
  refreshEventos: async () => {},
});

export const EventConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracionEvento>(EMPTY_EVENT_CONFIG);
  const [eventos, setEventos] = useState<ConfiguracionEvento[]>([]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  const refreshEventos = useCallback(async () => {
    try {
      const [evList, activeCfg] = await Promise.all([
        getEventos(),
        getConfiguracionEvento(),
      ]);
      setEventos(evList);
      setConfig(activeCfg);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    refreshEventos();

    const { db, isConfigured } = initializeFirebase();
    if (!isConfigured || !db) return;

    const unsub = onSnapshot(
      collection(db, 'eventos'),
      () => {
        refreshEventos();
      },
      () => {
        // Ignore snapshot errors
      }
    );

    return () => unsub();
  }, [refreshEventos]);

  return (
    <EventConfigContext.Provider
      value={{ config, setConfig, eventos, loadingConfig, refreshEventos }}
    >
      {children}
    </EventConfigContext.Provider>
  );
};

export const useEventConfig = () => useContext(EventConfigContext);
