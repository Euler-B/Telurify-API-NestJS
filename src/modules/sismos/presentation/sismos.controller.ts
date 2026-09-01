import { Controller, Get, Query } from '@nestjs/common';
import { GetSismosUseCase } from '../application/get-sismos.use-case';
import { GetSismoStatsUseCase } from '../application/get-sismo-stats.use-case';
import { SismoQueryDto } from './sismo-query.dto';

@Controller('sismos')
export class SismosController {
  constructor(private readonly getSismos: GetSismosUseCase, private readonly getStats: GetSismoStatsUseCase) {}

  @Get('stats')
  async stats() {
    return { data: { id: 'stats', type: 'stats', attributes: await this.getStats.execute() } };
  }

  @Get()
  async index(@Query() query: SismoQueryDto) {
    const page = query.page;
    const perPage = query.per_page;
    const result = await this.getSismos.execute(query.filters?.toFilters() ?? {}, page, perPage);

    return {
      data: result.items.map((sismo) => ({
        id: Number(sismo.id),
        type: 'feature',
        attributes: {
          external_id: sismo.externalId,
          magnitude: sismo.mag,
          place: sismo.place,
          time: sismo.createdAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC'),
          tsunami: Boolean(sismo.tsunami),
          mag_type: sismo.magType,
          title: sismo.title,
          coordinates: { longitude: sismo.longitude, latitude: sismo.latitude },
        },
        links: { external_url: sismo.url },
      })),
      pagination: { current_page: page, total: result.total, per_page: perPage },
    };
  }

}
