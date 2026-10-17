import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RateLimiterService } from './application/rate-limiter.service';

@Injectable()
export class RateLimitMiddleware {
  constructor(private readonly limiter: RateLimiterService) {}

  async use(request: Request, response: Response, next: NextFunction) {
    const decision = await this.limiter.check({
      ip: request.ip ?? request.socket.remoteAddress ?? '',
      method: request.method,
      path: request.path,
    });

    if (!decision) {
      next();
      return;
    }

    response.setHeader('Retry-After', String(decision.retryAfter));
    response.status(429).json({ error: `Rate limit exceeded. Try again in ${decision.retryAfter} seconds.` });
  }
}
