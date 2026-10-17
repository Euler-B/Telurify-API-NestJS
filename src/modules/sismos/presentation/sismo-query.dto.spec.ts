import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SismoQueryDto } from './sismo-query.dto';

describe('SismoQueryDto', () => {
  it('transforms and validates pagination and filters', async () => {
    const query = plainToInstance(SismoQueryDto, {
      page: '2',
      per_page: '10',
      filters: { mag_type: 'mw,ml', mag_min: '2.5', date_from: '2025-01-01', tsunami: 'true' },
    });
    expect(await validate(query)).toHaveLength(0);
    expect(query.page).toBe(2);
    expect(query.filters?.toFilters()).toMatchObject({ magType: ['mw', 'ml'], magMin: 2.5, tsunami: true });
  });

  it('rejects invalid pagination and filters', async () => {
    const query = plainToInstance(SismoQueryDto, { page: '0', per_page: '1001', filters: { mag_min: 'invalid', tsunami: 'unknown' } });
    const errors = await validate(query);
    expect(errors.length).toBeGreaterThan(0);
  });
});
