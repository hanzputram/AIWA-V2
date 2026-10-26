import crypto from 'crypto';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkBruteForce(key: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(key: string): {
  remaining: number;
  locked: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  let record = attempts.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    attempts.set(key, record);
    return {
      remaining: 0,
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  attempts.set(key, record);
  return {
    remaining: MAX_ATTEMPTS - record.count,
    locked: false,
    retryAfterSeconds: 0,
  };
}

export function resetAttempts(key: string): void {
  attempts.delete(key);
}

export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
