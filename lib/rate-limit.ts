/**
 * Rate limiting utilities to prevent abuse
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for serverless, consider Redis/Upstash for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Unique identifier for this rate limit */
  identifier: string;
}

/**
 * Check if a request should be rate limited
 * @returns null if allowed, or { error, retryAfter } if rate limited
 */
export function checkRateLimit(config: RateLimitConfig): { 
  allowed: boolean; 
  remaining: number; 
  reset: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  const entry = rateLimitStore.get(config.identifier);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry
    const resetTime = now + windowMs;
    rateLimitStore.set(config.identifier, {
      count: 1,
      resetTime,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: resetTime,
    };
  }
  
  // Update existing entry
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter,
    };
  }
  
  entry.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP or headers)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  
  return ip.trim();
}

/**
 * Rate limit middleware helper
 */
export function rateLimitMiddleware(
  request: Request,
  config: Omit<RateLimitConfig, 'identifier'>
): { 
  allowed: boolean; 
  headers: Record<string, string>;
  retryAfter?: number;
} {
  const clientId = getClientIdentifier(request);
  const result = checkRateLimit({
    ...config,
    identifier: `${config.maxRequests}:${config.windowSeconds}:${clientId}`,
  });
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
  
  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return {
    allowed: result.allowed,
    headers,
    retryAfter: result.retryAfter,
  };
}
