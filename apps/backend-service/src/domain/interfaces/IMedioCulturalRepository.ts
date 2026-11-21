import type {
  CreateMedioCulturalPayload,
  EstadoMedio,
  MedioCultural,
  TipoMedio,
  UpdateMedioCulturalMetadataPayload,
} from '../entities/MedioCultural.js';

export interface ListMediosFilter {
  tipo?: TipoMedio | undefined;
  estado?: EstadoMedio | undefined;
  sentidoId?: bigint | undefined;
  formaId?: bigint | undefined;
  campoSemanticoId?: bigint | undefined;
  subcampoSemanticoId?: bigint | undefined;
  microcampoId?: bigint | undefined;
  query?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface ListMediosResult {
  items: MedioCultural[];
  total: number;
}

export interface IMedioCulturalRepository {
  findById(id: bigint): Promise<MedioCultural | null>;
  findByUuid(uuid: string): Promise<MedioCultural | null>;
  findByHash(hashSha256: string): Promise<MedioCultural | null>;
  findBySentidoId(sentidoId: bigint, soloRatificados?: boolean): Promise<MedioCultural[]>;
  findByFormaId(formaId: bigint, soloRatificados?: boolean): Promise<MedioCultural[]>;
  create(payload: CreateMedioCulturalPayload): Promise<MedioCultural>;
  updateMetadata(id: bigint, payload: UpdateMedioCulturalMetadataPayload): Promise<MedioCultural>;
  ratify(id: bigint, ratificadoPorId: bigint): Promise<MedioCultural>;
  softDelete(id: bigint): Promise<void>;
  list(filter: ListMediosFilter): Promise<ListMediosResult>;
  findSentidoIdByFormaId?(formaId: bigint): Promise<bigint | null>;
}
