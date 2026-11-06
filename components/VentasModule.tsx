'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  UtensilsCrossed,
  Receipt,
  Ticket,
} from 'lucide-react';
import { ConfiguracionEvento, UserPermissions } from '../lib/types';
import { useAuth } from '../lib/authContext';
import { ViandasSales } from './ViandasSales';
import { TicketsSales } from './TicketsSales';
import { BingoSales } from './BingoSales';

interface VentasModuleProps {
  config: ConfiguracionEvento;
}

type VentaTabId = 'viandas' | 'tickets' | 'tarjetas';

export const VentasModule: React.FC<VentasModuleProps> = ({ config }) => {
  const { user } = useAuth();

  const hasPerm = (perm: keyof UserPermissions) => {
    if (!user) return false;
    if (user.isSuperAdmin || user.role === 'admin') return true;
    return Boolean(user.permisos?.[perm]);
  };

  const tabs: {
    id: VentaTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    perm: keyof UserPermissions;
    activeClass: string;
    iconColor: string;
  }[] = [
      {
        id: 'viandas',
        label: 'Venta de Viandas',
        icon: UtensilsCrossed,
        perm: 'puedeVenderViandas',
        activeClass:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 border-transparent',
        iconColor: 'text-amber-500',
      },
      {
        id: 'tickets',
        label: 'Venta de Tickets',
        icon: Receipt,
        perm: 'puedeVenderTickets',
        activeClass:
          'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border-transparent',
        iconColor: 'text-cyan-500',
      },
      {
        id: 'tarjetas',
        label: 'Venta de Bingos',
        icon: Ticket,
        perm: 'puedeVenderBingo',
        activeClass:
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-transparent',
        iconColor: 'text-indigo-500',
      },
    ];

  const filteredBySubPerm = tabs.filter((t) => hasPerm(t.perm));
  const availableTabs =
    filteredBySubPerm.length > 0 ? filteredBySubPerm : tabs;
  const [activeTab, setActiveTab] = useState<VentaTabId>(
    availableTabs[0]?.id || 'viandas'
  );

  useEffect(() => {
    if (
      availableTabs.length > 0 &&
      !availableTabs.some((t) => t.id === activeTab)
    ) {
      setActiveTab(availableTabs[0].id);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-teal-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <ShoppingCart className="w-3.5 h-3.5" /> Punto de Venta Unificado
            </div>
            {config.nombreEvento && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-white/25 text-white text-xs font-black">
                <span>Evento Activo: {config.nombreEvento}</span>
              </div>
            )}
          </div> */}
          <h1 className="inline-flex items-center text-2xl sm:text-3xl font-black tracking-tight">
            <ShoppingCart className="w-6 h-6 mr-2" /> Ventas del Evento
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-2xl">
            Realiza ventas rápidas de viandas, tickets y tarjetas de bingo desde un solo lugar e imprime los comprobantes al instante.
          </p>
        </div>

        {/* 3 Tabs Switcher */}
        {/* <div className="flex flex-wrap items-center gap-2 bg-slate-950/25 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${isActive
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? tab.iconColor : 'text-white/80'
                    }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div> */}
      </div>

      {/* Tab Navigation Bar (also visible below banner for quick switching) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3.5 rounded-2xl border font-extrabold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer ${isActive
                ? tab.activeClass
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? '' : tab.iconColor}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content (Sales Only, Without History) */}
      <div>
        {activeTab === 'viandas' && (
          <ViandasSales config={config} mode="pos" />
        )}
        {activeTab === 'tickets' && (
          <TicketsSales config={config} mode="pos" />
        )}
        {activeTab === 'tarjetas' && (
          <BingoSales config={config} mode="pos" />
        )}
      </div>
    </div>
  );
};
