/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes and server actions
 * In production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

interface RateLimitConfig {
  limit: number; // Maximum requests allowed
  window: number; // Time window in milliseconds
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.firstRequest > CLEANUP_INTERVAL) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // API routes
  api: {
    default: { limit: 100, window: 60 * 1000 }, // 100 requests per minute
    strict: { limit: 10, window: 60 * 1000 }, // 10 requests per minute
    auth: { limit: 5, window: 60 * 1000 }, // 5 auth attempts per minute
    upload: { limit: 20, window: 60 * 1000 }, // 20 uploads per minute
  },
  // Server actions
  actions: {
    default: { limit: 60, window: 60 * 1000 }, // 60 actions per minute
    sensitive: { limit: 10, window: 60 * 1000 }, // 10 sensitive actions per minute
    payment: { limit: 5, window: 60 * 1000 }, // 5 payment actions per minute
  },
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api.default
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: config.limit - 1, resetIn: config.window };
  }

  const elapsed = now - entry.firstRequest;

  if (elapsed > config.window) {
    // Window expired, reset
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: config.limit - 1, resetIn: config.window };
  }

  if (entry.count >= config.limit) {
    // Rate limited
    const resetIn = config.window - elapsed;
    return { allowed: false, remaining: 0, resetIn };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetIn: config.window - elapsed,
  };
}

/**
 * Create rate limit headers for API responses
 */
export function getRateLimitHeaders(
  result: ReturnType<typeof checkRateLimit>,
  config: RateLimitConfig
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + result.resetIn) / 1000).toString(),
  };
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP from various headers (for proxied requests)
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Rate limit wrapper for API route handlers
 */
export function withRateLimit<T>(
  handler: (request: Request) => Promise<T>,
  config: RateLimitConfig = RATE_LIMITS.api.default
) {
  return async (request: Request): Promise<T | Response> => {
    const identifier = getClientIdentifier(request.headers);
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(result.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
            ...getRateLimitHeaders(result, config),
          },
        }
      );
    }

    return handler(request);
  };
}

/**
 * Check rate limit for server actions
 * @param userId - User ID or session identifier
 * @param actionName - Name of the action for logging
 * @param config - Rate limit configuration
 * @throws Error if rate limited
 */
export function checkActionRateLimit(
  userId: string,
  actionName: string,
  config: RateLimitConfig = RATE_LIMITS.actions.default
): void {
  const identifier = `action:${userId}:${actionName}`;
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded for ${actionName}. Please wait ${Math.ceil(result.resetIn / 1000)} seconds.`
    );
  }
}
