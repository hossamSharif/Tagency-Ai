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

  /** When subscription was cancelled */
  cancelledAt?: Timestamp;
  /** When access ends after cancellation */
  accessUntil?: Timestamp;
  /** Reason for cancellation */
  cancellationReason?: string;
  /** User feedback on cancellation */
  cancellationFeedback?: string;

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

/**
 * Subscription payment method
 */
export type SubscriptionPaymentMethod = 'stripe' | 'bank_transfer';

/**
 * Subscription payment status
 */
export type SubscriptionPaymentStatus = 'pending' | 'completed' | 'failed' | 'rejected';

/**
 * Bank transfer details
 */
export interface BankTransferDetails {
  transactionReference: string;
  bankName?: string;
  proofDocumentUrl?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}

/**
 * Subscription payment record
 * Collection: `subscriptions/{tenantId}/payments/{paymentId}`
 */
export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  tenantId: string;

  /** Payment amount */
  amount: number;
  /** Currency code */
  currency: string;

  /** Payment method */
  method: SubscriptionPaymentMethod;
  /** Payment status */
  status: SubscriptionPaymentStatus;

  /** Stripe payment intent ID (for card payments) */
  stripePaymentIntentId?: string;
  /** Stripe invoice ID */
  stripeInvoiceId?: string;

  /** Bank transfer details (for manual payments) */
  bankTransfer?: BankTransferDetails;

  /** Billing period covered */
  periodStart?: Timestamp;
  periodEnd?: Timestamp;

  /** When created */
  createdAt: Timestamp;
  /** When completed/failed */
  completedAt?: Timestamp;
}

/**
 * Subscription status check result for access control
 */
export interface SubscriptionStatusCheck {
  /** Whether tenant has platform access */
  hasAccess: boolean;
  /** Current status */
  status: SubscriptionStatus;
  /** Current plan */
  plan: SubscriptionPlan;
  /** Days remaining in trial (if applicable) */
  trialDaysRemaining?: number;
  /** When access expires */
  expiresAt?: Date;
  /** User-facing message */
  message?: string;
}

/**
 * Subscription with tenant info (for admin views)
 */
export interface SubscriptionWithTenant extends Subscription {
  tenantName: string;
  tenantEmail: string;
}

/**
 * Subscription payment with tenant info (for admin views)
 */
export interface SubscriptionPaymentWithTenant extends SubscriptionPayment {
  tenantName: string;
  tenantEmail: string;
}

/**
 * Subscription payment status display info
 */
export const SUBSCRIPTION_PAYMENT_STATUS_INFO: Record<
  SubscriptionPaymentStatus,
  { label: string; labelAr: string; color: string }
> = {
  pending: { label: 'Pending', labelAr: 'قيد الانتظار', color: 'yellow' },
  completed: { label: 'Completed', labelAr: 'مكتمل', color: 'green' },
  failed: { label: 'Failed', labelAr: 'فشل', color: 'red' },
  rejected: { label: 'Rejected', labelAr: 'مرفوض', color: 'red' },
};

/**
 * Get subscription status check
 */
export function getSubscriptionStatusCheck(subscription: Subscription | null): SubscriptionStatusCheck {
  if (!subscription) {
    return {
      hasAccess: false,
      status: 'expired',
      plan: 'trial',
      message: 'No subscription found',
    };
  }

  const { status, plan, trialEndsAt, currentPeriodEnd } = subscription;
  const trialDaysRemaining = getTrialDaysRemaining(subscription);

  // Active trial
  if (plan === 'trial' && status === 'active' && trialDaysRemaining > 0) {
    return {
      hasAccess: true,
      status,
      plan,
      trialDaysRemaining,
      expiresAt: trialEndsAt?.toDate(),
      message: `Trial: ${trialDaysRemaining} days remaining`,
    };
  }

  // Expired trial
  if (plan === 'trial' && trialDaysRemaining <= 0) {
    return {
      hasAccess: false,
      status: 'expired',
      plan,
      trialDaysRemaining: 0,
      message: 'Trial has expired',
    };
  }

  // Active paid subscription
  if (status === 'active' && plan === 'monthly') {
    return {
      hasAccess: true,
      status,
      plan,
      expiresAt: currentPeriodEnd?.toDate(),
      message: 'Subscription active',
    };
  }

  // Past due - still has access but needs attention
  if (status === 'past_due') {
    return {
      hasAccess: true,
      status,
      plan,
      expiresAt: currentPeriodEnd?.toDate(),
      message: 'Payment past due - please update payment method',
    };
  }

  // Pending payment
  if (status === 'pending_payment') {
    return {
      hasAccess: false,
      status,
      plan,
      message: 'Awaiting payment confirmation',
    };
  }

  // Cancelled or expired
  return {
    hasAccess: false,
    status,
    plan,
    message: status === 'cancelled' ? 'Subscription cancelled' : 'Subscription expired',
  };
}
