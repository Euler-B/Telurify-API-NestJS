import { Inject, Injectable } from '@nestjs/common';
import { SismoRepository, SismoFilters } from '../domain/sismo.repository';

export const SISMO_REPOSITORY = Symbol('SISMO_REPOSITORY');

@Injectable()
export class GetSismosUseCase {
  constructor(@Inject(SISMO_REPOSITORY) private readonly repository: SismoRepository) {}

  execute(filters: SismoFilters, page: number, perPage: number) {
    return this.repository.findMany(filters, page, perPage);
  }
}
