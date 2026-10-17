import { Miembro } from '../entities/miembro';

export interface IMiembroRepository {
  getAll(): Promise<Miembro[]>;
  save(miembro: Miembro): Promise<void>;
  delete(id: string): Promise<void>;
}
