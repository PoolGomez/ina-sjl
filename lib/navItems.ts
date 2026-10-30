import React from 'react';
import {
  UtensilsCrossed,
  Ticket,
  CircleDot,
  Gift,
  CheckCircle2,
  Settings,
  Tv2,
  Printer,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Users,
  ClipboardCheck,
  BarChart3,
  Building2,
  Layers,
  Award,
  Receipt,
} from 'lucide-react';
import { UserPermissions } from './types';

export type TabType =
  | 'iglesia-membresia'
  | 'iglesia-sedes'
  | 'iglesia-grupos'
  | 'iglesia-ministerios'
  | 'iglesia-asistencia'
  | 'iglesia-metricas'
  | 'iglesia-usuarios'
  | 'viandas'
  | 'tickets'
  | 'bingo-venta'
  | 'bingo-juego'
  | 'bingo-juego2'
  | 'sorteos'
  | 'verificacion'
  | 'admin';

export type AdminSubTab =
  | 'viandas'
  | 'tickets'
  | 'bingo'
  | 'evento'
  | 'impresion'
  | 'pagos'
  | 'metricas';

export interface NavItemDef {
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
    href: '/system/membresia',
    label: 'Padrón de Membresía',
    shortLabel: 'Membresía',
    icon: Users,
    color: 'text-sky-500',
    gradient: 'from-sky-500 to-indigo-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-sky-500',
    requiredPerm: 'puedeGestionarMembresia',
  },
  {
    id: 'iglesia-sedes',
    href: '/system/sedes',
    label: 'Sedes y Ubicaciones',
    shortLabel: 'Sedes',
    icon: Building2,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-blue-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeGestionarSedes',
  },
  {
    id: 'iglesia-grupos',
    href: '/system/grupos',
    label: 'Grupos y Pastorales',
    shortLabel: 'Grupos',
    icon: Layers,
    color: 'text-teal-500',
    gradient: 'from-teal-500 to-emerald-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-teal-500',
    requiredPerm: 'puedeGestionarGrupos',
  },
  {
    id: 'iglesia-ministerios',
    href: '/system/ministerios',
    label: 'Gestión de Ministerios',
    shortLabel: 'Ministerios',
    icon: Award,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-purple-500',
    requiredPerm: 'puedeGestionarMinisterios',
  },
  {
    id: 'iglesia-asistencia',
    href: '/system/asistencia',
    label: 'Asistencia por Reuniones',
    shortLabel: 'Asistencia',
    icon: ClipboardCheck,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-purple-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeRegistrarAsistencia',
  },
  {
    id: 'iglesia-metricas',
    href: '/system/metricas-iglesia',
    label: 'Métricas de Asistencia',
    shortLabel: 'Métricas INA',
    icon: BarChart3,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-emerald-500',
    requiredPerm: 'puedeVerMetricasIglesia',
  },
  {
    id: 'iglesia-usuarios',
    href: '/system/usuarios',
    label: 'Usuarios y Permisos',
    shortLabel: 'Usuarios',
    icon: ShieldCheck,
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-rose-600',
    requiredPerm: 'puedeGestionarUsuarios',
  },
];

export const eventosNavItems: NavItemDef[] = [
  {
    id: 'viandas',
    href: '/system/viandas',
    label: 'Venta de Viandas',
    shortLabel: 'Viandas',
    icon: UtensilsCrossed,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-amber-500',
    requiredPerm: 'puedeVenderViandas',
  },
  {
    id: 'tickets',
    href: '/system/tickets',
    label: 'Venta de Tickets',
    shortLabel: 'Tickets',
    icon: Receipt,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-blue-600',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-cyan-500',
    requiredPerm: 'puedeVenderTickets',
  },
  {
    id: 'bingo-venta',
    href: '/system/bingo-venta',
    label: 'Venta de Tarjetas',
    shortLabel: 'Tarjetas',
    icon: Ticket,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-blue-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-indigo-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'bingo-juego',
    href: '/system/bingo-juego',
    label: 'Juego de Bingo',
    shortLabel: 'Bingo',
    icon: CircleDot,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-purple-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'bingo-juego2',
    href: '/system/bingo-juego2',
    label: 'Bingo en Vivo 2',
    shortLabel: 'Bingo 2',
    icon: Tv2,
    color: 'text-sky-500',
    gradient: 'from-sky-500 to-cyan-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-sky-500',
    requiredPerm: 'puedeVenderBingo',
  },
  {
    id: 'sorteos',
    href: '/system/sorteos',
    label: 'Sorteos',
    shortLabel: 'Sorteos',
    icon: Gift,
    color: 'text-rose-500',
    gradient: 'from-rose-500 to-red-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-rose-500',
    requiredPerm: 'puedeVerSorteos',
  },
  {
    id: 'verificacion',
    href: '/system/verificacion',
    label: 'Verificación',
    shortLabel: 'Verificar',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
    dot: 'bg-emerald-500',
    requiredPerm: 'puedeVerificacion',
  },
  {
    id: 'admin',
    href: '/system/admin',
    label: 'Administración',
    shortLabel: 'Admin',
    icon: Settings,
    color: 'text-slate-500',
    gradient: 'from-slate-500 to-slate-700',
    activeBg: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
    hoverBg: 'hover:bg-gray-100 dark:hover:bg-white/5',
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
    href: '/system/admin/viandas',
    label: 'Viandas y Precios',
    icon: UtensilsCrossed,
    color: 'text-amber-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'tickets',
    href: '/system/admin/tickets',
    label: 'Tickets y Precios',
    icon: Receipt,
    color: 'text-cyan-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'bingo',
    href: '/system/admin/bingo',
    label: 'Precios de Bingo',
    icon: Ticket,
    color: 'text-indigo-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'evento',
    href: '/system/admin/evento',
    label: 'Datos del Evento',
    icon: Settings,
    color: 'text-purple-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'impresion',
    href: '/system/admin/impresion',
    label: 'Opciones de Impresión',
    icon: Printer,
    color: 'text-teal-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'pagos',
    href: '/system/admin/pagos',
    label: 'Modalidades de Pago',
    icon: CreditCard,
    color: 'text-rose-500',
    activeClass: 'menu-dropdown-item-active',
  },
  {
    id: 'metricas',
    href: '/system/admin/metricas',
    label: 'Métricas Financieras',
    icon: TrendingUp,
    color: 'text-emerald-500',
    activeClass: 'menu-dropdown-item-active',
  },
];
