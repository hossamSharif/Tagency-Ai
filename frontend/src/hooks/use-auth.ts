'use client';

import { useAuthContext } from '@/contexts/auth-context';
import { UserRole, hasMinimumRole, ROLE_HIERARCHY } from '@/types/auth';

/**
 * Hook for accessing authentication state and methods
 * This is the primary way to interact with auth in client components
 */
export function useAuth() {
  const context = useAuthContext();
  return context;
}

/**
 * Hook that returns true if the user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

/**
 * Hook that returns true if the user is still loading
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuth();
  return loading;
}

/**
 * Hook that returns the current user or null
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook that returns the current user's claims
 */
export function useClaims() {
  const { claims } = useAuth();
  return claims;
}

/**
 * Hook that returns the current tenant ID
 */
export function useTenantId(): string | undefined {
  const { claims } = useAuth();
  return claims?.tenantId;
}

/**
 * Hook that returns the current user's role
 */
export function useUserRole(): UserRole | undefined {
  const { claims } = useAuth();
  return claims?.role;
}

/**
 * Hook that checks if the current user has at least the specified role
 */
export function useHasMinimumRole(requiredRole: UserRole): boolean {
  const { claims } = useAuth();
  return hasMinimumRole(claims?.role, requiredRole);
}

/**
 * Hook that checks if the current user can perform management actions
 */
export function useCanManage(): boolean {
  const { claims } = useAuth();
  return claims?.role === 'owner' || claims?.role === 'admin';
}

/**
 * Hook that checks if the current user can manage packages
 */
export function useCanManagePackages(): boolean {
  const { claims } = useAuth();
  const role = claims?.role;
  return role === 'owner' || role === 'admin' || role === 'staff';
}

/**
 * Hook that checks if the current user can view financial data
 */
export function useCanViewFinancials(): boolean {
  const { claims } = useAuth();
  return claims?.role === 'owner' || claims?.role === 'admin';
}

/**
 * Hook that checks if the current user is a partner
 */
export function useIsPartner(): boolean {
  const { claims } = useAuth();
  return claims?.role === 'partner';
}

/**
 * Hook that returns the partner office ID if user is a partner
 */
export function usePartnerOfficeId(): string | undefined {
  const { claims } = useAuth();
  return claims?.partnerOfficeId;
}

/**
 * Hook that checks if the current user is a platform admin
 */
export function useIsPlatformAdmin(): boolean {
  const { isPlatformAdmin } = useAuth();
  return isPlatformAdmin();
}

/**
 * Hook for requiring authentication
 * Returns the redirect path if not authenticated
 */
export function useRequireAuth(redirectTo = '/login'): {
  isAuthenticated: boolean;
  isLoading: boolean;
  redirectTo: string | null;
} {
  const { user, loading } = useAuth();

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    redirectTo: !loading && !user ? redirectTo : null,
  };
}

/**
 * Hook for requiring a specific role
 * Returns the redirect path if role requirement not met
 */
export function useRequireRole(
  requiredRole: UserRole | UserRole[],
  redirectTo = '/unauthorized'
): {
  hasRequiredRole: boolean;
  isLoading: boolean;
  redirectTo: string | null;
} {
  const { user, claims, loading, hasRole } = useAuth();

  const hasRequiredRole = !!user && hasRole(requiredRole);

  return {
    hasRequiredRole,
    isLoading: loading,
    redirectTo: !loading && user && !hasRequiredRole ? redirectTo : null,
  };
}

export default useAuth;
