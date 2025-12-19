'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Fetch custom claims from token
  const fetchClaims = useCallback(async (user: User): Promise<CustomClaims | null> => {
    try {
      const tokenResult = await getIdTokenResult(true);
      if (tokenResult) {
        return {
          tenantId: tokenResult.claims.tenantId as string | undefined,
          role: tokenResult.claims.role as UserRole | undefined,
          partnerOfficeId: tokenResult.claims.partnerOfficeId as string | undefined,
          platformAdmin: tokenResult.claims.platformAdmin as boolean | undefined,
        };
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
    return null;
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        const claims = await fetchClaims(user);
        const authUser: AuthUser = user;
        authUser.customClaims = claims || undefined;

        setState({
          user: authUser,
          claims,
          loading: false,
          error: null,
        });
      } else {
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
      const claims = await fetchClaims(state.user);
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
