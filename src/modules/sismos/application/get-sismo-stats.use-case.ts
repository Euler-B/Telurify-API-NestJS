import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class GetSismoStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [total, last24h, tsunami, maxMagnitude, byMagType] = await Promise.all([
      this.prisma.sismo.count(),
      this.prisma.sismo.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.sismo.count({ where: { tsunami: true } }),
      this.prisma.sismo.findFirst({ where: { mag: { not: null } }, orderBy: { mag: 'desc' } }),
      this.prisma.sismo.groupBy({ by: ['magType'], _count: { _all: true } }),
    ]);

    return {
      total_sismos: total,
      last_24h_count: last24h,
      tsunami_count: tsunami,
      max_magnitude: maxMagnitude
        ? { id: Number(maxMagnitude.id), title: maxMagnitude.title, magnitude: maxMagnitude.mag, place: maxMagnitude.place, time: maxMagnitude.createdAt.toISOString() }
        : null,
      by_mag_type: Object.fromEntries(byMagType.map((item) => [item.magType, item._count._all])),
    };
  }
}
