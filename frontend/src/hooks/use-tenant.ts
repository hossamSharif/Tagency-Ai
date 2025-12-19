'use client';

import { useTenantContext } from '@/contexts/tenant-context';
import { CurrencyCode, Language, ThemePreference } from '@/types/models/tenant';

/**
 * Hook for accessing tenant context
 * This is the primary way to interact with tenant data in client components
 */
export function useTenant() {
  return useTenantContext();
}

/**
 * Hook that returns the current tenant or null
 */
export function useCurrentTenant() {
  const { tenant } = useTenant();
  return tenant;
}

/**
 * Hook that returns the current subscription or null
 */
export function useSubscription() {
  const { subscription } = useTenant();
  return subscription;
}

/**
 * Hook that returns whether the tenant is loading
 */
export function useTenantLoading(): boolean {
  const { loading } = useTenant();
  return loading;
}

/**
 * Hook that returns the tenant's currency
 */
export function useCurrency(): CurrencyCode {
  const { tenant } = useTenant();
  return tenant?.currency || 'SAR';
}

/**
 * Hook that returns the tenant's language
 */
export function useTenantLanguage(): Language {
  const { tenant } = useTenant();
  return tenant?.language || 'ar';
}

/**
 * Hook that returns the tenant's theme preference
 */
export function useTenantTheme(): ThemePreference {
  const { tenant } = useTenant();
  return tenant?.theme || 'light';
}

/**
 * Hook that returns the currency formatter function
 */
export function useCurrencyFormatter() {
  const { formatCurrency } = useTenant();
  return formatCurrency;
}

/**
 * Hook that returns the currency symbol
 */
export function useCurrencySymbol(): string {
  const { getCurrencySymbol } = useTenant();
  return getCurrencySymbol();
}

/**
 * Hook that returns whether the subscription is active
 */
export function useIsSubscriptionActive(): boolean {
  const { isActive } = useTenant();
  return isActive;
}

/**
 * Hook that returns the number of days remaining in trial
 */
export function useTrialDaysRemaining(): number {
  const { trialDaysRemaining } = useTenant();
  return trialDaysRemaining;
}

/**
 * Hook that returns whether the tenant is in trial
 */
export function useIsInTrial(): boolean {
  const { subscription, trialDaysRemaining } = useTenant();
  return subscription?.plan === 'trial' && trialDaysRemaining > 0;
}

/**
 * Hook that returns whether the trial is ending soon (3 days or less)
 */
export function useIsTrialEndingSoon(): boolean {
  const { subscription, trialDaysRemaining } = useTenant();
  return subscription?.plan === 'trial' && trialDaysRemaining > 0 && trialDaysRemaining <= 3;
}

/**
 * Hook for requiring an active subscription
 * Returns redirect path if subscription is not active
 */
export function useRequireSubscription(redirectTo = '/subscription'): {
  isActive: boolean;
  isLoading: boolean;
  redirectTo: string | null;
} {
  const { isActive, loading, subscription } = useTenant();

  return {
    isActive,
    isLoading: loading,
    redirectTo: !loading && subscription && !isActive ? redirectTo : null,
  };
}

/**
 * Hook that returns tenant ID if available
 */
export function useTenantId(): string | undefined {
  const { tenant } = useTenant();
  return tenant?.id;
}

/**
 * Hook that returns tenant name
 */
export function useTenantName(): string {
  const { tenant } = useTenant();
  return tenant?.name || '';
}

export default useTenant;
