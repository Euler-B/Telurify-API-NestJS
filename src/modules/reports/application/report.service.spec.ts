import { NotFoundException } from '@nestjs/common';
import { ReportRepository } from '../domain/report.repository';
import { ReportService } from './report.service';

describe('ReportService', () => {
  it('does not create a report for an unknown feature', async () => {
    const repository = { sismoExists: jest.fn().mockResolvedValue(false) } as unknown as ReportRepository;
    await expect(new ReportService(repository).create('1', true, 'moderate')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.sismoExists).toHaveBeenCalledWith(1n);
  });
});
