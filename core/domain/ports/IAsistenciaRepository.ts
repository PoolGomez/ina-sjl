import { SesionAsistencia } from '../entities/asistencia';

export interface IAsistenciaRepository {
  getAll(): Promise<SesionAsistencia[]>;
  save(sesion: SesionAsistencia): Promise<void>;
  delete(id: string): Promise<void>;
}
