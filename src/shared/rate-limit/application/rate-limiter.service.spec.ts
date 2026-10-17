import { Logger } from '@nestjs/common';
import { RateLimitStore } from '../domain/rate-limit.store';
import { RateLimiterService } from './rate-limiter.service';

class FakeStore extends RateLimitStore {
  readonly calls: { key: string; ttlSeconds: number }[] = [];

  constructor(private readonly counter: (key: string) => number) {
    super();
  }

  async increment(key: string, ttlSeconds: number) {
    this.calls.push({ key, ttlSeconds });
    return this.counter(key);
  }
}

describe('RateLimiterService', () => {
  const baseRequest = { ip: '203.0.113.10', method: 'GET', path: '/v1/sismos' };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00.000Z'));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('allows requests within the limit and increments the rack-attack compatible key', async () => {
    const store = new FakeStore(() => 1);
    const now = Math.floor(Date.now() / 1000);

    await expect(new RateLimiterService(store).check(baseRequest)).resolves.toBeNull();

    expect(store.calls).toEqual([
      { key: `rack::attack:${Math.floor(now / 60)}:req/ip:203.0.113.10`, ttlSeconds: 60 - (now % 60) + 1 },
    ]);
  });

  it('blocks requests above the limit with Retry-After inside the current window', async () => {
    const service = new RateLimiterService(new FakeStore(() => 61));
    const now = Math.floor(Date.now() / 1000);

    await expect(service.check(baseRequest)).resolves.toEqual({ retryAfter: 60 - (now % 60) });
  });

  it('normalizes the discriminator', async () => {
    const store = new FakeStore(() => 1);
    const now = Math.floor(Date.now() / 1000);

    await new RateLimiterService(store).check({ ...baseRequest, ip: ' 203.0.113.10 ' });

    expect(store.calls).toEqual([
      { key: `rack::attack:${Math.floor(now / 60)}:req/ip:203.0.113.10`, ttlSeconds: 60 - (now % 60) + 1 },
    ]);
  });

  it('skips the global rule for /assets paths', async () => {
    const store = new FakeStore(() => 61);

    await expect(new RateLimiterService(store).check({ ...baseRequest, path: '/assets/logo.png' })).resolves.toBeNull();
    expect(store.calls).toHaveLength(0);
  });

  it('allows requests when the ip is unknown', async () => {
    const store = new FakeStore(() => 61);

    await expect(new RateLimiterService(store).check({ ...baseRequest, ip: '' })).resolves.toBeNull();
    expect(store.calls).toHaveLength(0);
  });

  it('throttles POST report paths, including format suffixes', async () => {
    const store = new FakeStore(() => 6);
    const service = new RateLimiterService(store);
    const now = Math.floor(Date.now() / 1000);
    const reportsKey = `rack::attack:${Math.floor(now / 60)}:reports/ip:203.0.113.10`;

    await expect(service.check({ ip: '203.0.113.10', method: 'POST', path: '/v1/sismos/12/reports' })).resolves.toEqual({ retryAfter: 60 - (now % 60) });
    expect(store.calls.map((call) => call.key)).toContain(reportsKey);

    store.calls.length = 0;

    await expect(service.check({ ip: '203.0.113.10', method: 'POST', path: '/v1/sismos/12/reports.json' })).resolves.toEqual({ retryAfter: 60 - (now % 60) });
    expect(store.calls.map((call) => call.key)).toContain(reportsKey);
  });

  it('does not apply the reports throttle to other requests', async () => {
    const store = new FakeStore(() => 60);
    const service = new RateLimiterService(store);

    await expect(service.check({ ip: '203.0.113.10', method: 'GET', path: '/v1/sismos/12/reports' })).resolves.toBeNull();
    await expect(service.check({ ip: '203.0.113.10', method: 'GET', path: '/v1/sismos/12/reports/5' })).resolves.toBeNull();
    await expect(service.check({ ip: '203.0.113.10', method: 'POST', path: '/v1/sismos/abc/reports' })).resolves.toBeNull();

    expect(store.calls.every((call) => call.key.includes('req/ip'))).toBe(true);
  });

  it('throttles POST device paths', async () => {
    const store = new FakeStore(() => 6);
    const service = new RateLimiterService(store);
    const now = Math.floor(Date.now() / 1000);

    await expect(service.check({ ip: '203.0.113.10', method: 'POST', path: '/v1/devices' })).resolves.toEqual({ retryAfter: 60 - (now % 60) });
    expect(store.calls.map((call) => call.key)).toContain(`rack::attack:${Math.floor(now / 60)}:devices/ip:203.0.113.10`);
  });

  it('does not apply the devices throttle to other methods or nested paths', async () => {
    const store = new FakeStore(() => 60);
    const service = new RateLimiterService(store);

    await expect(service.check({ ip: '203.0.113.10', method: 'GET', path: '/v1/devices' })).resolves.toBeNull();
    await expect(service.check({ ip: '203.0.113.10', method: 'DELETE', path: '/v1/devices/3' })).resolves.toBeNull();

    expect(store.calls.every((call) => call.key.includes('req/ip'))).toBe(true);
  });

  it('stops evaluating rules after the first exceeded rule', async () => {
    const store = new FakeStore(() => 61);
    const service = new RateLimiterService(store);

    await expect(service.check({ ip: '203.0.113.10', method: 'POST', path: '/v1/sismos/12/reports' })).resolves.not.toBeNull();

    expect(store.calls).toHaveLength(1);
    expect(store.calls[0].key).toContain('req/ip');
  });

  it('allows requests when the store is unavailable', async () => {
    const store = new FakeStore(() => {
      throw new Error('connection refused');
    });

    await expect(new RateLimiterService(store).check(baseRequest)).resolves.toBeNull();
  });
});
