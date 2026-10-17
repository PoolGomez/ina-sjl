import {
  GrupoIglesia,
  InfoIglesiaConfig,
  MinisterioIglesia,
  SedeIglesia,
} from '../entities/iglesia';

export interface IIglesiaRepository {
  getInfoIglesia(): Promise<InfoIglesiaConfig>;
  saveInfoIglesia(info: InfoIglesiaConfig): Promise<void>;

  getSedes(): Promise<SedeIglesia[]>;
  saveSede(sede: SedeIglesia): Promise<void>;
  deleteSede(id: string): Promise<void>;

  getGrupos(): Promise<GrupoIglesia[]>;
  saveGrupo(grupo: GrupoIglesia): Promise<void>;
  deleteGrupo(id: string): Promise<void>;

  getMinisterios(): Promise<MinisterioIglesia[]>;
  saveMinisterio(ministerio: MinisterioIglesia): Promise<void>;
  deleteMinisterio(id: string): Promise<void>;
}
