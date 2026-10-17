/**
 * Domain Entity: Miembro de la Iglesia Nueva Apostólica (INA)
 * Regla de Negocio: Cada miembro pertenece a una Sede principal, puede tener uno o varios Ministerios/Roles y pertenecer a uno o varios Grupos.
 */

import { MinisterioIglesia } from './iglesia';

export type MinisterioRol = string;

export const MINISTERIOS_ROLES: string[] = [
  'Miembro',
  'Diácono',
  'Pastor',
  'Evangelista',
  'Anciano de Distrito',
  'Maestro/a de Enseñanza',
  'Líder de Juventud',
  'Integrante de Coro / Director Musical',
];

export interface Miembro {
  id: string;
  nombres: string;
  apellidos: string;
  documento?: string;
  fechaNacimiento?: string;
  fechaBautismo?: string;
  fechaSellamiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ministerio: string;         // Texto resumen o rol principal (compatibilidad)
  ministeriosIds: string[];   // Multiselección de ministerios / encargos
  sedeId: string;             // Pertenece a 1 sede
  gruposIds: string[];        // Puede pertenecer a 1 o varios grupos
  notas?: string;
  activo: boolean;
  fechaRegistro: string;
}

/**
 * Pure domain helpers for Miembro
 */
export function getNombreCompletoMiembro(miembro: Pick<Miembro, 'nombres' | 'apellidos'>): string {
  return `${miembro.nombres.trim()} ${miembro.apellidos.trim()}`.trim();
}

export function perteneceASede(miembro: Miembro, sedeId: string): boolean {
  return miembro.sedeId === sedeId;
}

export function perteneceAGrupo(miembro: Miembro, grupoId: string): boolean {
  return Array.isArray(miembro.gruposIds) && miembro.gruposIds.includes(grupoId);
}

export function perteneceAMinisterio(miembro: Miembro, ministerioId: string): boolean {
  return Array.isArray(miembro.ministeriosIds) && miembro.ministeriosIds.includes(ministerioId);
}

export function getMinisteriosDeMiembro(
  miembro: Miembro,
  ministerioMap: Map<string, MinisterioIglesia>
): MinisterioIglesia[] {
  if (Array.isArray(miembro.ministeriosIds) && miembro.ministeriosIds.length > 0) {
    const resolved = miembro.ministeriosIds
      .map((id) => ministerioMap.get(id))
      .filter((m): m is MinisterioIglesia => Boolean(m));
    if (resolved.length > 0) return resolved;
  }
  // Fallback por nombre si venía de versión anterior
  if (miembro.ministerio) {
    for (const min of ministerioMap.values()) {
      if (min.nombre.toLowerCase() === miembro.ministerio.toLowerCase()) {
        return [min];
      }
    }
  }
  return [];
}

export const DEFAULT_MIEMBROS_SEED: Miembro[] = [
  {
    id: 'm-ina-1',
    nombres: 'Carlos Alberto',
    apellidos: 'Mendoza Salazar',
    documento: '41256389',
    fechaNacimiento: '1978-05-14',
    fechaBautismo: '1978-08-20',
    fechaSellamiento: '1980-11-02',
    telefono: '987654321',
    email: 'carlos.mendoza@ina.org',
    direccion: 'Av. Flores 450',
    ministerio: 'Pastor, Integrante de Coro / Director Musical',
    ministeriosIds: ['min-pastor', 'min-coro-musica'],
    sedeId: 'ayacucho',
    gruposIds: ['grupo-portadores', 'grupo-coro'],
    activo: true,
    fechaRegistro: new Date().toISOString(),
  },
  {
    id: 'm-ina-2',
    nombres: 'Lucía Fernanda',
    apellidos: 'Rojas Paredes',
    documento: '73451290',
    fechaNacimiento: '2001-09-22',
    fechaBautismo: '2002-01-15',
    fechaSellamiento: '2003-04-10',
    telefono: '956412378',
    email: 'lucia.rojas@email.com',
    direccion: 'Jr. Los Pinos 120',
    ministerio: 'Líder de Juventud, Maestro/a de Enseñanza',
    ministeriosIds: ['min-lider-juventud', 'min-maestro', 'min-coro-musica'],
    sedeId: 'ayacucho',
    gruposIds: ['grupo-jovenes', 'grupo-coro', 'grupo-ninos'],
    activo: true,
    fechaRegistro: new Date().toISOString(),
  },
  {
    id: 'm-ina-3',
    nombres: 'Mateo Sebastián',
    apellidos: 'Vargas Huamán',
    documento: '75892341',
    fechaNacimiento: '2004-03-11',
    fechaBautismo: '2004-07-18',
    fechaSellamiento: '2005-10-09',
    telefono: '944125689',
    email: 'mateo.vargas@email.com',
    direccion: 'Calle Los Olivos 310',
    ministerio: 'Miembro',
    ministeriosIds: ['min-miembro'],
    sedeId: 'canto-grande',
    gruposIds: ['grupo-jovenes'],
    activo: true,
    fechaRegistro: new Date().toISOString(),
  },
  {
    id: 'm-ina-4',
    nombres: 'Elena Beatriz',
    apellidos: 'Gómez de Quispe',
    documento: '08451236',
    fechaNacimiento: '1956-11-30',
    fechaBautismo: '1960-05-01',
    fechaSellamiento: '1965-08-15',
    telefono: '912345999',
    email: 'elena.gomez@email.com',
    direccion: 'Urb. Las Flores Mz B Lt 4',
    ministerio: 'Maestro/a de Enseñanza, Integrante de Coro / Director Musical',
    ministeriosIds: ['min-maestro', 'min-coro-musica'],
    sedeId: 'canto-grande',
    gruposIds: ['grupo-adultos-mayores', 'grupo-coro'],
    activo: true,
    fechaRegistro: new Date().toISOString(),
  },
  {
    id: 'm-ina-5',
    nombres: 'Daniel Alejandro',
    apellidos: 'Torres Medina',
    documento: '71239845',
    fechaNacimiento: '1998-07-08',
    fechaBautismo: '1999-02-14',
    fechaSellamiento: '2000-06-25',
    telefono: '945612888',
    email: 'daniel.torres@email.com',
    direccion: 'Jr. Las Magnolias 512',
    ministerio: 'Diácono, Líder de Juventud',
    ministeriosIds: ['min-diacono', 'min-lider-juventud'],
    sedeId: 'huanta',
    gruposIds: ['grupo-jovenes', 'grupo-portadores'],
    activo: true,
    fechaRegistro: new Date().toISOString(),
  },
];
