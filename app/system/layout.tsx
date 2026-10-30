'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { useEventConfig } from '../../lib/eventConfigContext';
import { ThemeProvider } from '../../lib/themeContext';
import { SidebarProvider, useSidebar } from '../../lib/sidebarContext';
import AppSidebar from '../../components/layout/AppSidebar';
import AppHeader from '../../components/layout/AppHeader';
import Backdrop from '../../components/layout/Backdrop';

function SystemShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { config } = useEventConfig();
  const pathname = usePathname();
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const isTransmision = pathname === '/system/transmision';
  const isBingo = pathname === '/system/bingo-juego';
  const isBingo2 = pathname === '/system/bingo-juego2';

  useEffect(() => {
    if (!isTransmision && !loading && !user) {
      router.replace('/');
    }
  }, [isTransmision, loading, user, router]);

  if (isTransmision) {
    return <>{children}</>;
  }

  const mainContentMargin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
    ? 'lg:ml-[290px]'
    : 'lg:ml-[90px]';

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* TailAdmin Sidebar and Backdrop */}
      <AppSidebar config={config} />
      <Backdrop />

      {/* TailAdmin Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${mainContentMargin} ${
          isBingo ? 'min-h-screen lg:h-screen lg:overflow-hidden' : 'min-h-screen'
        }`}
      >
        {/* TailAdmin Sticky Header */}
        <AppHeader config={config} />

        {/* Page Content */}
        {isBingo ? (
          <div className="flex-1 min-h-0 flex flex-col px-2 sm:px-4 py-2 overflow-y-auto lg:overflow-hidden bg-slate-950">
            {children}
          </div>
        ) : isBingo2 ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            {children}
          </div>
        ) : (
          <>
            <main className="flex-1 w-full p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
              {children}
            </main>

            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-500 dark:text-gray-400 print:hidden mt-auto">
              <div className="max-w-(--breakpoint-2xl) mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>
                  <strong className="text-gray-700 dark:text-gray-300">
                    IGLESIA NUEVA APOSTÓLICA (INA)
                  </strong>{' '}
                  • Gestión de Membresía, Asistencia &amp; Eventos
                  {config.nombreEvento ? ` (${config.nombreEvento})` : ''}
                </p>
                {config.nombreEvento && (
                  <div className="flex items-center gap-3">
                    <span>{config.lugar}</span>
                    {config.lugar && config.fechaEvento && <span>•</span>}
                    <span className="font-mono">{config.fechaEvento}</span>
                  </div>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <SystemShell>{children}</SystemShell>
      </SidebarProvider>
    </ThemeProvider>
  );
}
