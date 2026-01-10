'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  onAuthStateChange,
  getIdTokenResult,
} from '@/lib/firebase/auth';
import { AuthContextValue, AuthState, CustomClaims, UserRole, AuthUser } from '@/types/auth';

const initialState: AuthState = {
  user: null,
  claims: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Cache key for storing claims in sessionStorage
const CLAIMS_CACHE_KEY = 'auth_claims_cache';

/**
 * Get cached claims from sessionStorage
 */
function getCachedClaims(userId: string): CustomClaims | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(CLAIMS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Verify the cached claims belong to current user
      if (parsed.userId === userId) {
        return parsed.claims;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

/**
 * Cache claims in sessionStorage
 */
function setCachedClaims(userId: string, claims: CustomClaims): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CLAIMS_CACHE_KEY, JSON.stringify({ userId, claims }));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Clear cached claims
 */
function clearCachedClaims(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CLAIMS_CACHE_KEY);
  } catch {
    // Ignore cache errors
  }
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const claimsRefreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;

  // Fetch custom claims from token with CORS resilience
  const fetchClaims = useCallback(async (user: User, forceRefresh = false): Promise<CustomClaims | null> => {
    // First try to get cached claims (useful when CORS fails)
    const cachedClaims = getCachedClaims(user.uid);

    try {
      // Only force refresh if explicitly requested and we haven't exceeded attempts
      const shouldForceRefresh = forceRefresh && claimsRefreshAttempts.current < maxRefreshAttempts;
      const tokenResult = await getIdTokenResult(shouldForceRefresh);

      if (tokenResult) {
        const claims: CustomClaims = {
          tenantId: tokenResult.claims.tenantId as string | undefined,
          role: tokenResult.claims.role as UserRole | undefined,
          partnerOfficeId: tokenResult.claims.partnerOfficeId as string | undefined,
          platformAdmin: tokenResult.claims.platformAdmin as boolean | undefined,
        };

        // Cache the claims for CORS failure recovery
        if (claims.tenantId) {
          setCachedClaims(user.uid, claims);
          claimsRefreshAttempts.current = 0; // Reset attempts on success
        }

        return claims;
      }
    } catch (error) {
      // Increment refresh attempts to avoid infinite CORS failures
      claimsRefreshAttempts.current++;

      // Check if it's a CORS error
      const isCorsError = error instanceof Error &&
        (error.message.includes('CORS') ||
         error.message.includes('network') ||
         error.message.includes('Failed to fetch'));

      if (isCorsError) {
        console.warn('Auth token refresh failed (CORS). Using cached claims if available.');
      } else {
        console.error('Error fetching claims:', error);
      }

      // Return cached claims on error (especially CORS errors)
      if (cachedClaims) {
        console.log('Using cached claims due to refresh failure');
        return cachedClaims;
      }
    }

    // Last resort: return cached claims
    return cachedClaims;
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // Try to get claims without forcing refresh initially (to avoid CORS issues)
        const claims = await fetchClaims(user, false);
        const authUser: AuthUser = user;
        authUser.customClaims = claims || undefined;

        setState({
          user: authUser,
          claims,
          loading: false,
          error: null,
        });
      } else {
        // Clear cached claims on sign out
        clearCachedClaims();
        setState({
          user: null,
          claims: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [fetchClaims]);

  // Sign in handler
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseSignIn(email, password);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      }));
      throw error;
    }
  }, []);

  // Sign up handler
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseSignUp(email, password, displayName);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Sign up failed'),
      }));
      throw error;
    }
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Clear cached claims before signing out
      clearCachedClaims();
      await firebaseSignOut();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Sign out failed'),
      }));
      throw error;
    }
  }, []);

  // Reset password handler
  const resetPassword = useCallback(async (email: string) => {
    try {
      await firebaseResetPassword(email);
    } catch (error) {
      throw error;
    }
  }, []);

  // Refresh token to get updated claims
  const refreshToken = useCallback(async () => {
    if (state.user) {
      // Force refresh to get latest claims
      const claims = await fetchClaims(state.user, true);
      setState((prev) => ({ ...prev, claims }));
    }
  }, [state.user, fetchClaims]);

  // Check if user has a specific role
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.claims?.role) return false;
      if (Array.isArray(role)) {
        return role.includes(state.claims.role);
      }
      return state.claims.role === role;
    },
    [state.claims]
  );

  // Check if user belongs to a specific tenant
  const belongsToTenant = useCallback(
    (tenantId: string): boolean => {
      return state.claims?.tenantId === tenantId;
    },
    [state.claims]
  );

  // Check if user is a platform admin
  const isPlatformAdmin = useCallback((): boolean => {
    return state.claims?.platformAdmin === true;
  }, [state.claims]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshToken,
    hasRole,
    belongsToTenant,
    isPlatformAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
