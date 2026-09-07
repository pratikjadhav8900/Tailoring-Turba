/**
 * Tailoring Turba — In-Memory Sliding Window Rate Limiting & Attempt Counter
 * 
 * Provides server-side rate-limiting and brute-force lockout for sensitive endpoints
 * (Password Reset OTP, Public Order Tracking, and Authentication).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const failedAttemptsStore = new Map<string, { count: number; lastAttempt: number }>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    });
    failedAttemptsStore.forEach((entry, key) => {
      if (now - entry.lastAttempt > 30 * 60 * 1000) {
        failedAttemptsStore.delete(key);
      }
    });
  }, 10 * 60 * 1000).unref?.();
}

/**
 * Checks and updates rate limit counter for a given key.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Records a failed password reset verification attempt.
 * Returns the current total count of failed attempts.
 */
export function recordFailedResetAttempt(email: string): number {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);

  if (!entry || now - entry.lastAttempt > 15 * 60 * 1000) {
    failedAttemptsStore.set(key, { count: 1, lastAttempt: now });
    return 1;
  }

  entry.count += 1;
  entry.lastAttempt = now;
  return entry.count;
}

/**
 * Returns the current failed attempt count for a reset email.
 */
export function getFailedResetAttempts(email: string): number {
  const key = email.toLowerCase().trim();
  const entry = failedAttemptsStore.get(key);
  if (!entry) return 0;
  if (Date.now() - entry.lastAttempt > 15 * 60 * 1000) {
    failedAttemptsStore.delete(key);
    return 0;
  }
  return entry.count;
}

/**
 * Clears failed password reset attempts after successful verification or expiry.
 */
export function clearFailedResetAttempts(email: string): void {
  failedAttemptsStore.delete(email.toLowerCase().trim());
}

/**
 * Resets stores (primarily for automated testing environments).
 */
export function resetRateLimitStores(): void {
  rateLimitStore.clear();
  failedAttemptsStore.clear();
}
