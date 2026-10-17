export type SismoStats = {
  total: number;
  last24h: number;
  tsunami: number;
  maxMagnitude: { id: bigint; title: string | null; mag: number | null; place: string | null; createdAt: Date } | null;
  byMagType: { magType: string | null; count: number }[];
};

export abstract class SismoStatsRepository {
  abstract getStats(): Promise<SismoStats>;
}
