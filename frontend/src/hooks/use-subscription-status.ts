'use client';

/**
 * Subscription Status Hook
 *
 * T199: Hook for subscription access control.
 * Provides real-time subscription status for UI components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from '@/hooks/use-tenant';
import type { Subscription, SubscriptionStatusCheck } from '@/types/models/subscription';
import {
  getSubscriptionStatusCheck,
  getTrialDaysRemaining,
  isTrialEndingSoon,
} from '@/types/models/subscription';

interface UseSubscriptionStatusReturn {
  /** Whether the tenant has access to the platform */
  hasAccess: boolean;
  /** Whether currently loading subscription data */
  loading: boolean;
  /** Full status check object */
  statusCheck: SubscriptionStatusCheck;
  /** User-facing status message */
  message: string;
  /** Arabic message */
  messageAr: string;
  /** Whether trial is ending soon (less than 3 days) */
  isTrialEndingSoon: boolean;
  /** Days remaining in trial */
  trialDaysRemaining: number;
  /** Whether this is a trial subscription */
  isTrial: boolean;
  /** Whether subscription is past due */
  isPastDue: boolean;
  /** Whether subscription is cancelled */
  isCancelled: boolean;
  /** Whether subscription has expired */
  isExpired: boolean;
  /** Whether payment is pending */
  isPendingPayment: boolean;
  /** Force refresh subscription data */
  refresh: () => void;
}

const DEFAULT_STATUS_CHECK: SubscriptionStatusCheck = {
  hasAccess: false,
  status: 'expired',
  plan: 'trial',
  message: 'Loading...',
};

/**
 * Hook for subscription access control
 * Used throughout the app to check access and show appropriate UI
 */
export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
  const { tenant } = useTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Subscribe to real-time subscription updates
  useEffect(() => {
    if (!tenant?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);

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
        console.error('Subscription status error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, refreshKey]);

  // Calculate derived status values
  const statusCheck = useMemo(
    () => (subscription ? getSubscriptionStatusCheck(subscription) : DEFAULT_STATUS_CHECK),
    [subscription]
  );

  const trialDays = useMemo(
    () => getTrialDaysRemaining(subscription),
    [subscription]
  );

  const trialEndingSoon = useMemo(
    () => isTrialEndingSoon(subscription),
    [subscription]
  );

  // Generate messages
  const { message, messageAr } = useMemo(() => {
    if (loading) {
      return {
        message: 'Loading...',
        messageAr: 'جاري التحميل...',
      };
    }

    if (!subscription) {
      return {
        message: 'No subscription found',
        messageAr: 'لا يوجد اشتراك',
      };
    }

    const { status, plan } = subscription;

    if (plan === 'trial' && trialDays > 0) {
      return {
        message: `Trial: ${trialDays} ${trialDays === 1 ? 'day' : 'days'} remaining`,
        messageAr: `الفترة التجريبية: ${trialDays} ${trialDays === 1 ? 'يوم' : 'أيام'} متبقية`,
      };
    }

    if (plan === 'trial' && trialDays <= 0) {
      return {
        message: 'Trial expired - please subscribe to continue',
        messageAr: 'انتهت الفترة التجريبية - يرجى الاشتراك للمتابعة',
      };
    }

    switch (status) {
      case 'active':
        return {
          message: 'Subscription active',
          messageAr: 'الاشتراك نشط',
        };
      case 'past_due':
        return {
          message: 'Payment past due - please update payment method',
          messageAr: 'الدفع متأخر - يرجى تحديث طريقة الدفع',
        };
      case 'cancelled':
        return {
          message: 'Subscription cancelled',
          messageAr: 'تم إلغاء الاشتراك',
        };
      case 'expired':
        return {
          message: 'Subscription expired - please renew',
          messageAr: 'انتهى الاشتراك - يرجى التجديد',
        };
      case 'pending_payment':
        return {
          message: 'Awaiting payment confirmation',
          messageAr: 'في انتظار تأكيد الدفع',
        };
      default:
        return {
          message: 'Unknown status',
          messageAr: 'حالة غير معروفة',
        };
    }
  }, [loading, subscription, trialDays]);

  return {
    hasAccess: statusCheck.hasAccess,
    loading,
    statusCheck,
    message,
    messageAr,
    isTrialEndingSoon: trialEndingSoon,
    trialDaysRemaining: trialDays,
    isTrial: subscription?.plan === 'trial',
    isPastDue: subscription?.status === 'past_due',
    isCancelled: subscription?.status === 'cancelled',
    isExpired: subscription?.status === 'expired',
    isPendingPayment: subscription?.status === 'pending_payment',
    refresh,
  };
}

/**
 * Simple hook to just check if user has access
 * Lighter weight than full useSubscriptionStatus
 */
export function useHasAccess(): { hasAccess: boolean; loading: boolean } {
  const { hasAccess, loading } = useSubscriptionStatus();
  return { hasAccess, loading };
}
