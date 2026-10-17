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

export class RedisRateLimitStore extends RateLimitStore {
  private readonly logger = new Logger(RedisRateLimitStore.name);
  private readonly client: RedisClientType;
  private connection?: Promise<unknown>;

  constructor(url: string) {
    super();
    this.client = createClient({ url });
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
    this.connection ??= this.client.connect().catch((error) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }
}
