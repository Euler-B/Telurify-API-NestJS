import { RateLimitRule } from '../domain/rate-limit-rule';

const REPORTS_PATH = /^\/v1\/sismos\/\d+\/reports(?:\.[^/]+)?$/;
const DEVICES_PATH = /^\/v1\/devices(?:\.[^/]+)?$/;

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    name: 'req/ip',
    limit: 60,
    periodSeconds: 60,
    discriminator: ({ ip, path }) => (path.startsWith('/assets') ? null : ip),
  },
  {
    name: 'reports/ip',
    limit: 5,
    periodSeconds: 60,
    discriminator: ({ ip, method, path }) => (method === 'POST' && REPORTS_PATH.test(path) ? ip : null),
  },
  {
    name: 'devices/ip',
    limit: 5,
    periodSeconds: 60,
    discriminator: ({ ip, method, path }) => (method === 'POST' && DEVICES_PATH.test(path) ? ip : null),
  },
];
