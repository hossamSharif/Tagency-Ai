import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { type UserRole, hasMinimumRole, ROLE_HIERARCHY } from '@/types/auth';

/**
 * Session data from verified cookie
 */
export interface SessionUser {
  uid: string;
  email: string;
  tenantId: string;
  role: UserRole;
  emailVerified: boolean;
  platformAdmin: boolean;
}

/**
 * Get the current session user from cookies
 * Returns null if not authenticated or session is invalid
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      tenantId: decodedToken.tenantId as string,
      role: (decodedToken.role as UserRole) || 'customer',
      emailVerified: decodedToken.email_verified || false,
      platformAdmin: decodedToken.platformAdmin === true,
    };
  } catch {
    // Invalid or expired session
    return null;
  }
}

/**
 * Require authentication for a page/action
 * Redirects to login if not authenticated
 */
export async function requireAuth(locale = 'ar'): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return user;
}

/**
 * Require a specific role or higher
 * Redirects to login if not authenticated, or dashboard if unauthorized
 */
export async function requireRole(
  requiredRole: UserRole,
  locale = 'ar'
): Promise<SessionUser> {
  const user = await requireAuth(locale);

  if (!hasMinimumRole(user.role, requiredRole)) {
    // Redirect to dashboard with unauthorized message
    redirect(`/${locale}?error=unauthorized`);
  }

  return user;
}

/**
 * Require one of the specified roles
 */
export async function requireRoles(
  allowedRoles: UserRole[],
  locale = 'ar'
): Promise<SessionUser> {
  const user = await requireAuth(locale);

  if (!allowedRoles.includes(user.role)) {
    redirect(`/${locale}?error=unauthorized`);
  }

  return user;
}

/**
 * Require platform admin access
 */
export async function requirePlatformAdmin(locale = 'ar'): Promise<SessionUser> {
  const user = await requireAuth(locale);

  if (!user.platformAdmin) {
    redirect(`/${locale}?error=unauthorized`);
  }

  return user;
}

/**
 * Require email verification
 */
export async function requireVerifiedEmail(locale = 'ar'): Promise<SessionUser> {
  const user = await requireAuth(locale);

  if (!user.emailVerified) {
    redirect(`/${locale}/verify-email`);
  }

  return user;
}

/**
 * Check if user has at least the specified role (no redirect)
 */
export async function checkRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getSessionUser();

  if (!user) {
    return false;
  }

  return hasMinimumRole(user.role, requiredRole);
}

/**
 * Check if user has one of the specified roles (no redirect)
 */
export async function checkRoles(allowedRoles: UserRole[]): Promise<boolean> {
  const user = await getSessionUser();

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
}

/**
 * Higher-order function to wrap a server action with role check
 */
export function withRole<TArgs extends unknown[], TReturn>(
  requiredRole: UserRole,
  action: (user: SessionUser, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const user = await getSessionUser();

    if (!user) {
      throw new Error('Unauthorized: Not authenticated');
    }

    if (!hasMinimumRole(user.role, requiredRole)) {
      throw new Error('Unauthorized: Insufficient permissions');
    }

    return action(user, ...args);
  };
}

/**
 * Higher-order function to wrap a server action with roles check
 */
export function withRoles<TArgs extends unknown[], TReturn>(
  allowedRoles: UserRole[],
  action: (user: SessionUser, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const user = await getSessionUser();

    if (!user) {
      throw new Error('Unauthorized: Not authenticated');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new Error('Unauthorized: Insufficient permissions');
    }

    return action(user, ...args);
  };
}

/**
 * Role display information
 */
export const ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  owner: { en: 'Owner', ar: 'مالك' },
  admin: { en: 'Admin', ar: 'مدير' },
  staff: { en: 'Staff', ar: 'موظف' },
  customer: { en: 'Customer', ar: 'عميل' },
  partner: { en: 'Partner', ar: 'شريك' },
};

/**
 * Get role label based on locale
 */
export function getRoleLabel(role: UserRole, locale: 'ar' | 'en' = 'ar'): string {
  return ROLE_LABELS[role]?.[locale] || role;
}
