jest.mock('redis', () => ({ createClient: jest.fn() }));

import { Logger } from '@nestjs/common';
import { createClient } from 'redis';
import { RATE_LIMIT_INCREMENT_SCRIPT, RATE_LIMIT_NAMESPACE, RedisRateLimitStore } from './redis-rate-limit.store';

const createClientMock = createClient as jest.Mock;

describe('RedisRateLimitStore', () => {
  let client: { on: jest.Mock; connect: jest.Mock; eval: jest.Mock; isReady: boolean };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    client = {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      eval: jest.fn().mockResolvedValue(3),
      isReady: false,
    };
    createClientMock.mockReturnValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('increments using the rack-attack namespace and an atomic ttl script', async () => {
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await expect(store.increment('rack::attack:29:req/ip:127.0.0.1', 60)).resolves.toBe(3);

    expect(createClientMock).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
    expect(client.eval).toHaveBeenCalledWith(RATE_LIMIT_INCREMENT_SCRIPT, {
      keys: [`${RATE_LIMIT_NAMESPACE}:rack::attack:29:req/ip:127.0.0.1`],
      arguments: ['60'],
    });
  });

  it('connects lazily and reuses the connection', async () => {
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await store.increment('a', 60);
    client.isReady = true;
    await store.increment('b', 60);

    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it('retries the connection after a failure', async () => {
    client.connect.mockRejectedValueOnce(new Error('connection refused'));
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await expect(store.increment('a', 60)).rejects.toThrow('connection refused');
    await expect(store.increment('a', 60)).resolves.toBe(3);

    expect(client.connect).toHaveBeenCalledTimes(2);
  });

  it('registers an error listener', () => {
    new RedisRateLimitStore('redis://localhost:6379');

    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
