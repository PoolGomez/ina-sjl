'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { useEventConfig } from '../../lib/eventConfigContext';
import { Navbar } from '../../components/Navbar';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { config } = useEventConfig();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const isBingo = pathname === '/bingo-juego';
  const isBingo2 = pathname === '/bingo-juego2';

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
        isBingo ? 'min-h-screen lg:h-screen lg:overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Navbar config={config} />

      {isBingo ? (
        <div className="flex-1 min-h-0 flex flex-col px-2 sm:px-4 py-2 overflow-y-auto lg:overflow-hidden bg-slate-950">
          {children}
        </div>
      ) : isBingo2 ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</div>
      ) : (
        <>
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </main>

          <footer className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden mt-auto">
            <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                <strong className="text-slate-700 dark:text-slate-300">
                  IGLESIA NUEVA APOSTÓLICA (INA)
                </strong>{' '}
                • Gestión de Membresía, Asistencia &amp; Eventos ({config.nombreEvento})
              </p>
              <div className="flex items-center gap-3">
                <span>{config.lugar}</span>
                <span>•</span>
                <span className="font-mono">{config.fechaEvento}</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
