'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Tenant, CurrencyCode, CURRENCIES } from '@/types/models/tenant';
import { Subscription, isSubscriptionActive, getTrialDaysRemaining } from '@/types/models/subscription';

/**
 * Tenant context state
 */
export interface TenantState {
  /** Current tenant data */
  tenant: Tenant | null;
  /** Current subscription data */
  subscription: Subscription | null;
  /** Whether tenant data is loading */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Tenant context value
 */
export interface TenantContextValue extends TenantState {
  /** Whether the subscription is active */
  isActive: boolean;
  /** Days remaining in trial (0 if not in trial) */
  trialDaysRemaining: number;
  /** Format a number as currency using tenant's currency */
  formatCurrency: (amount: number) => string;
  /** Get currency symbol */
  getCurrencySymbol: () => string;
  /** Refresh tenant data */
  refresh: () => void;
}

const initialState: TenantState = {
  tenant: null,
  subscription: null,
  loading: true,
  error: null,
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export interface TenantProviderProps {
  children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { claims, loading: authLoading } = useAuth();
  const [state, setState] = useState<TenantState>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to tenant and subscription data
  useEffect(() => {
    if (authLoading) return;

    const tenantId = claims?.tenantId;
    if (!tenantId) {
      setState({
        tenant: null,
        subscription: null,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const unsubscribers: Unsubscribe[] = [];

    // Subscribe to tenant document
    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantUnsubscribe = onSnapshot(
      tenantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const tenantData = { id: snapshot.id, ...snapshot.data() } as Tenant;
          setState((prev) => ({
            ...prev,
            tenant: tenantData,
            loading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            tenant: null,
            loading: false,
            error: new Error('Tenant not found'),
          }));
        }
      },
      (error) => {
        console.error('Error fetching tenant:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    );
    unsubscribers.push(tenantUnsubscribe);

    // Subscribe to subscription document
    const subscriptionRef = doc(db, 'subscriptions', tenantId);
    const subscriptionUnsubscribe = onSnapshot(
      subscriptionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const subscriptionData = { id: snapshot.id, ...snapshot.data() } as Subscription;
          setState((prev) => ({
            ...prev,
            subscription: subscriptionData,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            subscription: null,
          }));
        }
      },
      (error) => {
        console.error('Error fetching subscription:', error);
      }
    );
    unsubscribers.push(subscriptionUnsubscribe);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [claims?.tenantId, authLoading, refreshKey]);

  // Format currency using tenant's currency setting
  const formatCurrency = useCallback(
    (amount: number): string => {
      const currency = state.tenant?.currency || 'SAR';
      const locale = state.tenant?.language === 'ar' ? 'ar-SA' : 'en-US';

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        // Fallback for unsupported currencies
        const symbol = CURRENCIES[currency]?.symbol || currency;
        return `${symbol} ${amount.toFixed(2)}`;
      }
    },
    [state.tenant?.currency, state.tenant?.language]
  );

  // Get currency symbol
  const getCurrencySymbol = useCallback((): string => {
    const currency = state.tenant?.currency || 'SAR';
    return CURRENCIES[currency]?.symbol || currency;
  }, [state.tenant?.currency]);

  // Trigger a refresh of tenant data
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value: TenantContextValue = {
    ...state,
    isActive: isSubscriptionActive(state.subscription),
    trialDaysRemaining: getTrialDaysRemaining(state.subscription),
    formatCurrency,
    getCurrencySymbol,
    refresh,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

/**
 * Hook to access tenant context
 * Must be used within a TenantProvider
 */
export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}

export default TenantContext;
