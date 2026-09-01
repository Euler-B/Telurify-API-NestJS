import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReportDto } from './create-report.dto';

describe('CreateReportDto', () => {
  it('accepts valid report data', async () => {
    const errors = await validate(plainToInstance(CreateReportDto, { felt: true, intensity: 'moderate' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid report data', async () => {
    const errors = await validate(plainToInstance(CreateReportDto, { felt: 'yes', intensity: 'invalid' }));
    expect(errors.map(({ property }) => property)).toEqual(expect.arrayContaining(['felt', 'intensity']));
  });
});
