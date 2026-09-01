export abstract class DeviceRepository {
  abstract findTokens(): Promise<string[]>;
  abstract findByToken(token: string): Promise<{ id: bigint } | null>;
  abstract create(token: string): Promise<{ id: bigint }>;
  abstract update(id: bigint): Promise<{ id: bigint }>;
  abstract remove(id: bigint): Promise<void>;
}
