import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GetSismosUseCase } from '../application/get-sismos.use-case';
import { GetSismoStatsUseCase } from '../application/get-sismo-stats.use-case';
import { SismoFilters } from '../domain/sismo.repository';

const MAX_PER_PAGE = 1000;

@Controller('sismos')
export class SismosController {
  constructor(private readonly getSismos: GetSismosUseCase, private readonly getStats: GetSismoStatsUseCase) {}

  @Get('stats')
  async stats() {
    return { data: { id: 'stats', type: 'stats', attributes: await this.getStats.execute() } };
  }

  @Get()
  async index(@Query() query: Record<string, unknown>) {
    const filters = this.parseFilters(query.filters);
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const perPage = Math.min(this.parsePositiveInteger(query.per_page, 25, 'per_page'), MAX_PER_PAGE);
    const result = await this.getSismos.execute(filters, page, perPage);

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

  private parseFilters(value: unknown): SismoFilters {
    if (!value || typeof value !== 'object') return {};
    const filters = value as Record<string, unknown>;
    const result: SismoFilters = {};
    if (typeof filters.mag_type === 'string' && filters.mag_type) result.magType = filters.mag_type.split(',');
    if (filters.mag_min !== undefined) result.magMin = this.parseFloat(filters.mag_min, 'mag_min');
    if (filters.mag_max !== undefined) result.magMax = this.parseFloat(filters.mag_max, 'mag_max');
    if (filters.date_from !== undefined) result.dateFrom = this.parseDate(filters.date_from, 'date_from', false);
    if (filters.date_to !== undefined) result.dateTo = this.parseDate(filters.date_to, 'date_to', true);
    if (typeof filters.tsunami === 'string' && filters.tsunami) {
      const value = filters.tsunami.toLowerCase();
      if (!['true', 'false', '1', '0', 't', 'f'].includes(value)) throw new BadRequestException({ error: 'Invalid value for filter: tsunami' });
      result.tsunami = ['true', '1', 't'].includes(value);
    }
    return result;
  }

  private parseFloat(value: unknown, name: string) {
    const parsed = Number(String(value).trim());
    if (!Number.isFinite(parsed)) throw new BadRequestException({ error: `Invalid value for filter: ${name}` });
    return parsed;
  }

  private parseDate(value: unknown, name: string, endOfDay: boolean) {
    const text = String(value).trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? new Date(`${text}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
      : new Date(text);
    if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) {
      throw new BadRequestException({ error: `Invalid date format for filter: ${name}` });
    }
    return date;
  }

  private parsePositiveInteger(value: unknown, fallback: number, name: string) {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw new BadRequestException({ error: `Invalid value for ${name}` });
    return parsed;
  }
}
