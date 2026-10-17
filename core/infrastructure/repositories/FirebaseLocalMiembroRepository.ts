import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '../../../lib/firebase';
import { DEFAULT_MINISTERIOS_INA } from '../../domain/entities/iglesia';
import { DEFAULT_MIEMBROS_SEED, Miembro } from '../../domain/entities/miembro';
import { IMiembroRepository } from '../../domain/ports/IMiembroRepository';

function normalizeMiembro(m: Miembro): Miembro {
  const gruposIds = Array.isArray(m.gruposIds) ? m.gruposIds : [];
  let ministeriosIds = Array.isArray(m.ministeriosIds) ? m.ministeriosIds : [];
  if (ministeriosIds.length === 0 && m.ministerio) {
    const matched = DEFAULT_MINISTERIOS_INA.filter((min) =>
      m.ministerio.toLowerCase().includes(min.nombre.toLowerCase())
    ).map((min) => min.id);
    ministeriosIds = matched.length > 0 ? matched : ['min-miembro'];
  }
  return {
    ...m,
    gruposIds,
    ministeriosIds,
    ministerio: m.ministerio || 'Miembro',
  };
}

export class FirebaseLocalMiembroRepository implements IMiembroRepository {
  async getAll(): Promise<Miembro[]> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'ina_miembros'));
        if (!snap.empty) {
          const list: Miembro[] = [];
          snap.forEach((d) => list.push(normalizeMiembro(d.data() as Miembro)));
          return list.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
        } else {
          for (const m of DEFAULT_MIEMBROS_SEED) {
            await setDoc(doc(db, 'ina_miembros', m.id), m);
          }
          return DEFAULT_MIEMBROS_SEED;
        }
      } catch (e) {
        console.error('Error loading miembros from Firestore:', e);
      }
    }
    return [];
  }

  async save(miembro: Miembro): Promise<void> {
    const normalized = normalizeMiembro(miembro);
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(normalized).filter(([, v]) => v !== undefined)
        ) as Miembro;
        await setDoc(doc(db, 'ina_miembros', normalized.id), cleanData);
      } catch (e) {
        console.error('Error saving miembro to Firestore:', e);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'ina_miembros', id));
      } catch (e) {
        console.error('Error deleting miembro from Firestore:', e);
      }
    }
  }
}
