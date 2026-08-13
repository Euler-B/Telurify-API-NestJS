import { Module } from '@nestjs/common';
import { GetSismosUseCase, SISMO_REPOSITORY } from './application/get-sismos.use-case';
import { GetSismoStatsUseCase } from './application/get-sismo-stats.use-case';
import { PrismaSismoRepository } from './infrastructure/prisma-sismo.repository';
import { SismosController } from './presentation/sismos.controller';

@Module({
  controllers: [SismosController],
  providers: [
    GetSismosUseCase,
    GetSismoStatsUseCase,
    PrismaSismoRepository,
    { provide: SISMO_REPOSITORY, useExisting: PrismaSismoRepository },
  ],
})
export class SismosModule {}
