/**
 * Domain Entity: Asistencia por Reuniones (por Sede, por Sede + Grupo, por Grupo General o General)
 */

import { Miembro, perteneceAGrupo, perteneceASede } from './miembro';

export type AlcanceReunion =
  | 'sede'          // Ej. Oficio Divino en una sede específica
  | 'sede_grupo'    // Ej. Reunión de Jóvenes de una sede específica
  | 'grupo_general' // Ej. Reunión General de Jóvenes (todas las sedes)
  | 'general';      // Ej. Oficio Divino General / Evento de toda la iglesia

export const ALCANCE_REUNION_LABELS: Record<AlcanceReunion, { label: string; description: string }> = {
  sede: {
    label: 'Por Sede',
    description: 'Convoca a todos los miembros activos de una sede específica',
  },
  sede_grupo: {
    label: 'Por Sede y Grupo',
    description: 'Ej. Reunión de Jóvenes de una sede específica',
  },
  grupo_general: {
    label: 'Por Grupo General',
    description: 'Ej. Reunión General de Jóvenes de todas las sedes',
  },
  general: {
    label: 'General (Toda la Iglesia)',
    description: 'Convoca a todos los miembros de todas las sedes',
  },
};

export interface RegistroAsistenciaMiembro {
  miembroId: string;
  nombreCompleto: string;
  sedeId: string;
  presente: boolean;
  observacion?: string;
}

export interface SesionAsistencia {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  alcance: AlcanceReunion;
  sedeId?: string;
  grupoId?: string;
  registros: RegistroAsistenciaMiembro[];
  totalConvocados: number;
  totalPresentes: number;
  totalAusentes: number;
  visitasInvitados: number;
  oficiante?: string;
  palabraTexto?: string;
  observaciones?: string;
  creadoPor?: string;
  fechaCreacion: string;
}

/**
 * Regla de Dominio: Filtra qué miembros activos están convocados según el alcance de la reunión.
 */
export function filtrarMiembrosConvocadosPorAlcance(
  miembros: Miembro[],
  alcance: AlcanceReunion,
  sedeId?: string,
  grupoId?: string
): Miembro[] {
  const activos = miembros.filter((m) => m.activo);

  switch (alcance) {
    case 'sede':
      return sedeId ? activos.filter((m) => perteneceASede(m, sedeId)) : activos;
    case 'sede_grupo':
      return activos.filter(
        (m) =>
          (!sedeId || perteneceASede(m, sedeId)) &&
          (!grupoId || perteneceAGrupo(m, grupoId))
      );
    case 'grupo_general':
      return grupoId ? activos.filter((m) => perteneceAGrupo(m, grupoId)) : activos;
    case 'general':
    default:
      return activos;
  }
}
