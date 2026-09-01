export abstract class ReportRepository {
  abstract sismoExists(id: bigint): Promise<boolean>;
  abstract create(id: bigint, felt: boolean, intensity: string): Promise<{ id: bigint; felt: boolean; intensity: string; sismoId: bigint; createdAt: Date }>;
}
