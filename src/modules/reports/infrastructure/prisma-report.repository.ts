import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ReportRepository } from '../domain/report.repository';

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sismoExists(id: bigint) {
    return (await this.prisma.sismo.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  async create(id: bigint, felt: boolean, intensity: string) {
    const now = new Date();
    return this.prisma.report.create({ data: { sismoId: id, felt, intensity, createdAt: now, updatedAt: now }, select: { id: true, felt: true, intensity: true, sismoId: true, createdAt: true } });
  }
}
