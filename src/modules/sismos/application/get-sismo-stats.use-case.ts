import { Injectable } from '@nestjs/common';
import { SismoStatsRepository } from '../domain/sismo-stats.repository';

@Injectable()
export class GetSismoStatsUseCase {
  constructor(private readonly repository: SismoStatsRepository) {}

  async execute() {
    const { total, last24h, tsunami, maxMagnitude, byMagType } = await this.repository.getStats();

    return {
      total_sismos: total,
      last_24h_count: last24h,
      tsunami_count: tsunami,
      max_magnitude: maxMagnitude
        ? { id: Number(maxMagnitude.id), title: maxMagnitude.title, magnitude: maxMagnitude.mag, place: maxMagnitude.place, time: maxMagnitude.createdAt.toISOString() }
        : null,
       by_mag_type: Object.fromEntries(byMagType.map((item) => [item.magType, item.count])),
    };
  }
}
