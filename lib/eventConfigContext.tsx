'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfiguracionEvento } from './types';
import { getConfiguracionEvento } from './storage';

export const DEFAULT_EVENT_CONFIG: ConfiguracionEvento = {
  nombreEvento: 'GRAN BINGO Y ALMUERZO FAMILIAR INA',
  subtitulo: 'Parroquia / Comunidad INA - Beneficio Anual',
  fechaEvento: new Date().toISOString().split('T')[0],
  lugar: 'Salón de Eventos Principal INA',
  mensajeTicket: '¡Gracias por colaborar con nuestra comunidad! Conserve este comprobante.',
  bingoPrecios: {
    tieneDosPrecios: true,
    precio1: 2000,
    etiquetaPrecio1: 'General',
    precio2: 1500,
    etiquetaPrecio2: 'Socio / Promo',
  },
  permitirVentaSinPagar: true,
};

interface EventConfigContextType {
  config: ConfiguracionEvento;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracionEvento>>;
}

const EventConfigContext = createContext<EventConfigContextType>({
  config: DEFAULT_EVENT_CONFIG,
  setConfig: () => {},
});

export const EventConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracionEvento>(DEFAULT_EVENT_CONFIG);

  useEffect(() => {
    getConfiguracionEvento().then((res) => setConfig(res));
  }, []);

  return (
    <EventConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </EventConfigContext.Provider>
  );
};

export const useEventConfig = () => useContext(EventConfigContext);
