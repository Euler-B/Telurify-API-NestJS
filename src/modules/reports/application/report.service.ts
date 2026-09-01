import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportRepository } from '../domain/report.repository';

@Injectable()
export class ReportService {
  constructor(private readonly repository: ReportRepository) {}

  async create(sismoId: string, felt: boolean, intensity: string) {
    const id = BigInt(sismoId);
    if (!(await this.repository.sismoExists(id))) {
      throw new NotFoundException({ error: 'Feature not found' });
    }
    return this.repository.create(id, felt, intensity);
  }
}
