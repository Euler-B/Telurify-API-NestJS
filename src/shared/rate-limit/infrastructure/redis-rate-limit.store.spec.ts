jest.mock('redis', () => ({ createClient: jest.fn() }));

import { Logger } from '@nestjs/common';
import { createClient } from 'redis';
import {
  CONNECT_TIMEOUT_MS,
  MAX_RECONNECT_RETRIES,
  RATE_LIMIT_INCREMENT_SCRIPT,
  RATE_LIMIT_NAMESPACE,
  RedisRateLimitStore,
  UNAVAILABLE_COOLDOWN_MS,
} from './redis-rate-limit.store';

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

    expect(createClientMock).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
      socket: { connectTimeout: CONNECT_TIMEOUT_MS, reconnectStrategy: expect.any(Function) },
    });
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

  it('bounds the reconnection attempts instead of retrying forever', () => {
    new RedisRateLimitStore('redis://localhost:6379');

    const { socket } = createClientMock.mock.calls[0][0];
    expect(typeof socket.reconnectStrategy(0)).toBe('number');
    expect(typeof socket.reconnectStrategy(1)).toBe('number');
    expect(socket.reconnectStrategy(MAX_RECONNECT_RETRIES)).toBeInstanceOf(Error);
  });

  it('fails fast during the cooldown after a failed connection', async () => {
    client.connect.mockRejectedValueOnce(new Error('connection refused'));
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await expect(store.increment('a', 60)).rejects.toThrow('connection refused');
    await expect(store.increment('a', 60)).rejects.toThrow('temporarily unavailable');

    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it('retries the connection after the cooldown', async () => {
    client.connect.mockRejectedValueOnce(new Error('connection refused'));
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await expect(store.increment('a', 60)).rejects.toThrow('connection refused');
    nowSpy.mockReturnValue(UNAVAILABLE_COOLDOWN_MS + 1);
    await expect(store.increment('a', 60)).resolves.toBe(3);

    expect(client.connect).toHaveBeenCalledTimes(2);
  });

  it('clears the cooldown after a successful reconnection', async () => {
    client.connect.mockRejectedValueOnce(new Error('connection refused'));
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    const store = new RedisRateLimitStore('redis://localhost:6379');

    await expect(store.increment('a', 60)).rejects.toThrow('connection refused');
    nowSpy.mockReturnValue(UNAVAILABLE_COOLDOWN_MS + 1);
    await expect(store.increment('a', 60)).resolves.toBe(3);
    nowSpy.mockReturnValue(UNAVAILABLE_COOLDOWN_MS + 2);
    client.isReady = true;
    await expect(store.increment('a', 60)).resolves.toBe(3);

    expect(client.connect).toHaveBeenCalledTimes(2);
  });

  it('registers an error listener', () => {
    new RedisRateLimitStore('redis://localhost:6379');

    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
