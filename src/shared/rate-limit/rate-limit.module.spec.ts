jest.mock('redis', () => ({ createClient: jest.fn(() => ({ on: jest.fn(), connect: jest.fn(), isReady: false })) }));

import { createClient } from 'redis';
import { MemoryRateLimitStore } from './infrastructure/memory-rate-limit.store';
import { RedisRateLimitStore } from './infrastructure/redis-rate-limit.store';
import { createRateLimitStore } from './rate-limit.module';

const createClientMock = createClient as jest.Mock;

describe('createRateLimitStore', () => {
  it('prefers RACK_ATTACK_REDIS_URL over REDIS_URL', () => {
    const store = createRateLimitStore({ RACK_ATTACK_REDIS_URL: 'redis://rate-limit', REDIS_URL: 'redis://other' } as NodeJS.ProcessEnv);

    expect(store).toBeInstanceOf(RedisRateLimitStore);
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'redis://rate-limit' }));
  });

  it('uses REDIS_URL when RACK_ATTACK_REDIS_URL is missing', () => {
    const store = createRateLimitStore({ REDIS_URL: 'redis://other' } as NodeJS.ProcessEnv);

    expect(store).toBeInstanceOf(RedisRateLimitStore);
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'redis://other' }));
  });

  it('falls back to the in-memory store outside production', () => {
    expect(createRateLimitStore({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBeInstanceOf(MemoryRateLimitStore);
  });

  it('requires redis in production', () => {
    expect(() => createRateLimitStore({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(
      'RACK_ATTACK_REDIS_URL or REDIS_URL is required in production',
    );
  });
});
