import { MemoryRateLimitStore } from './memory-rate-limit.store';

describe('MemoryRateLimitStore', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('increments counters per key', async () => {
    const store = new MemoryRateLimitStore();

    await expect(store.increment('a', 60)).resolves.toBe(1);
    await expect(store.increment('a', 60)).resolves.toBe(2);
    await expect(store.increment('b', 60)).resolves.toBe(1);
  });

  it('resets the counter once the ttl elapses', async () => {
    const store = new MemoryRateLimitStore();

    await store.increment('a', 60);
    await store.increment('a', 60);
    jest.advanceTimersByTime(60_000);

    await expect(store.increment('a', 60)).resolves.toBe(1);
  });
});
