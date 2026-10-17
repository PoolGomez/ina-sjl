import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '../../../lib/firebase';
import { SesionAsistencia } from '../../domain/entities/asistencia';
import { IAsistenciaRepository } from '../../domain/ports/IAsistenciaRepository';

const DEFAULT_ASISTENCIAS_SEED: SesionAsistencia[] = [
  {
    id: 'asis-seed-1',
    titulo: 'Oficio Divino Dominical — Comunidad de Ayacucho',
    fecha: '2026-10-16',
    hora: '10:00',
    alcance: 'sede',
    sedeId: 'ayacucho',
    registros: [
      { miembroId: 'm-ina-1', nombreCompleto: 'Carlos Alberto Mendoza Salazar', sedeId: 'ayacucho', presente: true },
      { miembroId: 'm-ina-2', nombreCompleto: 'Lucía Fernanda Rojas Paredes', sedeId: 'ayacucho', presente: true },
    ],
    totalConvocados: 2,
    totalPresentes: 2,
    totalAusentes: 0,
    visitasInvitados: 3,
    oficiante: 'Pastor Carlos Mendoza',
    palabraTexto: 'Juan 14:27 — La paz os dejo, mi paz os doy',
    observaciones: 'Oficio bendecido con participación del coro.',
    fechaCreacion: '2026-10-16T10:00:00.000Z',
  },
  {
    id: 'asis-seed-2',
    titulo: 'Reunión General de Juventud INA',
    fecha: '2026-10-16',
    hora: '18:00',
    alcance: 'grupo_general',
    grupoId: 'grupo-jovenes',
    registros: [
      { miembroId: 'm-ina-2', nombreCompleto: 'Lucía Fernanda Rojas Paredes', sedeId: 'ayacucho', presente: true },
      { miembroId: 'm-ina-3', nombreCompleto: 'Mateo Sebastián Vargas Huamán', sedeId: 'canto-grande', presente: true },
      { miembroId: 'm-ina-5', nombreCompleto: 'Daniel Alejandro Torres Medina', sedeId: 'huanta', presente: false },
    ],
    totalConvocados: 3,
    totalPresentes: 2,
    totalAusentes: 1,
    visitasInvitados: 2,
    oficiante: 'Evangelista Miguel Torres',
    palabraTexto: '1 Timoteo 4:12 — Ninguno tenga en poco tu juventud',
    observaciones: 'Confraternidad juvenil inter-sedes.',
    fechaCreacion: '2026-10-16T18:00:00.000Z',
  },
];

export class FirebaseLocalAsistenciaRepository implements IAsistenciaRepository {
  async getAll(): Promise<SesionAsistencia[]> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'ina_asistencias'));
        if (!snap.empty) {
          const list: SesionAsistencia[] = [];
          snap.forEach((d) => list.push(d.data() as SesionAsistencia));
          return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
        } else {
          for (const s of DEFAULT_ASISTENCIAS_SEED) {
            await setDoc(doc(db, 'ina_asistencias', s.id), s);
          }
          return DEFAULT_ASISTENCIAS_SEED;
        }
      } catch (e) {
        console.error('Error loading asistencias from Firestore:', e);
      }
    }
    return [];
  }

  async save(sesion: SesionAsistencia): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(sesion).filter(([, v]) => v !== undefined)
        ) as SesionAsistencia;
        await setDoc(doc(db, 'ina_asistencias', sesion.id), cleanData);
      } catch (e) {
        console.error('Error saving asistencia to Firestore:', e);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'ina_asistencias', id));
      } catch (e) {
        console.error('Error deleting asistencia from Firestore:', e);
      }
    }
  }
}
