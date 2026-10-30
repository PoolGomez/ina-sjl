'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { useSidebar } from '../../lib/sidebarContext';
import { ThemeToggleButton } from '../ThemeToggleButton';
import {
  LogOut,
  ChevronDown,
  Tv2,
  Globe,
  Search,
} from 'lucide-react';
import {
  iglesiaNavItems,
  eventosNavItems,
  adminSubItems,
  TabType,
  AdminSubTab,
} from '../../lib/navItems';
import { ConfiguracionEvento, UserPermissions } from '../../lib/types';

export interface AppHeaderProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  activeAdminSubTab?: AdminSubTab;
  onAdminSubTabChange?: (subTab: AdminSubTab) => void;
  onViewLanding?: () => void;
  config: ConfiguracionEvento;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onViewLanding,
  config,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPermission = (perm?: keyof UserPermissions) => {
    if (!perm) return true;
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return Boolean(user.permisos?.[perm]);
  };

  const allSearchableItems = [
    ...iglesiaNavItems
      .filter((i) => hasPermission(i.requiredPerm))
      .map((i) => ({ label: i.label, href: i.href, category: 'Iglesia INA' })),
    ...eventosNavItems
      .filter((i) => i.id !== 'admin' && hasPermission(i.requiredPerm))
      .map((i) => ({ label: i.label, href: i.href, category: 'Eventos' })),
    ...(hasPermission('puedeAdministrar')
      ? adminSubItems.map((s) => ({
          label: s.label,
          href: s.href,
          category: 'Administración',
        }))
      : []),
  ];

  const filteredSearchItems = searchQuery.trim()
    ? allSearchableItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const currentModuleTitle =
    allSearchableItems.find((item) => item.href === pathname)?.label ||
    config.nombreEvento ||
    'Panel de Gestión INA';

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 print:hidden">
      <div className="flex grow items-center justify-between px-3 py-3 sm:px-6 lg:py-4 gap-3">
        {/* Left: Sidebar Toggle + TailAdmin Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button
            id="sidebar-toggle"
            type="button"
            onClick={handleToggleSidebar}
            aria-label="Alternar menú lateral"
            className="flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585786 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41421 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* TailAdmin Command Search Bar (Desktop) */}
          <div className="hidden md:block relative w-full max-w-[380px]">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
                placeholder="Ir a módulo (Membresía, Viandas, Bingo...)"
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-11 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                <span>⌘</span>
                <span>K</span>
              </span>
            </div>

            {isSearchFocused && filteredSearchItems.length > 0 && (
              <div className="absolute left-0 top-12 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-50">
                {filteredSearchItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onMouseDown={() => {
                      router.push(item.href);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-gray-400">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile current module title */}
          <div className="md:hidden truncate">
            <span className="font-bold text-sm text-gray-900 dark:text-white truncate block">
              {currentModuleTitle}
            </span>
          </div>
        </div>

        {/* Right: Next.js Docs Theme Switcher + Quick Actions + UserDropdown */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Next.js Documentation Theme Switcher (System / Light / Dark) */}
          <ThemeToggleButton />

          <button
            type="button"
            onClick={() => {
              if (onViewLanding) onViewLanding();
              else router.push('/');
            }}
            title="Ver Portada Pública de la Iglesia Nueva Apostólica"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300 text-xs font-medium transition-colors"
          >
            <Globe className="w-4 h-4 text-brand-500" />
            <span>Portada INA</span>
          </button>

          <Link
            href="/system/transmision"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir Pantalla de Transmisión en Vivo"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-error-600 hover:bg-error-500 text-white text-xs font-semibold shadow-theme-xs transition-colors"
          >
            <Tv2 className="w-4 h-4" />
            <span>TV En Vivo</span>
          </Link>

          {/* TailAdmin UserDropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              className="flex items-center text-gray-700 dark:text-gray-400 gap-2.5 focus:outline-none"
            >
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-sm shadow-theme-xs flex-shrink-0">
                {(user?.displayName || user?.email || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <span className="hidden xl:block font-medium text-theme-sm text-gray-700 dark:text-gray-200 max-w-[130px] truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
              </span>
              <ChevronDown
                className={`hidden xl:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isUserDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-3 w-[260px] flex flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50">
                <div className="px-2 py-1.5">
                  <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-200 truncate">
                    {user?.displayName || 'Usuario INA'}
                  </span>
                  <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </span>
                  <span className="mt-1.5 inline-block rounded-full bg-brand-50 dark:bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase">
                    {user?.role || 'Usuario'}
                  </span>
                </div>

                <ul className="flex flex-col gap-1 pt-3 pb-2 border-t border-b border-gray-200 dark:border-gray-800 mt-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        router.push('/');
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg text-theme-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      Ir a Portada Pública
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/system/transmision"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex w-full items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg text-theme-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Tv2 className="w-4 h-4 text-error-500" />
                      Pantalla Transmisión TV
                    </Link>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    signOut();
                    router.push('/');
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 mt-2 font-medium text-error-600 dark:text-error-400 rounded-lg text-theme-sm hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
