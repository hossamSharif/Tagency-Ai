import { User as FirebaseUser } from 'firebase/auth';

/**
 * User roles in the application
 */
export type UserRole = 'owner' | 'admin' | 'staff' | 'customer' | 'partner';

/**
 * Custom claims stored in Firebase Auth token
 * These are set via Firebase Admin SDK and used for authorization
 */
export interface CustomClaims {
  /** The tenant ID this user belongs to */
  tenantId?: string;
  /** The user's role within the tenant */
  role?: UserRole;
  /** If user is a partner, their partner office ID */
  partnerOfficeId?: string;
  /** If user is a platform admin (can access all tenants) */
  platformAdmin?: boolean;
}

/**
 * Extended user type with custom claims
 */
export interface AuthUser extends FirebaseUser {
  customClaims?: CustomClaims;
}

/**
 * Auth state for the application
 */
export interface AuthState {
  /** The current user, null if not authenticated */
  user: AuthUser | null;
  /** Custom claims from the token */
  claims: CustomClaims | null;
  /** Whether the auth state is still loading */
  loading: boolean;
  /** Any error that occurred during auth */
  error: Error | null;
}

/**
 * Auth context value type
 */
export interface AuthContextValue extends AuthState {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with email, password, and optional display name */
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Reset password for an email */
  resetPassword: (email: string) => Promise<void>;
  /** Refresh the user's token to get updated claims */
  refreshToken: () => Promise<void>;
  /** Check if user has a specific role */
  hasRole: (role: UserRole | UserRole[]) => boolean;
  /** Check if user belongs to a specific tenant */
  belongsToTenant: (tenantId: string) => boolean;
  /** Check if user is a platform admin */
  isPlatformAdmin: () => boolean;
}

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
export const ROLE_HIERARCHY: UserRole[] = ['customer', 'partner', 'staff', 'admin', 'owner'];

/**
 * Check if a role has at least the permissions of another role
 */
export function hasMinimumRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Roles that can manage other users
 */
export const MANAGEMENT_ROLES: UserRole[] = ['owner', 'admin'];

/**
 * Roles that can create/edit packages
 */
export const PACKAGE_MANAGEMENT_ROLES: UserRole[] = ['owner', 'admin', 'staff'];

/**
 * Roles that can view financial data
 */
export const FINANCIAL_VIEW_ROLES: UserRole[] = ['owner', 'admin'];

/**
 * Roles that can approve payments
 */
export const PAYMENT_APPROVAL_ROLES: UserRole[] = ['owner', 'admin'];
