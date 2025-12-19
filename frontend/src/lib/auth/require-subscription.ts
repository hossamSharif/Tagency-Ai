/**
 * Subscription Guard Middleware
 *
 * T209: Server-side subscription check for protected routes.
 */

import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from './require-role';
import type { Subscription } from '@/types/models/subscription';

interface SubscriptionCheckResult {
  hasAccess: boolean;
  subscription: Subscription | null;
  message?: string;
}

/**
 * Check if tenant has active subscription access
 */
export async function checkSubscriptionAccess(
  tenantId: string
): Promise<SubscriptionCheckResult> {
  try {
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    const subscriptionSnapshot = await subscriptionRef.get();

    if (!subscriptionSnapshot.exists) {
      return {
        hasAccess: false,
        subscription: null,
        message: 'No subscription found',
      };
    }

    const subscription = {
      id: subscriptionSnapshot.id,
      ...subscriptionSnapshot.data(),
    } as Subscription;

    const now = new Date();

    // Check active monthly subscription
    if (subscription.status === 'active' && subscription.plan === 'monthly') {
      // Verify period hasn't expired
      if (subscription.currentPeriodEnd) {
        const periodEnd = subscription.currentPeriodEnd.toDate();
        if (periodEnd > now) {
          return { hasAccess: true, subscription };
        }
      }
      // If no period end, assume active
      return { hasAccess: true, subscription };
    }

    // Check active trial
    if (subscription.status === 'active' && subscription.plan === 'trial') {
      if (subscription.trialEndsAt) {
        const trialEnd = subscription.trialEndsAt.toDate();
        if (trialEnd > now) {
          return { hasAccess: true, subscription };
        }
        return {
          hasAccess: false,
          subscription,
          message: 'Trial has expired',
        };
      }
    }

    // Check past_due - still allow access during grace period
    if (subscription.status === 'past_due') {
      if (subscription.currentPeriodEnd) {
        const periodEnd = subscription.currentPeriodEnd.toDate();
        if (periodEnd > now) {
          return { hasAccess: true, subscription };
        }
      }
      return {
        hasAccess: false,
        subscription,
        message: 'Subscription payment failed',
      };
    }

    // Check cancelled - still has access until period end
    if (subscription.status === 'cancelled') {
      const accessUntil = subscription.accessUntil?.toDate() ||
        subscription.currentPeriodEnd?.toDate();
      if (accessUntil && accessUntil > now) {
        return { hasAccess: true, subscription };
      }
      return {
        hasAccess: false,
        subscription,
        message: 'Subscription has been cancelled',
      };
    }

    // All other statuses (expired, pending_payment) - no access
    return {
      hasAccess: false,
      subscription,
      message: `Subscription status: ${subscription.status}`,
    };
  } catch (err) {
    console.error('Error checking subscription access:', err);
    return {
      hasAccess: false,
      subscription: null,
      message: 'Error checking subscription',
    };
  }
}

/**
 * Require active subscription to access a page
 * Redirects to subscription page if no access
 */
export async function requireSubscription(locale: string): Promise<Subscription> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const { hasAccess, subscription, message } = await checkSubscriptionAccess(user.tenantId);

  if (!hasAccess) {
    // Redirect to subscription page with message
    const subscriptionUrl = `/${locale}/settings/subscription`;
    const errorParam = message ? `?error=${encodeURIComponent(message)}` : '';
    redirect(`${subscriptionUrl}${errorParam}`);
  }

  return subscription!;
}

/**
 * Get subscription status without requiring access
 * Useful for pages that need to display different UI based on status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionCheckResult | null> {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return checkSubscriptionAccess(user.tenantId);
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(): Promise<boolean> {
  const user = await getSessionUser();

  if (!user) {
    return false;
  }

  const { subscription } = await checkSubscriptionAccess(user.tenantId);

  if (!subscription) {
    return false;
  }

  return subscription.plan === 'trial' && subscription.status === 'active';
}

/**
 * Get trial days remaining
 */
export async function getTrialDaysRemaining(): Promise<number> {
  const user = await getSessionUser();

  if (!user) {
    return 0;
  }

  const { subscription } = await checkSubscriptionAccess(user.tenantId);

  if (!subscription || subscription.plan !== 'trial' || !subscription.trialEndsAt) {
    return 0;
  }

  const now = new Date();
  const trialEnd = subscription.trialEndsAt.toDate();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
