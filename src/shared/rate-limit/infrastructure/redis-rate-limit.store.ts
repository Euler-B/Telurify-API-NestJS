import { Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { RateLimitStore } from '../domain/rate-limit.store';

export const RATE_LIMIT_NAMESPACE = 'rack_attack';

export const RATE_LIMIT_INCREMENT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

export const CONNECT_TIMEOUT_MS = 2000;
export const MAX_RECONNECT_RETRIES = 2;
export const UNAVAILABLE_COOLDOWN_MS = 10_000;

export class RedisRateLimitStore extends RateLimitStore {
  private readonly logger = new Logger(RedisRateLimitStore.name);
  private readonly client: RedisClientType;
  private connection?: Promise<unknown>;
  private unavailableUntil = 0;

  constructor(url: string) {
    super();
    this.client = createClient({
      url,
      socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
        reconnectStrategy: (retries) =>
          retries >= MAX_RECONNECT_RETRIES ? new Error('Redis rate limit store unreachable') : Math.min(retries * 100, 1000),
      },
    });
    this.client.on('error', (error) => this.logger.warn(`Redis rate limit error: ${error.message}`));
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    await this.connect();
    const count = await this.client.eval(RATE_LIMIT_INCREMENT_SCRIPT, {
      keys: [`${RATE_LIMIT_NAMESPACE}:${key}`],
      arguments: [String(ttlSeconds)],
    });
    return Number(count);
  }

  private connect(): Promise<unknown> {
    if (this.client.isReady) return Promise.resolve();
    if (Date.now() < this.unavailableUntil) {
      return Promise.reject(new Error('Redis rate limit store temporarily unavailable'));
    }
    this.connection ??= this.client
      .connect()
      .then(() => {
        this.unavailableUntil = 0;
      })
      .catch((error) => {
        this.connection = undefined;
        this.unavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
        throw error;
      });
    return this.connection;
  }
}
