import { RateLimitStore } from '../domain/rate-limit.store';

const SWEEP_THRESHOLD = 10_000;

export class MemoryRateLimitStore extends RateLimitStore {
  private readonly counters = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const entry = this.counters.get(key);

    if (!entry || entry.expiresAt <= now) {
      if (this.counters.size >= SWEEP_THRESHOLD) this.sweep(now);
      this.counters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  }

  private sweep(now: number) {
    for (const [key, entry] of this.counters) {
      if (entry.expiresAt <= now) this.counters.delete(key);
    }
  }
}
