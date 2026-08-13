import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const configured = process.env.ADMIN_TOKEN;
    const supplied = context.switchToHttp().getRequest().headers['x-admin-token'];
    if (!configured || typeof supplied !== 'string') throw new UnauthorizedException({ error: 'Unauthorized' });
    const expected = Buffer.from(configured);
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }
    return true;
  }
}
