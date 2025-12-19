'use client';

/**
 * Subscription Hook
 *
 * T198: Hook for managing subscription data and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from '@/hooks/use-tenant';
import type {
  Subscription,
  SubscriptionPayment,
  SubscriptionStatusCheck,
} from '@/types/models/subscription';
import {
  getSubscriptionStatusCheck,
  getTrialDaysRemaining,
  isTrialEndingSoon,
} from '@/types/models/subscription';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  statusCheck: SubscriptionStatusCheck | null;
  trialDaysRemaining: number;
  isTrialEndingSoon: boolean;
  refresh: () => void;
}

/**
 * Hook to get and subscribe to the current tenant's subscription
 */
export function useSubscription(): UseSubscriptionReturn {
  const { tenant } = useTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!tenant?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscriptionRef = doc(db, 'subscriptions', tenant.id);

    const unsubscribe = onSnapshot(
      subscriptionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSubscription({
            id: snapshot.id,
            ...snapshot.data(),
          } as Subscription);
        } else {
          setSubscription(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Subscription subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, refreshKey]);

  const statusCheck = subscription ? getSubscriptionStatusCheck(subscription) : null;
  const trialDays = getTrialDaysRemaining(subscription);
  const trialEndingSoon = isTrialEndingSoon(subscription);

  return {
    subscription,
    loading,
    error,
    statusCheck,
    trialDaysRemaining: trialDays,
    isTrialEndingSoon: trialEndingSoon,
    refresh,
  };
}

interface UseSubscriptionPaymentsReturn {
  payments: SubscriptionPayment[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to get subscription payment history
 */
export function useSubscriptionPayments(): UseSubscriptionPaymentsReturn {
  const { tenant } = useTenant();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!tenant?.id) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const { getSubscriptionPaymentsAction } = await import(
          '@/app/actions/subscriptions'
        );

        const result = await getSubscriptionPaymentsAction();

        if (result.success && result.data) {
          setPayments(result.data);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch payments'));
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [tenant?.id, refreshKey]);

  return {
    payments,
    loading,
    error,
    refresh,
  };
}
