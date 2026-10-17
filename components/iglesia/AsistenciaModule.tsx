'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  Building2,
  Layers,
  Users,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  BookOpen,
  UserCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  asistenciaRepository,
  iglesiaRepository,
  miembroRepository,
} from '../../core/container';
import {
  ALCANCE_REUNION_LABELS,
  AlcanceReunion,
  filtrarMiembrosConvocadosPorAlcance,
  RegistroAsistenciaMiembro,
  SesionAsistencia,
} from '../../core/domain/entities/asistencia';
import { GrupoIglesia, SedeIglesia } from '../../core/domain/entities/iglesia';
import { getNombreCompletoMiembro, Miembro } from '../../core/domain/entities/miembro';
import { LoadingSpinner } from '../LoadingSpinner';
import { Modal } from '../Modal';

export const AsistenciaModule: React.FC = () => {
  const [sesiones, setSesiones] = useState<SesionAsistencia[]>([]);
  const [sedes, setSedes] = useState<SedeIglesia[]>([]);
  const [grupos, setGrupos] = useState<GrupoIglesia[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters for list of sessions
  const [searchSesion, setSearchSesion] = useState('');
  const [filterAlcance, setFilterAlcance] = useState<string>('todos');
  const [filterSedeId, setFilterSedeId] = useState<string>('todas');
  const [filterGrupoId, setFilterGrupoId] = useState<string>('todos');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSesionId, setEditingSesionId] = useState<string | null>(null);

  // Form fields
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [alcance, setAlcance] = useState<AlcanceReunion>('sede');
  const [sedeId, setSedeId] = useState<string>('');
  const [grupoId, setGrupoId] = useState<string>('');
  const [visitasInvitados, setVisitasInvitados] = useState<number | string>(0);
  const [oficiante, setOficiante] = useState('');
  const [palabraTexto, setPalabraTexto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [registros, setRegistros] = useState<RegistroAsistenciaMiembro[]>([]);
  const [searchMiembroChecklist, setSearchMiembroChecklist] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadData = async () => {
    const [sesList, sList, gList, mList] = await Promise.all([
      asistenciaRepository.getAll(),
      iglesiaRepository.getSedes(),
      iglesiaRepository.getGrupos(),
      miembroRepository.getAll(),
    ]);
    setSesiones(sesList);
    setSedes(sList);
    setGrupos(gList);
    setMiembros(mList);
    if (!sedeId && sList.length > 0) setSedeId(sList[0].id);
    if (!grupoId && gList.length > 0) setGrupoId(gList[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build attendance records automatically when scope / sede / grupo changes (if not editing existing or when user changes scope)
  const rebuildRegistrosFromScope = (
    targetAlcance: AlcanceReunion,
    targetSedeId: string,
    targetGrupoId: string,
    preserveMap?: Map<string, boolean>
  ) => {
    const convocados = filtrarMiembrosConvocadosPorAlcance(
      miembros,
      targetAlcance,
      targetSedeId,
      targetGrupoId
    );
    const nuevos: RegistroAsistenciaMiembro[] = convocados.map((m) => ({
      miembroId: m.id,
      nombreCompleto: getNombreCompletoMiembro(m),
      sedeId: m.sedeId,
      presente: preserveMap?.has(m.id) ? Boolean(preserveMap.get(m.id)) : true,
    }));
    setRegistros(nuevos);
  };

  const handleOpenCreateModal = () => {
    const defaultSede = sedes[0]?.id || 'sede-central';
    const defaultGrupo = grupos[0]?.id || 'grupo-jovenes';
    setEditingSesionId(null);
    setTitulo('Oficio Divino / Reunión INA');
    setFecha(new Date().toISOString().split('T')[0]);
    setHora('10:00');
    setAlcance('sede');
    setSedeId(defaultSede);
    setGrupoId(defaultGrupo);
    setVisitasInvitados(0);
    setOficiante('');
    setPalabraTexto('');
    setObservaciones('');
    setSearchMiembroChecklist('');
    rebuildRegistrosFromScope('sede', defaultSede, defaultGrupo);
    setIsModalOpen(true);
  };

  const handleEditSesion = (s: SesionAsistencia) => {
    setEditingSesionId(s.id);
    setTitulo(s.titulo);
    setFecha(s.fecha);
    setHora(s.hora);
    setAlcance(s.alcance);
    setSedeId(s.sedeId || sedes[0]?.id || '');
    setGrupoId(s.grupoId || grupos[0]?.id || '');
    setVisitasInvitados(s.visitasInvitados || 0);
    setOficiante(s.oficiante || '');
    setPalabraTexto(s.palabraTexto || '');
    setObservaciones(s.observaciones || '');
    setRegistros(s.registros || []);
    setSearchMiembroChecklist('');
    setIsModalOpen(true);
  };

  const handleScopeOrTargetChange = (
    newAlcance: AlcanceReunion,
    newSedeId: string,
    newGrupoId: string
  ) => {
    setAlcance(newAlcance);
    setSedeId(newSedeId);
    setGrupoId(newGrupoId);

    const existingMap = new Map(registros.map((r) => [r.miembroId, r.presente]));
    rebuildRegistrosFromScope(newAlcance, newSedeId, newGrupoId, existingMap);

    // Auto-suggest helpful title if default
    const sedeObj = sedes.find((s) => s.id === newSedeId);
    const grupoObj = grupos.find((g) => g.id === newGrupoId);
    if (newAlcance === 'sede' && sedeObj) {
      setTitulo(`Oficio Divino — ${sedeObj.nombre}`);
    } else if (newAlcance === 'sede_grupo' && sedeObj && grupoObj) {
      setTitulo(`Reunión de ${grupoObj.nombre} — ${sedeObj.nombre}`);
    } else if (newAlcance === 'grupo_general' && grupoObj) {
      setTitulo(`Reunión General de ${grupoObj.nombre}`);
    } else if (newAlcance === 'general') {
      setTitulo('Reunión / Oficio General de la Iglesia INA');
    }
  };

  const togglePresente = (miembroId: string) => {
    setRegistros((prev) =>
      prev.map((r) => (r.miembroId === miembroId ? { ...r, presente: !r.presente } : r))
    );
  };

  const markAll = (presente: boolean) => {
    setRegistros((prev) => prev.map((r) => ({ ...r, presente })));
  };

  const handleSaveSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setIsSaving(true);
    try {
      const totalConvocados = registros.length;
      const totalPresentes = registros.filter((r) => r.presente).length;
      const totalAusentes = totalConvocados - totalPresentes;

      const entity: SesionAsistencia = {
        id: editingSesionId || `asis-ina-${Date.now()}`,
        titulo: titulo.trim(),
        fecha,
        hora,
        alcance,
        ...(alcance === 'sede' || alcance === 'sede_grupo' ? { sedeId } : {}),
        ...(alcance === 'sede_grupo' || alcance === 'grupo_general' ? { grupoId } : {}),
        registros,
        totalConvocados,
        totalPresentes,
        totalAusentes,
        visitasInvitados: Math.max(0, parseInt(String(visitasInvitados)) || 0),
        ...(oficiante.trim() ? { oficiante: oficiante.trim() } : {}),
        ...(palabraTexto.trim() ? { palabraTexto: palabraTexto.trim() } : {}),
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
        fechaCreacion: new Date().toISOString(),
      };

      await asistenciaRepository.save(entity);
      await loadData();
      setIsModalOpen(false);
      showNotice(
        editingSesionId
          ? '¡Registro de asistencia actualizado correctamente!'
          : '¡Asistencia de reunión registrada exitosamente!'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSesion = async (s: SesionAsistencia) => {
    if (!window.confirm(`¿Eliminar el registro de asistencia "${s.titulo}" (${s.fecha})?`)) return;
    await asistenciaRepository.delete(s.id);
    await loadData();
    showNotice('Sesión de asistencia eliminada.');
  };

  const sedeMap = new Map(sedes.map((s) => [s.id, s]));
  const grupoMap = new Map(grupos.map((g) => [g.id, g]));

  const qS = searchSesion.trim().toLowerCase();
  const filteredSesiones = sesiones.filter((s) => {
    if (filterAlcance !== 'todos' && s.alcance !== filterAlcance) return false;
    if (filterSedeId !== 'todas' && s.sedeId !== filterSedeId) return false;
    if (filterGrupoId !== 'todos' && s.grupoId !== filterGrupoId) return false;
    if (!qS) return true;
    return (
      s.titulo.toLowerCase().includes(qS) ||
      s.fecha.includes(qS) ||
      (s.oficiante || '').toLowerCase().includes(qS) ||
      (s.palabraTexto || '').toLowerCase().includes(qS)
    );
  });

  const qChecklist = searchMiembroChecklist.trim().toLowerCase();
  const filteredRegistrosModal = qChecklist
    ? registros.filter((r) => r.nombreCompleto.toLowerCase().includes(qChecklist))
    : registros;

  const presentesEnModal = registros.filter((r) => r.presente).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" /> Control de Asistencia Eclesiástica
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Asistencia por Reuniones y Oficios
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Registra la asistencia por Sede, por Sede y Grupo (ej. Jóvenes de una Sede), por Grupo General (ej. Jóvenes General) o Reunión General.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Asistencia
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchSesion}
              onChange={(e) => setSearchSesion(e.target.value)}
              placeholder="Buscar reunión por título, fecha, oficiante o texto bíblico..."
              className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {searchSesion && (
              <button
                type="button"
                onClick={() => setSearchSesion('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={filterAlcance}
            onChange={(e) => setFilterAlcance(e.target.value)}
            className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="todos">Todos los Alcances</option>
            <option value="sede">Por Sede</option>
            <option value="sede_grupo">Por Sede y Grupo</option>
            <option value="grupo_general">Por Grupo General</option>
            <option value="general">General (Toda la Iglesia)</option>
          </select>

          <select
            value={filterSedeId}
            onChange={(e) => setFilterSedeId(e.target.value)}
            className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="todas">Todas las Sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <select
            value={filterGrupoId}
            onChange={(e) => setFilterGrupoId(e.target.value)}
            className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="todos">Todos los Grupos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.icono} {g.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSesiones.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
            No se encontraron reuniones registradas con esos filtros.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Haz clic en &ldquo;Registrar Nueva Asistencia&rdquo; para tomar asistencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSesiones.map((s) => {
            const sede = s.sedeId ? sedeMap.get(s.sedeId) : undefined;
            const grupo = s.grupoId ? grupoMap.get(s.grupoId) : undefined;
            const pct =
              s.totalConvocados > 0
                ? Math.round((s.totalPresentes / s.totalConvocados) * 100)
                : 0;
            const totalConVisitas = s.totalPresentes + (s.visitasInvitados || 0);

            return (
              <div
                key={s.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {ALCANCE_REUNION_LABELS[s.alcance]?.label || s.alcance}
                        </span>
                        {sede && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">
                            📍 {sede.nombre}
                          </span>
                        )}
                        {grupo && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {grupo.icono} {grupo.nombre}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {s.titulo}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditSesion(s)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                        title="Editar asistencia"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSesion(s)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title="Eliminar asistencia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {s.fecha}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {s.hora} hs
                    </span>
                    {s.oficiante && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {s.oficiante}
                      </span>
                    )}
                  </div>

                  {s.palabraTexto && (
                    <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{s.palabraTexto}</span>
                    </p>
                  )}
                </div>

                {/* Attendance Progress & Stats */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {s.totalPresentes} presentes
                      </span>
                      <span className="text-slate-400">
                        / {s.totalConvocados} convocados ({pct}%)
                      </span>
                      {s.visitasInvitados > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          +{s.visitasInvitados} visitas
                        </span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">
                      Total sala: {totalConVisitas}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Attendance Session */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSesionId
            ? 'Editar Registro de Asistencia'
            : 'Registrar Asistencia de Reunión / Oficio'
        }
        size="full"
      >
        <form onSubmit={handleSaveSesion} className="space-y-4 text-xs">
          {/* Scope Selector */}
          <div>
            <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-2">
              1. Selecciona el Tipo / Alcance de la Reunión *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(Object.keys(ALCANCE_REUNION_LABELS) as AlcanceReunion[]).map((key) => {
                const info = ALCANCE_REUNION_LABELS[key];
                const active = alcance === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleScopeOrTargetChange(key, sedeId, grupoId)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      active
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-black text-xs">{info.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Sede / Grupo selectors depending on scope */}
          {(alcance === 'sede' || alcance === 'sede_grupo' || alcance === 'grupo_general') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {(alcance === 'sede' || alcance === 'sede_grupo') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" /> Sede de la Reunión *
                  </label>
                  <select
                    value={sedeId}
                    onChange={(e) => handleScopeOrTargetChange(alcance, e.target.value, grupoId)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {sedes.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {(alcance === 'sede_grupo' || alcance === 'grupo_general') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" /> Grupo Convocado *
                  </label>
                  <select
                    value={grupoId}
                    onChange={(e) => handleScopeOrTargetChange(alcance, sedeId, e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>{g.icono} {g.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Meeting Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Título de la Reunión / Oficio *</label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Reunión de Jóvenes — Sede Central"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Hora *</label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Oficiante / Responsable</label>
              <input
                type="text"
                value={oficiante}
                onChange={(e) => setOficiante(e.target.value)}
                placeholder="Ej. Pastor Carlos Mendoza"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Palabra / Texto Bíblico</label>
              <input
                type="text"
                value={palabraTexto}
                onChange={(e) => setPalabraTexto(e.target.value)}
                placeholder="Ej. Mateo 18:20"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Visitas / Invitados adicionales</label>
              <input
                type="number"
                min="0"
                value={visitasInvitados}
                onChange={(e) => setVisitasInvitados(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-amber-600"
              />
            </div>
          </div>

          {/* Checklist of Convoked Members */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Lista de Miembros Convocados ({presentesEnModal} presentes de {registros.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Marca o desmarca la asistencia de cada miembro convocado.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => markAll(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-500/25 transition"
                >
                  Marcar Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => markAll(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-300 transition"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Search inside checklist */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchMiembroChecklist}
                onChange={(e) => setSearchMiembroChecklist(e.target.value)}
                placeholder="Filtrar miembro dentro de la lista..."
                className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            {filteredRegistrosModal.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">
                No hay miembros convocados para este filtro/alcance.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredRegistrosModal.map((reg) => {
                  const sName = sedeMap.get(reg.sedeId)?.nombre || '';
                  return (
                    <button
                      key={reg.miembroId}
                      type="button"
                      onClick={() => togglePresente(reg.miembroId)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        reg.presente
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {reg.presente ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate">{reg.nombreCompleto}</p>
                        {sName && <p className="text-[10px] opacity-75 truncate">{sName}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold mb-1">Observaciones de la Reunión (opcional)</label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre el desarrollo de la reunión..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner size="sm" color="text-white" /> : <Save className="w-4 h-4" />}
              {editingSesionId ? 'Guardar Cambios de Asistencia' : 'Guardar Asistencia'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
