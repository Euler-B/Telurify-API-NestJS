import { Sismo } from '@prisma/client';

export type SismoFilters = {
  magType?: string[];
  magMin?: number;
  magMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tsunami?: boolean;
};

export abstract class SismoRepository {
  abstract findMany(filters: SismoFilters, page: number, perPage: number): Promise<{ items: Sismo[]; total: number }>;
}
