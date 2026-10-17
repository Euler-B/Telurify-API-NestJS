import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { SismoStats, SismoStatsRepository } from '../domain/sismo-stats.repository';

@Injectable()
export class PrismaSismoStatsRepository implements SismoStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<SismoStats> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [total, last24h, tsunami, maxMagnitude, byMagType] = await Promise.all([
      this.prisma.sismo.count(),
      this.prisma.sismo.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.sismo.count({ where: { tsunami: true } }),
      this.prisma.sismo.findFirst({ where: { mag: { not: null } }, orderBy: { mag: 'desc' } }),
      this.prisma.sismo.groupBy({ by: ['magType'], _count: { _all: true } }),
    ]);
    return { total, last24h, tsunami, maxMagnitude, byMagType: byMagType.map(({ magType, _count }) => ({ magType, count: _count._all })) };
  }
}
