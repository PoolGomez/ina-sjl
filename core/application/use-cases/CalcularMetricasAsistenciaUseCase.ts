import { AlcanceReunion, SesionAsistencia } from '../../domain/entities/asistencia';
import { GrupoIglesia, SedeIglesia } from '../../domain/entities/iglesia';
import { Miembro } from '../../domain/entities/miembro';

export interface MetricaPorSede {
  sedeId: string;
  sedeNombre: string;
  totalReuniones: number;
  promedioPresentes: number;
  porcentajeAsistencia: number;
  totalVisitas: number;
  totalMiembrosActivos: number;
}

export interface MetricaPorGrupo {
  grupoId: string;
  grupoNombre: string;
  icono: string;
  totalReunionesSede: number;
  totalReunionesGenerales: number;
  promedioPresentes: number;
  porcentajeAsistencia: number;
  totalIntegrantesActivos: number;
}

export interface MetricaPorAlcance {
  alcance: AlcanceReunion;
  totalReuniones: number;
  porcentajePromedio: number;
  totalPresentesAcumulado: number;
  totalVisitasAcumulado: number;
}

export interface MetricaMiembroFrecuencia {
  miembroId: string;
  nombreCompleto: string;
  sedeNombre: string;
  reunionesConvocado: number;
  reunionesPresente: number;
  porcentajeAsistencia: number;
}

export interface ResumenMetricasAsistencia {
  totalSesiones: number;
  porcentajeAsistenciaGlobal: number;
  promedioPresentesPorSesion: number;
  totalVisitasGlobal: number;
  totalMiembrosActivos: number;
  porSede: MetricaPorSede[];
  porGrupo: MetricaPorGrupo[];
  porAlcance: MetricaPorAlcance[];
  frecuenciaMiembros: MetricaMiembroFrecuencia[];
}

/**
 * Use Case: Calcula de forma pura y desacoplada todas las métricas de asistencia
 * por sede, por grupo (por sede vs general), por alcance y por miembro.
 */
export class CalcularMetricasAsistenciaUseCase {
  execute(params: {
    sesiones: SesionAsistencia[];
    sedes: SedeIglesia[];
    grupos: GrupoIglesia[];
    miembros: Miembro[];
  }): ResumenMetricasAsistencia {
    const { sesiones, sedes, grupos, miembros } = params;
    const miembrosActivos = miembros.filter((m) => m.activo);

    const totalSesiones = sesiones.length;
    const sumaConvocados = sesiones.reduce((acc, s) => acc + s.totalConvocados, 0);
    const sumaPresentes = sesiones.reduce((acc, s) => acc + s.totalPresentes, 0);
    const totalVisitasGlobal = sesiones.reduce((acc, s) => acc + (s.visitasInvitados || 0), 0);

    const porcentajeAsistenciaGlobal =
      sumaConvocados > 0 ? Math.round((sumaPresentes / sumaConvocados) * 1000) / 10 : 0;

    const promedioPresentesPorSesion =
      totalSesiones > 0 ? Math.round((sumaPresentes / totalSesiones) * 10) / 10 : 0;

    // 1. Métricas por Sede
    const porSede: MetricaPorSede[] = sedes.map((sede) => {
      const sesionesSede = sesiones.filter(
        (s) => s.sedeId === sede.id || s.alcance === 'general'
      );
      let convSede = 0;
      let presSede = 0;
      let visitasSede = 0;

      sesionesSede.forEach((s) => {
        if (s.sedeId === sede.id) {
          convSede += s.totalConvocados;
          presSede += s.totalPresentes;
          visitasSede += s.visitasInvitados || 0;
        } else {
          // Reunión general: contamos los registros de miembros de esta sede
          const regsSede = s.registros.filter((r) => r.sedeId === sede.id);
          convSede += regsSede.length;
          presSede += regsSede.filter((r) => r.presente).length;
        }
      });

      const nReuniones = sesiones.filter((s) => s.sedeId === sede.id).length;
      return {
        sedeId: sede.id,
        sedeNombre: sede.nombre,
        totalReuniones: nReuniones,
        promedioPresentes: nReuniones > 0 ? Math.round((presSede / nReuniones) * 10) / 10 : 0,
        porcentajeAsistencia: convSede > 0 ? Math.round((presSede / convSede) * 1000) / 10 : 0,
        totalVisitas: visitasSede,
        totalMiembrosActivos: miembrosActivos.filter((m) => m.sedeId === sede.id).length,
      };
    });

    // 2. Métricas por Grupo (ej. Reunión de Jóvenes de Sede vs Reunión de Jóvenes General)
    const porGrupo: MetricaPorGrupo[] = grupos.map((grupo) => {
      const sesionesGrupo = sesiones.filter((s) => s.grupoId === grupo.id);
      const totalReunionesSede = sesionesGrupo.filter((s) => s.alcance === 'sede_grupo').length;
      const totalReunionesGenerales = sesionesGrupo.filter((s) => s.alcance === 'grupo_general').length;

      const convGrupo = sesionesGrupo.reduce((acc, s) => acc + s.totalConvocados, 0);
      const presGrupo = sesionesGrupo.reduce((acc, s) => acc + s.totalPresentes, 0);

      return {
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        icono: grupo.icono,
        totalReunionesSede,
        totalReunionesGenerales,
        promedioPresentes:
          sesionesGrupo.length > 0 ? Math.round((presGrupo / sesionesGrupo.length) * 10) / 10 : 0,
        porcentajeAsistencia: convGrupo > 0 ? Math.round((presGrupo / convGrupo) * 1000) / 10 : 0,
        totalIntegrantesActivos: miembrosActivos.filter((m) => m.gruposIds.includes(grupo.id)).length,
      };
    });

    // 3. Métricas por Alcance
    const alcances: AlcanceReunion[] = ['sede', 'sede_grupo', 'grupo_general', 'general'];
    const porAlcance: MetricaPorAlcance[] = alcances.map((alcance) => {
      const list = sesiones.filter((s) => s.alcance === alcance);
      const conv = list.reduce((acc, s) => acc + s.totalConvocados, 0);
      const pres = list.reduce((acc, s) => acc + s.totalPresentes, 0);
      const vis = list.reduce((acc, s) => acc + (s.visitasInvitados || 0), 0);

      return {
        alcance,
        totalReuniones: list.length,
        porcentajePromedio: conv > 0 ? Math.round((pres / conv) * 1000) / 10 : 0,
        totalPresentesAcumulado: pres,
        totalVisitasAcumulado: vis,
      };
    });

    // 4. Frecuencia por Miembro
    const sedeMap = new Map(sedes.map((s) => [s.id, s.nombre]));
    const frecuenciaMiembros: MetricaMiembroFrecuencia[] = miembrosActivos
      .map((m) => {
        let convocado = 0;
        let presente = 0;
        sesiones.forEach((s) => {
          const reg = s.registros.find((r) => r.miembroId === m.id);
          if (reg) {
            convocado += 1;
            if (reg.presente) presente += 1;
          }
        });
        return {
          miembroId: m.id,
          nombreCompleto: `${m.nombres} ${m.apellidos}`.trim(),
          sedeNombre: sedeMap.get(m.sedeId) || 'Sin Sede',
          reunionesConvocado: convocado,
          reunionesPresente: presente,
          porcentajeAsistencia: convocado > 0 ? Math.round((presente / convocado) * 100) : 0,
        };
      })
      .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia);

    return {
      totalSesiones,
      porcentajeAsistenciaGlobal,
      promedioPresentesPorSesion,
      totalVisitasGlobal,
      totalMiembrosActivos: miembrosActivos.length,
      porSede,
      porGrupo,
      porAlcance,
      frecuenciaMiembros,
    };
  }
}
