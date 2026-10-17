export type RateLimitRequest = {
  ip: string;
  method: string;
  path: string;
};

export type RateLimitRule = {
  name: string;
  limit: number;
  periodSeconds: number;
  discriminator: (request: RateLimitRequest) => string | null;
};

export type RateLimitDecision = {
  retryAfter: number;
};
