import { Injectable, Logger } from '@nestjs/common';
import { RateLimitDecision, RateLimitRequest } from '../domain/rate-limit-rule';
import { RateLimitStore } from '../domain/rate-limit.store';
import { RATE_LIMIT_RULES } from './rate-limit.rules';

export const RATE_LIMIT_KEY_PREFIX = 'rack::attack';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly store: RateLimitStore) {}

  async check(request: RateLimitRequest): Promise<RateLimitDecision | null> {
    for (const rule of RATE_LIMIT_RULES) {
      const discriminator = rule.discriminator(request)?.trim().toLowerCase();
      if (!discriminator) continue;

      const now = Math.floor(Date.now() / 1000);
      const key = `${RATE_LIMIT_KEY_PREFIX}:${Math.floor(now / rule.periodSeconds)}:${rule.name}:${discriminator}`;
      const ttlSeconds = rule.periodSeconds - (now % rule.periodSeconds) + 1;

      let count: number;
      try {
        count = await this.store.increment(key, ttlSeconds);
      } catch (error) {
        this.logger.warn(`Rate limit store unavailable, allowing request: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }

      if (count > rule.limit) {
        return { retryAfter: rule.periodSeconds - (now % rule.periodSeconds) };
      }
    }

    return null;
  }
}
