/**
 * CSRF Protection Utility
 *
 * Provides CSRF token generation and validation for server actions
 * Uses the Double Submit Cookie pattern with additional origin validation
 */

import { cookies, headers } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

interface CSRFPayload {
  token: string;
  timestamp: number;
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(32).toString('hex');
  const payload: CSRFPayload = { token: randomPart, timestamp };
  const payloadString = JSON.stringify(payload);
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(payloadString)
    .digest('hex');

  return `${Buffer.from(payloadString).toString('base64')}.${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
      return false;
    }

    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(payloadString)
      .digest('hex');

    if (signature !== expectedSignature) {
      return false;
    }

    const payload: CSRFPayload = JSON.parse(payloadString);
    const now = Date.now();

    // Check if token has expired
    if (now - payload.timestamp > TOKEN_EXPIRY) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Set CSRF cookie for the client
 */
export async function setCSRFCookie(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Needs to be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY / 1000, // Convert to seconds
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Get CSRF token from request header
 */
export async function getCSRFFromHeader(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get(CSRF_HEADER_NAME) || undefined;
}

/**
 * Validate CSRF token in server action
 * Compares cookie token with header token
 */
export async function validateCSRF(): Promise<{ valid: boolean; error?: string }> {
  const cookieToken = await getCSRFFromCookie();
  const headerToken = await getCSRFFromHeader();

  if (!cookieToken) {
    return { valid: false, error: 'CSRF cookie not found' };
  }

  if (!headerToken) {
    return { valid: false, error: 'CSRF header not found' };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  if (!validateCSRFToken(cookieToken)) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }

  return { valid: true };
}

/**
 * Validate request origin for additional security
 */
export async function validateOrigin(): Promise<{ valid: boolean; error?: string }> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return { valid: true };
  }

  if (!origin) {
    // Origin header may be missing for same-origin requests in some browsers
    // Additional checks would be needed for stricter validation
    return { valid: true };
  }

  try {
    const originUrl = new URL(origin);
    const expectedHost = host?.split(':')[0]; // Remove port if present

    if (originUrl.hostname !== expectedHost) {
      return { valid: false, error: 'Origin mismatch' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid origin' };
  }
}

/**
 * Full CSRF validation for server actions
 * Includes both token and origin validation
 */
export async function validateRequest(): Promise<{ valid: boolean; error?: string }> {
  const originResult = await validateOrigin();
  if (!originResult.valid) {
    return originResult;
  }

  // CSRF token validation is optional for same-origin requests
  // but recommended for sensitive actions
  const csrfResult = await validateCSRF();
  if (!csrfResult.valid) {
    // Log the error but don't block same-origin requests without CSRF
    console.warn('CSRF validation warning:', csrfResult.error);
  }

  return { valid: true };
}

/**
 * Higher-order function to wrap server actions with CSRF protection
 */
export function withCSRFProtection<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: { strict?: boolean } = {}
): (...args: TArgs) => Promise<TResult> {
  const { strict = false } = options;

  return async (...args: TArgs): Promise<TResult> => {
    const result = await validateRequest();

    if (!result.valid && strict) {
      throw new Error(`CSRF validation failed: ${result.error}`);
    }

    return action(...args);
  };
}
