import { Timestamp } from 'firebase/firestore';

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 'trial' | 'monthly';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending_payment';

/**
 * Pending bank transfer information
 */
export interface PendingBankTransfer {
  /** Reference to the payment document */
  paymentId: string;
  /** When the transfer proof was submitted */
  submittedAt: Timestamp;
}

/**
 * Subscription entity - tracks tenant platform subscription
 * Collection: `subscriptions/{tenantId}` (root level for platform admin access)
 */
export interface Subscription {
  /** Same as tenantId */
  id: string;
  /** Reference to tenant */
  tenantId: string;

  /** Current subscription plan */
  plan: SubscriptionPlan;
  /** Current subscription status */
  status: SubscriptionStatus;

  /** When trial started */
  trialStartedAt?: Timestamp;
  /** When trial ends */
  trialEndsAt?: Timestamp;

  /** Current billing period start */
  currentPeriodStart?: Timestamp;
  /** Current billing period end */
  currentPeriodEnd?: Timestamp;

  /** Stripe customer ID */
  stripeCustomerId?: string;
  /** Stripe subscription ID */
  stripeSubscriptionId?: string;

  /** Pending bank transfer details */
  pendingBankTransfer?: PendingBankTransfer;

  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * Subscription creation input
 */
export type SubscriptionCreateInput = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Subscription update input
 */
export type SubscriptionUpdateInput = Partial<
  Omit<Subscription, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

/**
 * Trial duration in days
 */
export const TRIAL_DURATION_DAYS = 7;

/**
 * Calculate trial end date from start date
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
}

/**
 * Check if subscription is active (can access the platform)
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;

  const { status, trialEndsAt, currentPeriodEnd } = subscription;

  // Active subscription
  if (status === 'active') return true;

  // During trial period
  if (status === 'active' && trialEndsAt) {
    const now = new Date();
    const trialEnd = trialEndsAt.toDate();
    return now < trialEnd;
  }

  return false;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!subscription?.trialEndsAt) return 0;

  const now = new Date();
  const trialEnd = subscription.trialEndsAt.toDate();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if trial is ending soon (less than 3 days)
 */
export function isTrialEndingSoon(subscription: Subscription | null): boolean {
  const daysRemaining = getTrialDaysRemaining(subscription);
  return daysRemaining > 0 && daysRemaining <= 3;
}

/**
 * Subscription status display info
 */
export const SUBSCRIPTION_STATUS_INFO: Record<
  SubscriptionStatus,
  { label: string; labelAr: string; color: string }
> = {
  active: { label: 'Active', labelAr: 'نشط', color: 'green' },
  past_due: { label: 'Past Due', labelAr: 'متأخر', color: 'yellow' },
  cancelled: { label: 'Cancelled', labelAr: 'ملغى', color: 'gray' },
  expired: { label: 'Expired', labelAr: 'منتهي', color: 'red' },
  pending_payment: { label: 'Pending Payment', labelAr: 'في انتظار الدفع', color: 'blue' },
};
