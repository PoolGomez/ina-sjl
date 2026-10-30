'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { useSidebar } from '../../lib/sidebarContext';
import {
  Sparkles,
  ChevronDown,
  Tv2,
  Globe,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import {
  iglesiaNavItems,
  eventosNavItems,
  adminSubItems,
  NavItemDef,
  TabType,
  AdminSubTab,
} from '../../lib/navItems';
import { ConfiguracionEvento, UserPermissions } from '../../lib/types';

export interface AppSidebarProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  activeAdminSubTab?: AdminSubTab;
  onAdminSubTabChange?: (subTab: AdminSubTab) => void;
  onViewLanding?: () => void;
  config: ConfiguracionEvento;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onTabChange,
  activeAdminSubTab,
  onAdminSubTabChange,
  onViewLanding,
  config,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();

  const isAdminRoute =
    pathname.startsWith('/system/admin') || activeTab === 'admin';
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute);
  const [iglesiaGroupOpen, setIglesiaGroupOpen] = useState(true);
  const [eventosGroupOpen, setEventosGroupOpen] = useState(true);
  const adminSubmenuRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (isAdminRoute) {
      setAdminExpanded(true);
    }
  }, [isAdminRoute]);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // Auto-scroll so the last options of Administración are always visible when expanded
  useEffect(() => {
    if (adminExpanded && showFull && adminSubmenuRef.current) {
      const timer = setTimeout(() => {
        adminSubmenuRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [adminExpanded, showFull]);

  const hasPermission = (perm?: keyof UserPermissions) => {
    if (!perm) return true;
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return Boolean(user.permisos?.[perm]);
  };

  const visibleIglesiaItems = iglesiaNavItems.filter((item) => {
    if (item.superAdminOnly) {
      return Boolean(
        user?.isSuperAdmin || user?.permisos?.puedeGestionarUsuarios
      );
    }
    return hasPermission(item.requiredPerm);
  });

  const visibleEventosItems = eventosNavItems.filter((item) =>
    hasPermission(item.requiredPerm)
  );

  const isItemActive = (item: NavItemDef) => {
    if (item.id === 'admin') return isAdminRoute;
    if (activeTab) return activeTab === item.id;
    return pathname === item.href;
  };

  const handleNavClick = (item: NavItemDef) => {
    closeMobileSidebar();
    if (onTabChange) {
      onTabChange(item.id);
    } else {
      router.push(item.href);
    }
  };

  const handleAdminSubModuleClick = (sub: (typeof adminSubItems)[number]) => {
    closeMobileSidebar();
    if (onAdminSubTabChange) {
      onAdminSubTabChange(sub.id);
    } else {
      router.push(sub.href);
    }
  };

  const handleGoToLanding = () => {
    closeMobileSidebar();
    if (onViewLanding) {
      onViewLanding();
    } else {
      router.push('/');
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-gray-200 bg-white px-4 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 print:hidden ${
        isExpanded || isMobileOpen
          ? 'w-[290px]'
          : isHovered
          ? 'w-[290px]'
          : 'w-[90px]'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* TailAdmin Sidebar Logo Header */}
      <div
        className={`flex py-4 border-b border-gray-100 dark:border-gray-800/80 mb-2 flex-shrink-0 ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start px-1'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            const first = visibleIglesiaItems[0] || visibleEventosItems[0];
            if (first) handleNavClick(first);
          }}
          className="flex items-center gap-3 focus:outline-none text-left group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-sm flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {showFull && (
            <div className="min-w-0">
              <span className="block font-bold text-sm tracking-tight text-gray-900 dark:text-white leading-tight truncate">
                INA Plataforma
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Iglesia Nueva Apostólica
              </span>
            </div>
          )}
        </button>
      </div>

      {/* TailAdmin Scrollable Menu List */}
      <div className="custom-scrollbar flex flex-1 min-h-0 flex-col overflow-y-auto overscroll-contain duration-300 ease-linear pb-8 pr-1">
        <nav className="mb-4">
          <div className="flex flex-col gap-4">
            {/* GROUP 1: GESTIÓN DE IGLESIA INA */}
            {visibleIglesiaItems.length > 0 && (
              <div>
                {showFull ? (
                  <button
                    type="button"
                    onClick={() => setIglesiaGroupOpen((prev) => !prev)}
                    className="mb-2 flex w-full items-center justify-between px-2 text-[11px] leading-5 font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-wider transition cursor-pointer"
                  >
                    <span>Gestión de Iglesia INA</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        iglesiaGroupOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <h2 className="mb-2 flex justify-center text-xs leading-5 font-semibold text-gray-400 uppercase tracking-wider">
                    <MoreHorizontal className="w-5 h-5" />
                  </h2>
                )}

                {(!showFull || iglesiaGroupOpen) && (
                  <ul className="flex flex-col gap-0.5">
                    {visibleIglesiaItems.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleNavClick(item)}
                            title={!showFull ? item.label : undefined}
                            className={`group menu-item !py-2 cursor-pointer ${
                              active ? 'menu-item-active' : 'menu-item-inactive'
                            } ${
                              !isExpanded && !isHovered
                                ? 'lg:justify-center'
                                : 'justify-start'
                            }`}
                          >
                            <span
                              className={
                                active
                                  ? 'menu-item-icon-active'
                                  : 'menu-item-icon-inactive'
                              }
                            >
                              <Icon className="w-5 h-5" />
                            </span>
                            {showFull && (
                              <span className="menu-item-text truncate">
                                {item.label}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* GROUP 2: MÓDULO DE EVENTOS */}
            {visibleEventosItems.length > 0 && (
              <div>
                {showFull ? (
                  <button
                    type="button"
                    onClick={() => setEventosGroupOpen((prev) => !prev)}
                    className="mb-2 flex w-full items-center justify-between px-2 text-[11px] leading-5 font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-wider transition cursor-pointer"
                  >
                    <span>
                      Eventos ({config.nombreEvento ? 'Activo' : 'INA'})
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        eventosGroupOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <h2 className="mb-2 flex justify-center text-xs leading-5 font-semibold text-gray-400 uppercase tracking-wider">
                    <MoreHorizontal className="w-5 h-5" />
                  </h2>
                )}

                {(!showFull || eventosGroupOpen) && (
                  <ul className="flex flex-col gap-0.5">
                    {visibleEventosItems.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);
                      const isAdminItem = item.id === 'admin';

                      if (isAdminItem) {
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => setAdminExpanded((prev) => !prev)}
                              title={!showFull ? item.label : undefined}
                              className={`group menu-item !py-2 cursor-pointer ${
                                active || adminExpanded
                                  ? 'menu-item-active'
                                  : 'menu-item-inactive'
                              } ${
                                !isExpanded && !isHovered
                                  ? 'lg:justify-center'
                                  : 'justify-start'
                              }`}
                            >
                              <span
                                className={
                                  active || adminExpanded
                                    ? 'menu-item-icon-active'
                                    : 'menu-item-icon-inactive'
                                }
                              >
                                <Icon className="w-5 h-5" />
                              </span>
                              {showFull && (
                                <>
                                  <span className="menu-item-text flex-1 text-left truncate">
                                    {item.label}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                      adminExpanded
                                        ? 'rotate-180 text-brand-500 dark:text-brand-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  />
                                </>
                              )}
                            </button>

                            {showFull && adminExpanded && (
                              <ul
                                ref={adminSubmenuRef}
                                className="ms-5 ps-3 mt-1 space-y-0.5 border-l-2 border-brand-500/20 dark:border-brand-400/20 pb-1"
                              >
                                {adminSubItems.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubActive = activeAdminSubTab
                                    ? isAdminRoute &&
                                      activeAdminSubTab === sub.id
                                    : pathname === sub.href ||
                                      (pathname === '/system/admin' &&
                                        sub.id === 'viandas');
                                  return (
                                    <li key={sub.id}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAdminSubModuleClick(sub)
                                        }
                                        className={`w-full menu-dropdown-item !py-1.5 !text-xs cursor-pointer ${
                                          isSubActive
                                            ? 'menu-dropdown-item-active font-semibold'
                                            : 'menu-dropdown-item-inactive'
                                        }`}
                                      >
                                        <SubIcon
                                          className={`w-4 h-4 flex-shrink-0 ${sub.color}`}
                                        />
                                        <span className="truncate">
                                          {sub.label}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      }

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleNavClick(item)}
                            title={!showFull ? item.label : undefined}
                            className={`group menu-item !py-2 cursor-pointer ${
                              active ? 'menu-item-active' : 'menu-item-inactive'
                            } ${
                              !isExpanded && !isHovered
                                ? 'lg:justify-center'
                                : 'justify-start'
                            }`}
                          >
                            <span
                              className={
                                active
                                  ? 'menu-item-icon-active'
                                  : 'menu-item-icon-inactive'
                              }
                            >
                              <Icon className="w-5 h-5" />
                            </span>
                            {showFull && (
                              <span className="menu-item-text truncate">
                                {item.label}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* GROUP 3: OTROS / ACCESOS PÚBLICOS */}
            <div>
              <h2
                className={`mb-2 flex px-2 text-[11px] leading-5 font-semibold text-gray-400 uppercase tracking-wider ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {showFull ? (
                  'Accesos Públicos'
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    type="button"
                    onClick={handleGoToLanding}
                    title={!showFull ? 'Portada Web INA' : undefined}
                    className={`group menu-item !py-2 menu-item-inactive cursor-pointer ${
                      !isExpanded && !isHovered
                        ? 'lg:justify-center'
                        : 'justify-start'
                    }`}
                  >
                    <span className="menu-item-icon-inactive">
                      <Globe className="w-5 h-5" />
                    </span>
                    {showFull && (
                      <span className="menu-item-text truncate">
                        Portada Web INA
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <Link
                    href="/system/transmision"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => closeMobileSidebar()}
                    title={!showFull ? 'Transmisión TV' : undefined}
                    className={`group menu-item !py-2 menu-item-inactive ${
                      !isExpanded && !isHovered
                        ? 'lg:justify-center'
                        : 'justify-start'
                    }`}
                  >
                    <span className="text-error-500">
                      <Tv2 className="w-5 h-5" />
                    </span>
                    {showFull && (
                      <>
                        <span className="menu-item-text flex-1 truncate">
                          Transmisión TV
                        </span>
                        <span className="inline-block w-2 h-2 rounded-full bg-error-500 animate-ping" />
                      </>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* TailAdmin SidebarWidget */}
        {showFull && config.nombreEvento && (
          <div className="mt-auto mx-auto w-full rounded-2xl bg-gray-50 px-3.5 py-3 text-center dark:bg-white/[0.03] border border-gray-200/80 dark:border-gray-800 flex-shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 text-[10px] font-semibold mb-1">
              <Calendar className="w-3 h-3" />
              Evento Activo
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-xs truncate">
              {config.nombreEvento}
            </h3>
            {config.fechaEvento && (
              <p className="text-gray-500 text-[11px] dark:text-gray-400 mt-0.5">
                {config.lugar ? `${config.lugar} • ` : ''}
                {config.fechaEvento}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
