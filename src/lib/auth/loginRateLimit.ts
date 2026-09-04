import { RateLimitedError } from "@/lib/errors";

/**
 * Minimal brute-force guard for the admin login endpoint.
 *
 * This is an in-memory counter, not a distributed one — it resets on
 * server restart and isn't shared across instances/regions. That's a
 * documented, acceptable trade-off for a single-instance demo deployment
 * (see README "Known limitations"); a production deployment would move
 * this to DynamoDB (a TTL'd attempts table) or a managed WAF rate-limit
 * rule instead.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

interface Bucket {
  count: number;
  windowStartedAt: number;
}

const attemptsByKey = new Map<string, Bucket>();

/** Throws RateLimitedError if `key` (typically the caller's IP) has made
 *  too many failed attempts recently. Call before verifying the password. */
export function assertNotRateLimited(key: string): void {
  const bucket = attemptsByKey.get(key);
  if (!bucket) return;

  const withinWindow = Date.now() - bucket.windowStartedAt < WINDOW_MS;
  if (withinWindow && bucket.count >= MAX_ATTEMPTS) {
    throw new RateLimitedError(
      `Too many login attempts. Please wait ${Math.ceil(
        (WINDOW_MS - (Date.now() - bucket.windowStartedAt)) / 1000
      )}s and try again.`
    );
  }
}

/** Records a failed login attempt for `key`. */
export function recordFailedAttempt(key: string): void {
  const bucket = attemptsByKey.get(key);
  const now = Date.now();

  if (!bucket || now - bucket.windowStartedAt >= WINDOW_MS) {
    attemptsByKey.set(key, { count: 1, windowStartedAt: now });
    return;
  }
  bucket.count += 1;
}

/** Clears attempt history for `key` after a successful login. */
export function clearAttempts(key: string): void {
  attemptsByKey.delete(key);
}
