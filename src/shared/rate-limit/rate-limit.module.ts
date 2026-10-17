import { Module } from '@nestjs/common';
import { RateLimiterService } from './application/rate-limiter.service';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RateLimitStore } from './domain/rate-limit.store';
import { MemoryRateLimitStore } from './infrastructure/memory-rate-limit.store';
import { RedisRateLimitStore } from './infrastructure/redis-rate-limit.store';

export function createRateLimitStore(env: NodeJS.ProcessEnv = process.env): RateLimitStore {
  const redisUrl = env.RACK_ATTACK_REDIS_URL || env.REDIS_URL;
  if (redisUrl) return new RedisRateLimitStore(redisUrl);
  if (env.NODE_ENV === 'production') throw new Error('RACK_ATTACK_REDIS_URL or REDIS_URL is required in production');
  return new MemoryRateLimitStore();
}

@Module({
  providers: [RateLimiterService, RateLimitMiddleware, { provide: RateLimitStore, useFactory: () => createRateLimitStore() }],
  exports: [RateLimitMiddleware],
})
export class RateLimitModule {}
