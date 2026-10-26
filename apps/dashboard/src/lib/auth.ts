// AIWA Dashboard Authentication Utilities
const COOKIE_NAME = 'aiwa_session';

export function getAuthUsername(): string {
  return process.env.AUTH_USERNAME || process.env.APP_USERNAME || 'admin';
}

export function getAuthPassword(): string {
  return process.env.AUTH_PASSWORD || process.env.APP_PASSWORD || 'ATSSY001!araya#$';
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || 'aiwa-v2-whatsapp-sales-secret-salt-2026';
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, stringToBytes(data));
  return bufferToHex(signature);
}

export async function createSessionToken(rememberMe: boolean = true): Promise<{ token: string; maxAge: number }> {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  const expiresAt = Date.now() + maxAge * 1000;
  const data = 'aiwa:' + expiresAt;
  const signature = await sign(data, getAuthSecret());
  const token = expiresAt + '.' + signature;
  return { token, maxAge };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const data = 'aiwa:' + expiresAt;
  const expectedSignature = await sign(data, getAuthSecret());

  return signature === expectedSignature;
}

export { COOKIE_NAME };
