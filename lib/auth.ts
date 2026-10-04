import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual } from 'crypto';

const AUTH_COOKIE_NAME = 'cms_auth_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Get the secret key for JWT signing
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify password using constant-time comparison to prevent timing attacks.
 * Fails closed when ADMIN_PASSWORD is not configured.
 */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string' || password.length === 0) {
    return false;
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);

  // timingSafeEqual requires equal lengths; compare against a dummy buffer
  // of the same length when lengths differ to keep timing consistent.
  if (a.length !== b.length) {
    try {
      timingSafeEqual(a, Buffer.alloc(a.length));
    } catch {
      // ignore - used only to burn comparable time
    }
    return false;
  }

  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Create JWT token
 */
export async function createToken(): Promise<string> {
  const secret = getSecretKey();
  
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Get auth token from cookie
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }
  return await verifyToken(token);
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Unauthorized');
  }
}
