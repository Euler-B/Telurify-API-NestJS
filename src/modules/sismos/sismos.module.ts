import { Module } from '@nestjs/common';
import { GetSismosUseCase, SISMO_REPOSITORY } from './application/get-sismos.use-case';
import { GetSismoStatsUseCase } from './application/get-sismo-stats.use-case';
import { PrismaSismoRepository } from './infrastructure/prisma-sismo.repository';
import { SismosController } from './presentation/sismos.controller';
import { SismoStatsRepository } from './domain/sismo-stats.repository';
import { PrismaSismoStatsRepository } from './infrastructure/prisma-sismo-stats.repository';

@Module({
  controllers: [SismosController],
  providers: [
    GetSismosUseCase,
    GetSismoStatsUseCase,
    PrismaSismoRepository,
    { provide: SISMO_REPOSITORY, useExisting: PrismaSismoRepository },
    PrismaSismoStatsRepository,
    { provide: SismoStatsRepository, useExisting: PrismaSismoStatsRepository },
  ],
})
export class SismosModule {}
