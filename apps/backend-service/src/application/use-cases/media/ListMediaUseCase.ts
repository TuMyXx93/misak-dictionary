import type {
  IMedioCulturalRepository,
  ListMediosFilter,
  ListMediosResult,
} from '../../../domain/interfaces/IMedioCulturalRepository.js';

export class ListMediaUseCase {
  constructor(private readonly mediaRepository: IMedioCulturalRepository) {}

  async execute(filter: ListMediosFilter): Promise<ListMediosResult> {
    return this.mediaRepository.list(filter);
  }
}
