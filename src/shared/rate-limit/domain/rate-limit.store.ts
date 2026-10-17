export abstract class RateLimitStore {
  abstract increment(key: string, ttlSeconds: number): Promise<number>;
}
