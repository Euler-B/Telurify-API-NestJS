import type { NextFunction, Request, Response } from 'express';
import { RateLimiterService } from './application/rate-limiter.service';
import { RateLimitMiddleware } from './rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  const createResponse = () => {
    const response = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    return response;
  };

  const request = (overrides: Partial<Request> = {}) =>
    ({ ip: '203.0.113.10', method: 'GET', path: '/v1/sismos', socket: {}, ...overrides }) as Request;

  it('calls next when the request is allowed', async () => {
    const limiter = { check: jest.fn().mockResolvedValue(null) } as unknown as RateLimiterService;
    const response = createResponse();
    const next = jest.fn();

    await new RateLimitMiddleware(limiter).use(request(), response as unknown as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalled();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('responds 429 with Retry-After and the Rails-compatible body', async () => {
    const limiter = { check: jest.fn().mockResolvedValue({ retryAfter: 42 }) } as unknown as RateLimiterService;
    const response = createResponse();
    const next = jest.fn();

    await new RateLimitMiddleware(limiter).use(request(), response as unknown as Response, next as unknown as NextFunction);

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '42');
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({ error: 'Rate limit exceeded. Try again in 42 seconds.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to the socket address when ip is undefined', async () => {
    const limiter = { check: jest.fn().mockResolvedValue(null) } as unknown as RateLimiterService;

    await new RateLimitMiddleware(limiter).use(
      request({ ip: undefined, socket: { remoteAddress: '::1' } as Request['socket'] }),
      createResponse() as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(limiter.check).toHaveBeenCalledWith({ ip: '::1', method: 'GET', path: '/v1/sismos' });
  });
});
