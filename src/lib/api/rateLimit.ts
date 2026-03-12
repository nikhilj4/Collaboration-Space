import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429; retryAfterSeconds: number; limit: number; remaining: number };

let _ratelimit: Ratelimit | null = null;
let _redis: Redis | null = null;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;
  const e = env();
  if (!e.UPSTASH_REDIS_REST_URL || !e.UPSTASH_REDIS_REST_TOKEN) return null;

  _redis = new Redis({
    url: e.UPSTASH_REDIS_REST_URL,
    token: e.UPSTASH_REDIS_REST_TOKEN,
  });

  _ratelimit = new Ratelimit({
    redis: _redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'), // default: 30 req/min
    analytics: true,
    prefix: 'nova_rl',
  });

  return _ratelimit;
}

function ipFromRequest(req: NextRequest) {
  // Works on Vercel/most proxies
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim();
  return ip || 'unknown';
}

export async function rateLimit(req: NextRequest, opts?: { keyPrefix?: string; max?: number; window?: `${number} s` | `${number} m` }) : Promise<RateLimitResult> {
  const rl = getRatelimit();
  if (!rl) return { ok: true }; // no-op if Upstash not configured

  const keyPrefix = opts?.keyPrefix ?? 'api';
  const id = `${keyPrefix}:${ipFromRequest(req)}`;

  // If caller passes custom values, build a dedicated Ratelimit instance (rare, small overhead).
  const max = opts?.max;
  const window = opts?.window;
  const limiter = (max && window) ? new Ratelimit({
    redis: _redis!,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix: `nova_rl_${keyPrefix}`,
  }) : rl;

  const result = await limiter.limit(id);
  if (result.success) return { ok: true };

  const resetMs = result.reset - Date.now();
  const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
  return {
    ok: false,
    status: 429,
    retryAfterSeconds,
    limit: result.limit,
    remaining: result.remaining,
  };
}

