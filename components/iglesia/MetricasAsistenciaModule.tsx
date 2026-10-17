'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  Layers,
  Users,
  TrendingUp,
  Search,
  Calendar,
  Award,
  X,
} from 'lucide-react';
import {
  asistenciaRepository,
  calcularMetricasAsistenciaUseCase,
  iglesiaRepository,
  miembroRepository,
} from '../../core/container';
import { ResumenMetricasAsistencia } from '../../core/application/use-cases/CalcularMetricasAsistenciaUseCase';
import { ALCANCE_REUNION_LABELS } from '../../core/domain/entities/asistencia';

export const MetricasAsistenciaModule: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenMetricasAsistencia | null>(null);
  const [searchMiembro, setSearchMiembro] = useState('');

  useEffect(() => {
    const loadAndCompute = async () => {
      const [sesiones, sedes, grupos, miembros] = await Promise.all([
        asistenciaRepository.getAll(),
        iglesiaRepository.getSedes(),
        iglesiaRepository.getGrupos(),
        miembroRepository.getAll(),
      ]);
      const result = calcularMetricasAsistenciaUseCase.execute({
        sesiones,
        sedes,
        grupos,
        miembros,
      });
      setResumen(result);
    };
    loadAndCompute();
  }, []);

  if (!resumen) {
    return (
      <div className="py-16 text-center text-sm font-bold text-slate-400">
        Calculando métricas de asistencia...
      </div>
    );
  }

  const q = searchMiembro.trim().toLowerCase();
  const filteredFrecuencia = q
    ? resumen.frecuenciaMiembros.filter(
        (f) =>
          f.nombreCompleto.toLowerCase().includes(q) ||
          f.sedeNombre.toLowerCase().includes(q)
      )
    : resumen.frecuenciaMiembros;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/50">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
          <TrendingUp className="w-3.5 h-3.5" /> Inteligencia y Estadísticas Eclesiásticas
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Métricas de Asistencia y Participación INA
        </h1>
        <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
          Visualiza el índice de concurrencia global, comparativa por sedes, reuniones por grupos (por sede vs. generales) y frecuencia de cada miembro.
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg">
          <span className="text-xs uppercase font-bold text-white/80">Porcentaje de Asistencia</span>
          <div className="text-3xl font-black mt-2">{resumen.porcentajeAsistenciaGlobal}%</div>
          <span className="text-xs text-white/80 mt-1 block">Promedio sobre miembros convocados</span>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl p-5 text-white shadow-lg">
          <span className="text-xs uppercase font-bold text-white/80">Reuniones Registradas</span>
          <div className="text-3xl font-black mt-2">{resumen.totalSesiones}</div>
          <span className="text-xs text-white/80 mt-1 block">
            Promedio: {resumen.promedioPresentesPorSesion} miembros/reunión
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg">
          <span className="text-xs uppercase font-bold text-white/80">Total Visitas / Invitados</span>
          <div className="text-3xl font-black mt-2">{resumen.totalVisitasGlobal}</div>
          <span className="text-xs text-white/80 mt-1 block">Asistentes invitados acumulados</span>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-5 text-white shadow-lg">
          <span className="text-xs uppercase font-bold text-white/80">Padrón Activo</span>
          <div className="text-3xl font-black mt-2">{resumen.totalMiembrosActivos}</div>
          <span className="text-xs text-white/80 mt-1 block">Miembros activos en todas las sedes</span>
        </div>
      </div>

      {/* Breakdown by Sede & Breakdown by Grupo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Sede */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Asistencia por Sedes
              </h3>
              <p className="text-xs text-slate-500">Rendimiento y participación en cada comunidad</p>
            </div>
          </div>

          <div className="space-y-4">
            {resumen.porSede.map((s) => (
              <div key={s.sedeId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{s.sedeNombre}</span>
                    <span className="text-slate-400 ml-2">
                      ({s.totalMiembrosActivos} miembros · {s.totalReuniones} reuniones)
                    </span>
                  </div>
                  <span className="font-black text-sky-600 dark:text-sky-400">
                    {s.porcentajeAsistencia}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, s.porcentajeAsistencia)}%` }}
                  />
                </div>
                <div className="flex gap-4 text-[11px] text-slate-500">
                  <span>Promedio presentes: <strong>{s.promedioPresentes}</strong></span>
                  <span>Visitas: <strong>{s.totalVisitas}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por Grupo (Sede vs General) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Asistencia por Grupos (Por Sede vs. General)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de reuniones de grupo locales y generales
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {resumen.porGrupo.map((g) => (
              <div key={g.grupoId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{g.icono}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{g.grupoNombre}</span>
                    <span className="text-slate-400">({g.totalIntegrantesActivos} integrantes)</span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {g.porcentajeAsistencia}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, g.porcentajeAsistencia)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span>Reuniones por Sede: <strong>{g.totalReunionesSede}</strong></span>
                  <span>·</span>
                  <span>Reuniones Generales: <strong>{g.totalReunionesGenerales}</strong></span>
                  <span>·</span>
                  <span>Prom. presentes: <strong>{g.promedioPresentes}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown by Scope */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Resumen según Modalidad de Reunión
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resumen.porAlcance.map((a) => (
            <div
              key={a.alcance}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {ALCANCE_REUNION_LABELS[a.alcance]?.label || a.alcance}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {a.porcentajePromedio}%
              </div>
              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                <p>Reuniones realizadas: <strong>{a.totalReuniones}</strong></p>
                <p>Presentes acumulados: <strong>{a.totalPresentesAcumulado}</strong></p>
                <p>Visitas acumuladas: <strong>{a.totalVisitasAcumulado}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Attendance Frequency Table with Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Frecuencia de Asistencia por Miembro
              </h3>
              <p className="text-xs text-slate-500">
                Historial individual sobre las reuniones en las que estuvo convocado
              </p>
            </div>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchMiembro}
              onChange={(e) => setSearchMiembro(e.target.value)}
              placeholder="Buscar miembro o sede..."
              className="w-full pl-9 pr-8 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
            {searchMiembro && (
              <button
                type="button"
                onClick={() => setSearchMiembro('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                <th className="py-3 px-3">Miembro</th>
                <th className="py-3 px-3">Sede</th>
                <th className="py-3 px-3 text-center">Convocado</th>
                <th className="py-3 px-3 text-center">Presente</th>
                <th className="py-3 px-3 text-right">% Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredFrecuencia.map((item) => (
                <tr key={item.miembroId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.nombreCompleto}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{item.sedeNombre}</td>
                  <td className="py-3 px-3 text-center font-bold">{item.reunionesConvocado}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {item.reunionesPresente}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                        item.porcentajeAsistencia >= 75
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : item.porcentajeAsistencia >= 50
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {item.porcentajeAsistencia}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
