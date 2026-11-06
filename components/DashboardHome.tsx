'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import {
  ConfiguracionEvento,
  TarjetaBingoVenta,
  TicketEventoVenta,
  TicketVianda,
  UserPermissions,
} from '../lib/types';
import {
  getTarjetasBingoVentas,
  getTicketsEventoVentas,
  getTicketsViandas,
} from '../lib/storage';
import {
  asistenciaRepository,
  iglesiaRepository,
  miembroRepository,
} from '../core/container';
import { iglesiaNavItems, eventosNavItems, NavItemDef } from '../lib/navItems';
import {
  ShoppingCart,
  UtensilsCrossed,
  Receipt,
  CircleDot,
  Users,
  Building2,
  Layers,
  ClipboardCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Ban,
  Calendar,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  Activity,
} from 'lucide-react';

interface DashboardHomeProps {
  config: ConfiguracionEvento;
}

interface RecentSaleItem {
  id: string;
  codigoRecibo: string;
  compradorNombre: string;
  tipo: 'Viandas' | 'Tickets' | 'Bingo';
  total: number;
  estadoPago: string;
  fechaCreacion: string;
  href: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ config }) => {
  const { user } = useAuth();
  const [loadingData, setLoadingData] = useState(true);

  // Event sales state
  const [viandasVentas, setViandasVentas] = useState<TicketVianda[]>([]);
  const [ticketsVentas, setTicketsVentas] = useState<TicketEventoVenta[]>([]);
  const [bingoVentas, setBingoVentas] = useState<TarjetaBingoVenta[]>([]);

  // Church stats state
  const [totalMiembros, setTotalMiembros] = useState(0);
  const [miembrosActivos, setMiembrosActivos] = useState(0);
  const [totalSedes, setTotalSedes] = useState(0);
  const [totalGrupos, setTotalGrupos] = useState(0);
  const [totalAsistencias, setTotalAsistencias] = useState(0);
  const [ultimaAsistenciaFecha, setUltimaAsistenciaFecha] = useState<string | null>(null);

  const hasPermission = (perm?: keyof UserPermissions) => {
    if (!perm) return true;
    if (!user) return false;
    if (user.isSuperAdmin || user.role === 'admin') return true;
    return Boolean(user.permisos?.[perm]);
  };

  const hasItemPermission = (item: NavItemDef) => {
    if (item.superAdminOnly) {
      return Boolean(user?.isSuperAdmin || user?.permisos?.puedeGestionarUsuarios);
    }
    if (item.requiredPerms && item.requiredPerms.length > 0) {
      return item.requiredPerms.some((perm) => hasPermission(perm));
    }
    return hasPermission(item.requiredPerm);
  };

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      setLoadingData(true);
      try {
        const [
          vVentas,
          tVentas,
          bVentas,
          miembros,
          sedes,
          grupos,
          asistencias,
        ] = await Promise.all([
          getTicketsViandas(),
          getTicketsEventoVentas(),
          getTarjetasBingoVentas(),
          miembroRepository.getAll(),
          iglesiaRepository.getSedes(),
          iglesiaRepository.getGrupos(),
          asistenciaRepository.getAll(),
        ]);

        if (!mounted) return;

        setViandasVentas(vVentas);
        setTicketsVentas(tVentas);
        setBingoVentas(bVentas);

        setTotalMiembros(miembros.length);
        setMiembrosActivos(miembros.filter((m) => m.activo).length);
        setTotalSedes(sedes.filter((s) => s.activa).length);
        setTotalGrupos(grupos.filter((g) => g.activo).length);
        setTotalAsistencias(asistencias.length);
        setUltimaAsistenciaFecha(asistencias[0]?.fecha || null);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, [config.id]);

  // Event KPI calculations (filtered by active event if available)
  const eventStats = useMemo(() => {
    const filterByEvent = <T extends { eventoId?: string }>(items: T[]) => {
      if (!config.id) return items;
      const matched = items.filter((item) => !item.eventoId || item.eventoId === config.id);
      return matched.length > 0 ? matched : items;
    };

    const vList = filterByEvent(viandasVentas);
    const tList = filterByEvent(ticketsVentas);
    const bList = filterByEvent(bingoVentas);

    const vPagadas = vList.filter((v) => v.estadoPago === 'pagado');
    const tPagadas = tList.filter((t) => t.estadoPago === 'pagado');
    const bPagadas = bList.filter((b) => b.estadoPago === 'pagado');

    const vPendientes = vList.filter((v) => v.estadoPago === 'pendiente');
    const tPendientes = tList.filter((t) => t.estadoPago === 'pendiente');
    const bPendientes = bList.filter((b) => b.estadoPago === 'pendiente');

    const recaudadoViandas = vPagadas.reduce((acc, v) => acc + v.total, 0);
    const recaudadoTickets = tPagadas.reduce((acc, t) => acc + t.total, 0);
    const recaudadoBingo = bPagadas.reduce((acc, b) => acc + b.precioCobrado, 0);
    const recaudacionTotal = recaudadoViandas + recaudadoTickets + recaudadoBingo;

    const montoPendiente =
      vPendientes.reduce((acc, v) => acc + v.total, 0) +
      tPendientes.reduce((acc, t) => acc + t.total, 0) +
      bPendientes.reduce((acc, b) => acc + b.precioCobrado, 0);

    const cantidadPendientes =
      vPendientes.length + tPendientes.length + bPendientes.length;

    const platosVendidos = vList
      .filter((v) => v.estadoPago !== 'anulado')
      .reduce(
        (acc, v) => acc + v.items.reduce((sum, item) => sum + item.cantidad, 0),
        0
      );

    const ticketsVendidos = tList
      .filter((t) => t.estadoPago !== 'anulado')
      .reduce(
        (acc, t) => acc + t.items.reduce((sum, item) => sum + item.cantidad, 0),
        0
      );

    const cartonesVendidos = bList
      .filter((b) => b.estadoPago !== 'anulado')
      .reduce(
        (acc, b) =>
          acc +
          (Array.isArray(b.numerosTarjetas) && b.numerosTarjetas.length > 0
            ? b.numerosTarjetas.length
            : b.cantidad || 1),
        0
      );

    // Recent combined sales
    const recentSales: RecentSaleItem[] = [
      ...vList.map((v) => ({
        id: `v-${v.id}`,
        codigoRecibo: v.numeroTicket,
        compradorNombre: v.comprador,
        tipo: 'Viandas' as const,
        total: v.total,
        estadoPago: v.estadoPago,
        fechaCreacion: v.fecha,
        href: '/system/viandas',
      })),
      ...tList.map((t) => ({
        id: `t-${t.id}`,
        codigoRecibo: t.numeroTicket,
        compradorNombre: t.comprador,
        tipo: 'Tickets' as const,
        total: t.total,
        estadoPago: t.estadoPago,
        fechaCreacion: t.fecha,
        href: '/system/tickets',
      })),
      ...bList.map((b) => ({
        id: `b-${b.id}`,
        codigoRecibo: b.numeroTicket,
        compradorNombre: b.comprador,
        tipo: 'Bingo' as const,
        total: b.precioCobrado,
        estadoPago: b.estadoPago,
        fechaCreacion: b.fecha,
        href: '/system/bingo-venta',
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      )
      .slice(0, 7);

    return {
      recaudacionTotal,
      recaudadoViandas,
      recaudadoTickets,
      recaudadoBingo,
      montoPendiente,
      cantidadPendientes,
      platosVendidos,
      ticketsVendidos,
      cartonesVendidos,
      totalOperacionesViandas: vList.length,
      totalOperacionesTickets: tList.length,
      totalOperacionesBingo: bList.length,
      recentSales,
    };
  }, [viandasVentas, ticketsVentas, bingoVentas, config.id]);

  const visibleIglesiaModules = iglesiaNavItems.filter(hasItemPermission);
  const visibleEventoModules = eventosNavItems.filter(
    (item) => item.id !== 'dashboard' && hasItemPermission(item)
  );

  const canAccessPOS =
    hasPermission('puedeAccederVentas') ||
    hasPermission('puedeVenderViandas') ||
    hasPermission('puedeVenderTickets') ||
    hasPermission('puedeVenderBingo');

  const roleLabel = user?.isSuperAdmin
    ? 'Super Administrador'
    : user?.role === 'admin'
    ? 'Administrador'
    : 'Operador de Plataforma';

  return (
    <div className="space-y-6">
      {/* ── Welcome Hero Card ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-theme-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panel Principal • {roleLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ¡Bienvenido, {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Resumen general en tiempo real de la{' '}
              <strong className="text-white">Iglesia Nueva Apostólica (INA)</strong> y
              del evento activo{' '}
              <strong className="text-amber-300">
                {config.nombreEvento || 'Evento Fraternal'}
              </strong>
              .
            </p>

            {config.nombreEvento && (
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {config.fechaEvento || 'Fecha abierta'}
                </span>
                {config.lugar && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {config.lugar}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] tracking-wider ${
                    config.estado === 'finalizado'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.estado === 'finalizado' ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                  Evento {config.estado === 'finalizado' ? 'Finalizado' : 'Abierto'}
                </span>
              </div>
            )}
          </div>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {canAccessPOS && (
              <Link
                href="/system/ventas"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Ir a Punto de Ventas
              </Link>
            )}
            {hasPermission('puedeRegistrarAsistencia') && (
              <Link
                href="/system/asistencia"
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4 text-sky-300" />
                Registrar Asistencia
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Sales KPI Cards ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Indicadores del Evento Activo ({config.nombreEvento || 'General'})
          </h2>
          {canAccessPOS && (
            <Link
              href="/system/ventas"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Abrir Terminal POS <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Total Recaudado */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recaudación Pagada
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {loadingData ? '...' : `S/ ${eventStats.recaudacionTotal.toLocaleString()}`}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Por cobrar ({eventStats.cantidadPendientes}):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                S/ {eventStats.montoPendiente.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Card 2: Viandas */}
          <Link
            href="/system/viandas"
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 shadow-xs transition flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-orange-600 transition">
                  Viandas Vendidas
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {loadingData ? '...' : eventStats.platosVendidos}
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">
                    platos
                  </span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {eventStats.totalOperacionesViandas} recibos emitidos
              </span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                S/ {eventStats.recaudadoViandas.toLocaleString()}
              </span>
            </div>
          </Link>

          {/* Card 3: Tickets */}
          <Link
            href="/system/tickets"
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 shadow-xs transition flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-600 transition">
                  Tickets de Evento
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {loadingData ? '...' : eventStats.ticketsVendidos}
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">
                    tickets
                  </span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {eventStats.totalOperacionesTickets} recibos emitidos
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                S/ {eventStats.recaudadoTickets.toLocaleString()}
              </span>
            </div>
          </Link>

          {/* Card 4: Tarjetas Bingo */}
          <Link
            href="/system/bingo-venta"
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-xs transition flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition">
                  Tarjetas de Bingo
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {loadingData ? '...' : eventStats.cartonesVendidos}
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">
                    cartones
                  </span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CircleDot className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {eventStats.totalOperacionesBingo} recibos emitidos
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                S/ {eventStats.recaudadoBingo.toLocaleString()}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Church Stats Row ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-sky-500" />
          Estadísticas de Gestión de Iglesia INA
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/system/membresia"
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-sky-300 transition flex items-center gap-3.5 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Padrón Membresía
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {loadingData ? '...' : miembrosActivos}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  / {totalMiembros}
                </span>
              </p>
            </div>
          </Link>

          <Link
            href="/system/sedes"
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition flex items-center gap-3.5 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Sedes Activas
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {loadingData ? '...' : totalSedes}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  comunidades
                </span>
              </p>
            </div>
          </Link>

          <Link
            href="/system/grupos"
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-teal-300 transition flex items-center gap-3.5 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Grupos Pastorales
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {loadingData ? '...' : totalGrupos}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  grupos
                </span>
              </p>
            </div>
          </Link>

          <Link
            href="/system/asistencia"
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-purple-300 transition flex items-center gap-3.5 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Sesiones Asistencia
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {loadingData ? '...' : totalAsistencias}
                {ultimaAsistenciaFecha && (
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                    ({ultimaAsistenciaFecha})
                  </span>
                )}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Two-Column Section: Recent Sales & Quick Module Directory ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Sales Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Últimas Ventas Registradas
              </h3>
              <p className="text-xs text-slate-500">
                Movimientos recientes de Viandas, Tickets y Tarjetas de Bingo
              </p>
            </div>
            {canAccessPOS && (
              <Link
                href="/system/ventas"
                className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 transition"
              >
                + Nueva Venta
              </Link>
            )}
          </div>

          {eventStats.recentSales.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <ShoppingCart className="w-9 h-9 mb-2 opacity-30" />
              <p className="text-sm font-medium">
                Aún no se registran ventas en este evento
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {eventStats.recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={sale.href}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
                        sale.tipo === 'Viandas'
                          ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                          : sale.tipo === 'Tickets'
                          ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {sale.tipo}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {sale.compradorNombre}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {sale.codigoRecibo} •{' '}
                        {new Date(sale.fechaCreacion).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        sale.estadoPago === 'pagado'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : sale.estadoPago === 'anulado'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {sale.estadoPago === 'pagado' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Pagado
                        </>
                      ) : sale.estadoPago === 'anulado' ? (
                        <>
                          <Ban className="w-3 h-3" /> Anulado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pendiente
                        </>
                      )}
                    </span>
                    <span
                      className={`text-sm font-black ${
                        sale.estadoPago === 'anulado'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      S/ {sale.total.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Accessible Modules Grid (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Accesos Rápidos Habilitados
            </h3>
            <p className="text-xs text-slate-500">
              Módulos disponibles según tus permisos de usuario
            </p>
          </div>

          {visibleEventoModules.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Módulo de Eventos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {visibleEventoModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2.5"
                    >
                      <span className={`${mod.color} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {mod.shortLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {visibleIglesiaModules.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gestión de Iglesia INA
              </p>
              <div className="grid grid-cols-2 gap-2">
                {visibleIglesiaModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2.5"
                    >
                      <span className={`${mod.color} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {mod.shortLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardHome;
