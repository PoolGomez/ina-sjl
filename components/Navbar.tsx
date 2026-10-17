'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import {
  UtensilsCrossed,
  Ticket,
  CircleDot,
  Gift,
  CheckCircle2,
  Settings,
  LogOut,
  Sparkles,
  Cloud,
  HardDrive,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Tv2,
  Printer,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Users,
  ClipboardCheck,
  BarChart3,
  Globe,
  Calendar,
  Building2,
  Layers,
  Award,
} from 'lucide-react';
import { ConfiguracionEvento, UserPermissions } from '../lib/types';

export type TabType =
  | 'iglesia-membresia'
  | 'iglesia-sedes'
  | 'iglesia-grupos'
  | 'iglesia-ministerios'
  | 'iglesia-asistencia'
  | 'iglesia-metricas'
  | 'iglesia-usuarios'
  | 'viandas'
  | 'bingo-venta'
  | 'bingo-juego'
  | 'bingo-juego2'
  | 'sorteos'
  | 'verificacion'
  | 'admin';

export type AdminSubTab =
  | 'viandas'
  | 'bingo'
  | 'evento'
  | 'impresion'
  | 'pagos'
  | 'metricas';

interface NavbarProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  activeAdminSubTab?: AdminSubTab;
  onAdminSubTabChange?: (subTab: AdminSubTab) => void;
  onViewLanding?: () => void;
  config: ConfiguracionEvento;
}

interface NavItemDef {
  id: TabType;
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  activeBg: string;
  hoverBg: string;
  dot: string;
  requiredPerm?: keyof UserPermissions;
  superAdminOnly?: boolean;
}

export const iglesiaNavItems: NavItemDef[] = [
  {
    id: 'iglesia-membresia',
    href: '/membresia',
    label: 'Padrón de Membresía',
    shortLabel: 'Membresía',
    icon: Users,
    color: 'text-sky-500',
    gradient: 'from-sky-500 to-indigo-600',
    activeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
    dot: 'bg-sky-500',
    requiredPerm: 'puedeGestionarMembresia',
  },
  {
    id: 'iglesia-sedes',
    href: '/sedes',
    label: 'Sedes y Ubicaciones',
    shortLabel: 'Sedes',
    icon: Building2,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-blue-600',
    activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeGestionarSedes',
  },
  {
    id: 'iglesia-grupos',
    href: '/grupos',
    label: 'Grupos y Pastorales',
    shortLabel: 'Grupos',
    icon: Layers,
    color: 'text-teal-500',
    gradient: 'from-teal-500 to-emerald-600',
    activeBg: 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300',
    hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
    dot: 'bg-teal-500',
    requiredPerm: 'puedeGestionarGrupos',
  },
  {
    id: 'iglesia-ministerios',
    href: '/ministerios',
    label: 'Gestión de Ministerios',
    shortLabel: 'Ministerios',
    icon: Award,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-600',
    activeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
    dot: 'bg-purple-500',
    requiredPerm: 'puedeGestionarMinisterios',
  },
  {
    id: 'iglesia-asistencia',
    href: '/asistencia',
    label: 'Asistencia por Reuniones',
    shortLabel: 'Asistencia',
    icon: ClipboardCheck,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-purple-600',
    activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeRegistrarAsistencia',
  },
  {
    id: 'iglesia-metricas',
    href: '/metricas-iglesia',
    label: 'Métricas de Asistencia',
    shortLabel: 'Métricas INA',
    icon: BarChart3,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    dot: 'bg-emerald-500',
    requiredPerm: 'puedeVerMetricasIglesia',
  },
  {
    id: 'iglesia-usuarios',
    href: '/usuarios',
    label: 'Usuarios y Permisos',
    shortLabel: 'Usuarios',
    icon: ShieldCheck,
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
    activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
    dot: 'bg-rose-600',
    superAdminOnly: true,
  },
];

export const eventosNavItems: NavItemDef[] = [
  {
    id: 'viandas',
    href: '/viandas',
    label: 'Venta de Viandas',
    shortLabel: 'Viandas',
    icon: UtensilsCrossed,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
    dot: 'bg-amber-500',
    requiredPerm: 'puedeVenderViandas',
  },
  {
    id: 'bingo-venta',
    href: '/bingo-venta',
    label: 'Venta de Tarjetas',
    shortLabel: 'Tarjetas',
    icon: Ticket,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-blue-500',
    activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'bingo-juego',
    href: '/bingo-juego',
    label: 'Juego de Bingo',
    shortLabel: 'Bingo',
    icon: CircleDot,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    activeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
    dot: 'bg-purple-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'bingo-juego2',
    href: '/bingo-juego2',
    label: 'Bingo en Vivo 2',
    shortLabel: 'Bingo 2',
    icon: Tv2,
    color: 'text-sky-500',
    gradient: 'from-sky-500 to-cyan-500',
    activeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
    dot: 'bg-sky-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'sorteos',
    href: '/sorteos',
    label: 'Sorteos',
    shortLabel: 'Sorteos',
    icon: Gift,
    color: 'text-rose-500',
    gradient: 'from-rose-500 to-red-500',
    activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
    dot: 'bg-rose-500',
    requiredPerm: 'puedeVerSorteos',
  },
  {
    id: 'verificacion',
    href: '/verificacion',
    label: 'Verificación',
    shortLabel: 'Verificar',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    dot: 'bg-emerald-500',
    requiredPerm: 'puedeVerificacion',
  },
  {
    id: 'admin',
    href: '/admin',
    label: 'Administración',
    shortLabel: 'Admin',
    icon: Settings,
    color: 'text-slate-500',
    gradient: 'from-slate-500 to-slate-700',
    activeBg: 'bg-slate-500/15 border-slate-500/40 text-slate-800 dark:text-slate-200',
    hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-800/70',
    dot: 'bg-slate-500',
    requiredPerm: 'puedeAdministrar',
  },
];

export const adminSubItems: {
  id: AdminSubTab;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeClass: string;
}[] = [
  {
    id: 'viandas',
    href: '/admin/viandas',
    label: 'Viandas y Precios',
    icon: UtensilsCrossed,
    color: 'text-amber-500',
    activeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black',
  },
  {
    id: 'bingo',
    href: '/admin/bingo',
    label: 'Precios de Bingo',
    icon: Ticket,
    color: 'text-indigo-500',
    activeClass:
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-black',
  },
  {
    id: 'evento',
    href: '/admin/evento',
    label: 'Datos del Evento',
    icon: Settings,
    color: 'text-purple-500',
    activeClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 font-black',
  },
  {
    id: 'impresion',
    href: '/admin/impresion',
    label: 'Opciones de Impresión',
    icon: Printer,
    color: 'text-teal-500',
    activeClass:
      'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40 font-black',
  },
  {
    id: 'pagos',
    href: '/admin/pagos',
    label: 'Modalidades de Pago',
    icon: CreditCard,
    color: 'text-rose-500',
    activeClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-black',
  },
  {
    id: 'metricas',
    href: '/admin/metricas',
    label: 'Métricas Financieras',
    icon: TrendingUp,
    color: 'text-emerald-500',
    activeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-black',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  activeAdminSubTab,
  onAdminSubTabChange,
  onViewLanding,
  config,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, isFirebaseConnected } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventosExpanded, setEventosExpanded] = useState(true);
  const isAdminRoute = pathname.startsWith('/admin') || activeTab === 'admin';
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute);

  useEffect(() => {
    if (isAdminRoute) {
      setAdminExpanded(true);
      setEventosExpanded(true);
    }
  }, [isAdminRoute]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleNavClick = (item: NavItemDef) => {
    setSidebarOpen(false);
    if (onTabChange) {
      onTabChange(item.id);
    } else {
      router.push(item.href);
    }
  };

  const handleAdminSubModuleClick = (sub: (typeof adminSubItems)[number]) => {
    setSidebarOpen(false);
    if (onAdminSubTabChange) {
      onAdminSubTabChange(sub.id);
    } else {
      router.push(sub.href);
    }
  };

  const handleGoToLanding = () => {
    setSidebarOpen(false);
    if (onViewLanding) {
      onViewLanding();
    } else {
      router.push('/');
    }
  };

  const hasPermission = (perm?: keyof UserPermissions) => {
    if (!perm) return true;
    if (!user) return false;
    if (user.isSuperAdmin || user.role === 'admin') return true;
    return Boolean(user.permisos?.[perm]);
  };

  const visibleIglesiaItems = iglesiaNavItems.filter((item) => {
    if (item.superAdminOnly) {
      return Boolean(
        user?.isSuperAdmin ||
          user?.role === 'admin' ||
          user?.permisos?.puedeAdministrar
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

  return (
    <>
      {/* ── Top Header Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 print:hidden shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                id="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú de navegación"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  const first = visibleIglesiaItems[0] || visibleEventosItems[0];
                  if (first) handleNavClick(first);
                }}
                className="flex items-center gap-2 sm:gap-2.5 focus:outline-none group text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-all duration-200 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="hidden xs:block sm:block">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none">
                      IGLESIA NUEVA APOSTÓLICA
                    </span>
                    <span
                      title={
                        isFirebaseConnected
                          ? 'Conectado a Firebase Firestore'
                          : 'Sin conexión a Base de Datos'
                      }
                      className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isFirebaseConnected
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      <Cloud className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{' '}
                      {isFirebaseConnected ? 'Firebase' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-[260px] leading-tight mt-0.5">
                    Gestión de Comunidad, Asistencia &amp;{' '}
                    {config.nombreEvento || 'Eventos INA'}
                  </p>
                </div>
              </button>
            </div>

            {/* Right: Public Landing Button + Live TV link + User info + Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleGoToLanding}
                title="Ver Portada Pública de la Iglesia Nueva Apostólica"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>Portada INA</span>
              </button>

              <Link
                href="/transmision"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir Pantalla de Transmisión en Vivo (segunda pantalla / proyector)"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-sm shadow-red-500/20 transition-all hover:scale-105"
              >
                <Tv2 className="w-3.5 h-3.5" />
                <span>TV En Vivo</span>
              </Link>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {user?.role || 'Usuario'}
                </span>
              </div>

              <button
                onClick={() => {
                  signOut();
                  router.push('/');
                }}
                title="Cerrar sesión"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-900/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Overlay / Backdrop ──────────────────────────────────────── */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 print:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ── Sidebar Panel ───────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-76 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/40 flex flex-col print:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
                IGLESIA NUEVA APOSTÓLICA
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${
                  isFirebaseConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                <Cloud className="w-3 h-3" />{' '}
                {isFirebaseConnected ? 'Firebase' : 'Offline'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {/* SECTION 1: GESTIÓN DE IGLESIA INA */}
          {visibleIglesiaItems.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[10px] uppercase font-black text-sky-600 dark:text-sky-400 tracking-widest mb-1.5">
                Gestión de Iglesia INA
              </p>
              {visibleIglesiaItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group border ${
                      isActive
                        ? `${item.activeBg} shadow-sm`
                        : `border-transparent text-slate-600 dark:text-slate-400 ${item.hoverBg}`
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-md`
                          : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                    </div>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 opacity-60 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* SECTION 2: EVENTOS INA (Expandable) */}
          {visibleEventosItems.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setEventosExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-widest"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Módulo de Eventos ({config.nombreEvento ? 'Activo' : 'INA'})
                </span>
                {eventosExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {eventosExpanded && (
                <div className="space-y-1 pt-1">
                  {visibleEventosItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item);
                    const isAdminItem = item.id === 'admin';

                    if (isAdminItem) {
                      return (
                        <div key={item.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setAdminExpanded((prev) => !prev)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group border ${
                              isActive
                                ? `${item.activeBg} shadow-sm`
                                : `border-transparent text-slate-600 dark:text-slate-400 ${item.hoverBg}`
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                isActive
                                  ? `bg-gradient-to-br ${item.gradient} shadow-md`
                                  : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`}
                              />
                            </div>
                            <span className="flex-1 text-left">{item.label}</span>
                            {adminExpanded ? (
                              <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />
                            )}
                          </button>

                          {adminExpanded && (
                            <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 py-1">
                              {adminSubItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive = activeAdminSubTab
                                  ? isAdminRoute && activeAdminSubTab === sub.id
                                  : pathname === sub.href ||
                                    (pathname === '/admin' && sub.id === 'viandas');
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleAdminSubModuleClick(sub)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      isSubActive
                                        ? sub.activeClass
                                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                                    }`}
                                  >
                                    <SubIcon
                                      className={`w-3.5 h-3.5 flex-shrink-0 ${sub.color}`}
                                    />
                                    <span className="flex-1 text-left truncate">
                                      {sub.label}
                                    </span>
                                    {isSubActive && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group border ${
                          isActive
                            ? `${item.activeBg} shadow-sm`
                            : `border-transparent text-slate-600 dark:text-slate-400 ${item.hoverBg}`
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            isActive
                              ? `bg-gradient-to-br ${item.gradient} shadow-md`
                              : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`}
                          />
                        </div>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 opacity-60 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: ACCESOS PÚBLICOS Y PANTALLAS */}
          <div className="pt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
            <p className="px-2 text-[10px] uppercase font-black text-slate-400 dark:text-slate-600 tracking-widest mb-1">
              Accesos Públicos
            </p>

            <button
              type="button"
              onClick={handleGoToLanding}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all border border-sky-200/50 dark:border-sky-900/40"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="block leading-tight font-extrabold">
                  Portada Web INA
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Landing page institucional
                </span>
              </div>
            </button>

            <Link
              href="/transmision"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-red-200/50 dark:border-red-900/40 group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                <Tv2 className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="block leading-tight font-extrabold">
                  Transmisión TV
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Para proyector o pantalla
                </span>
              </div>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping mr-1" />
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer: User + Logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm">
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                {user?.isDemo ? 'Demo Session' : user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              setSidebarOpen(false);
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-800/60 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
