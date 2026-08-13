import { Injectable } from '@nestjs/common';
import { Prisma, Sismo } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import { SismoFilters, SismoRepository } from '../domain/sismo.repository';

@Injectable()
export class PrismaSismoRepository implements SismoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: SismoFilters, page: number, perPage: number) {
    const magnitude = filters.magMin !== undefined || filters.magMax !== undefined
      ? { ...(filters.magMin !== undefined ? { gte: filters.magMin } : {}), ...(filters.magMax !== undefined ? { lte: filters.magMax } : {}) }
      : undefined;
    const where: Prisma.SismoWhereInput = {
      ...(filters.magType ? { magType: { in: filters.magType } } : {}),
      ...(magnitude ? { mag: magnitude } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } }
        : {}),
      ...(filters.tsunami === true ? { tsunami: true } : {}),
      ...(filters.tsunami === false ? { OR: [{ tsunami: false }, { tsunami: null }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.sismo.findMany({ where, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.sismo.count({ where }),
    ]);
    return { items, total };
  }
}
