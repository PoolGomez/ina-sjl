import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '../../../lib/firebase';
import {
  DEFAULT_GRUPOS_INA,
  DEFAULT_INFO_IGLESIA,
  DEFAULT_MINISTERIOS_INA,
  DEFAULT_SEDES_INA,
  GrupoIglesia,
  InfoIglesiaConfig,
  MinisterioIglesia,
  SedeIglesia,
} from '../../domain/entities/iglesia';
import { IIglesiaRepository } from '../../domain/ports/IIglesiaRepository';

export class FirebaseLocalIglesiaRepository implements IIglesiaRepository {
  async getInfoIglesia(): Promise<InfoIglesiaConfig> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const ref = doc(db, 'ina_configuracion', 'info_institucional');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return { ...DEFAULT_INFO_IGLESIA, ...(snap.data() as InfoIglesiaConfig) };
        } else {
          await setDoc(ref, DEFAULT_INFO_IGLESIA);
          return DEFAULT_INFO_IGLESIA;
        }
      } catch (e) {
        console.error('Error loading InfoIglesia from Firestore:', e);
      }
    }
    return DEFAULT_INFO_IGLESIA;
  }

  async saveInfoIglesia(info: InfoIglesiaConfig): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'ina_configuracion', 'info_institucional'), info);
      } catch (e) {
        console.error('Error saving InfoIglesia to Firestore:', e);
      }
    }
  }

  async getSedes(): Promise<SedeIglesia[]> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'ina_sedes'));
        if (!snap.empty) {
          const list: SedeIglesia[] = [];
          snap.forEach((d) => list.push(d.data() as SedeIglesia));
          return list;
        } else {
          for (const s of DEFAULT_SEDES_INA) {
            await setDoc(doc(db, 'ina_sedes', s.id), s);
          }
          return DEFAULT_SEDES_INA;
        }
      } catch (e) {
        console.error('Error loading sedes from Firestore:', e);
      }
    }
    return DEFAULT_SEDES_INA;
  }

  async saveSede(sede: SedeIglesia): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(sede).filter(([, v]) => v !== undefined)
        ) as SedeIglesia;
        await setDoc(doc(db, 'ina_sedes', sede.id), cleanData);
      } catch (e) {
        console.error('Error saving sede to Firestore:', e);
      }
    }
  }

  async deleteSede(id: string): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'ina_sedes', id));
      } catch (e) {
        console.error('Error deleting sede from Firestore:', e);
      }
    }
  }

  async getGrupos(): Promise<GrupoIglesia[]> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'ina_grupos'));
        if (!snap.empty) {
          const list: GrupoIglesia[] = [];
          snap.forEach((d) => list.push(d.data() as GrupoIglesia));
          return list;
        } else {
          for (const g of DEFAULT_GRUPOS_INA) {
            await setDoc(doc(db, 'ina_grupos', g.id), g);
          }
          return DEFAULT_GRUPOS_INA;
        }
      } catch (e) {
        console.error('Error loading grupos from Firestore:', e);
      }
    }
    return DEFAULT_GRUPOS_INA;
  }

  async saveGrupo(grupo: GrupoIglesia): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(grupo).filter(([, v]) => v !== undefined)
        ) as GrupoIglesia;
        await setDoc(doc(db, 'ina_grupos', grupo.id), cleanData);
      } catch (e) {
        console.error('Error saving grupo to Firestore:', e);
      }
    }
  }

  async deleteGrupo(id: string): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'ina_grupos', id));
      } catch (e) {
        console.error('Error deleting grupo from Firestore:', e);
      }
    }
  }

  async getMinisterios(): Promise<MinisterioIglesia[]> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'ina_ministerios'));
        if (!snap.empty) {
          const list: MinisterioIglesia[] = [];
          snap.forEach((d) => list.push(d.data() as MinisterioIglesia));
          return list.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        } else {
          for (const m of DEFAULT_MINISTERIOS_INA) {
            await setDoc(doc(db, 'ina_ministerios', m.id), m);
          }
          return DEFAULT_MINISTERIOS_INA;
        }
      } catch (e) {
        console.error('Error loading ministerios from Firestore:', e);
      }
    }
    return DEFAULT_MINISTERIOS_INA;
  }

  async saveMinisterio(ministerio: MinisterioIglesia): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(ministerio).filter(([, v]) => v !== undefined)
        ) as MinisterioIglesia;
        await setDoc(doc(db, 'ina_ministerios', ministerio.id), cleanData);
      } catch (e) {
        console.error('Error saving ministerio to Firestore:', e);
      }
    }
  }

  async deleteMinisterio(id: string): Promise<void> {
    const { db, isConfigured } = initializeFirebase();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'ina_ministerios', id));
      } catch (e) {
        console.error('Error deleting ministerio from Firestore:', e);
      }
    }
  }
}
