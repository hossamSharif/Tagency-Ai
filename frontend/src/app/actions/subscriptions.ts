'use server';

/**
 * Subscription Server Actions
 *
 * Server actions for subscription management.
 * Uses Firebase Admin SDK for server-side operations.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import {
  createCheckoutSchema,
  createBillingPortalSchema,
  uploadPaymentProofSchema,
  cancelSubscriptionSchema,
  type CreateCheckoutInput,
  type CreateBillingPortalInput,
  type UploadPaymentProofInput,
  type CancelSubscriptionInput,
} from '@/lib/validations/subscriptions';
import {
  createCheckoutSession,
  createBillingPortalSession,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  getOrCreateStripeCustomer,
  PRICING,
  BANK_TRANSFER_DETAILS,
} from '@/lib/stripe/config';
import type Stripe from 'stripe';
import type {
  Subscription as LocalSubscription,
  SubscriptionPayment,
  SubscriptionStatusCheck,
} from '@/types/models/subscription';
import { getSubscriptionStatusCheck, getTrialDaysRemaining } from '@/types/models/subscription';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Require authentication and return user with tenant
 */
async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthenticated');
  }
  return user;
}

/**
 * Get subscription for a tenant
 */
async function getSubscriptionDoc(tenantId: string): Promise<LocalSubscription | null> {
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
  const snapshot = await subscriptionRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as LocalSubscription;
}

/**
 * Get tenant info
 */
async function getTenantInfo(tenantId: string): Promise<{ email: string; name: string } | null> {
  const tenantRef = adminDb.collection('tenants').doc(tenantId);
  const snapshot = await tenantRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  return {
    email: data?.email || '',
    name: data?.name || '',
  };
}

// ==========================================
// Subscription Actions
// ==========================================

/**
 * T187: Get current subscription
 */
export async function getSubscriptionAction(): Promise<ActionResult<Subscription | null>> {
  try {
    const user = await requireAuthenticatedUser();

    const subscription = await getSubscriptionDoc(user.tenantId);

    return success(subscription);
  } catch (err) {
    console.error('getSubscriptionAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to get subscription',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Get subscription status check for access control
 */
export async function getSubscriptionStatusAction(): Promise<ActionResult<SubscriptionStatusCheck>> {
  try {
    const user = await requireAuthenticatedUser();

    const subscription = await getSubscriptionDoc(user.tenantId);
    const statusCheck = getSubscriptionStatusCheck(subscription);

    return success(statusCheck);
  } catch (err) {
    console.error('getSubscriptionStatusAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to get subscription status',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T188: Create Stripe checkout session
 */
export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export async function createSubscriptionCheckoutAction(
  input: CreateCheckoutInput
): Promise<ActionResult<CheckoutResult>> {
  try {
    const user = await requireAuthenticatedUser();

    // Only owner can manage subscription
    if (user.role !== 'owner') {
      return error('Only the owner can manage the subscription', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = createCheckoutSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { successUrl, cancelUrl } = validation.data;

    // Get tenant info
    const tenant = await getTenantInfo(user.tenantId);
    if (!tenant) {
      return error('Tenant not found', ErrorCodes.NOT_FOUND);
    }

    // Get existing subscription to check for Stripe customer
    const subscription = await getSubscriptionDoc(user.tenantId);

    // Create or get Stripe customer
    const customer = await getOrCreateStripeCustomer({
      tenantId: user.tenantId,
      email: tenant.email,
      name: tenant.name,
      existingCustomerId: subscription?.stripeCustomerId,
    });

    // Update subscription with customer ID if new
    if (!subscription?.stripeCustomerId) {
      await adminDb.collection('subscriptions').doc(user.tenantId).update({
        stripeCustomerId: customer.id,
        updatedAt: Timestamp.now(),
      });
    }

    // Create checkout session
    const session = await createCheckoutSession({
      tenantId: user.tenantId,
      tenantEmail: tenant.email,
      successUrl,
      cancelUrl,
      customerId: customer.id,
    });

    return success({
      checkoutUrl: session.url!,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('createSubscriptionCheckoutAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to create checkout session',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T189: Create Stripe billing portal session
 */
export interface BillingPortalResult {
  portalUrl: string;
}

export async function createBillingPortalAction(
  input: CreateBillingPortalInput
): Promise<ActionResult<BillingPortalResult>> {
  try {
    const user = await requireAuthenticatedUser();

    // Only owner can access billing portal
    if (user.role !== 'owner') {
      return error('Only the owner can access billing portal', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = createBillingPortalSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { returnUrl } = validation.data;

    // Get subscription to check for Stripe customer
    const subscription = await getSubscriptionDoc(user.tenantId);
    if (!subscription?.stripeCustomerId) {
      return error('No billing account found', ErrorCodes.NOT_FOUND);
    }

    // Create billing portal session
    const session = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl,
    });

    return success({
      portalUrl: session.url,
    });
  } catch (err) {
    console.error('createBillingPortalAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to create billing portal session',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T190: Initiate bank transfer payment
 */
export interface BankTransferResult {
  paymentId: string;
  amount: number;
  currency: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    iban: string;
    swiftCode: string;
    reference: string;
    instructions: string;
  };
}

export async function initiateBankTransferAction(
  locale: 'ar' | 'en' = 'en'
): Promise<ActionResult<BankTransferResult>> {
  try {
    const user = await requireAuthenticatedUser();

    // Only owner can manage subscription
    if (user.role !== 'owner') {
      return error('Only the owner can manage the subscription', ErrorCodes.UNAUTHORIZED);
    }

    // Check if there's already a pending bank transfer
    const subscription = await getSubscriptionDoc(user.tenantId);
    if (subscription?.pendingBankTransfer) {
      return error('There is already a pending bank transfer', ErrorCodes.CONFLICT);
    }

    const now = Timestamp.now();
    const reference = `SUB-${user.tenantId.substring(0, 8).toUpperCase()}`;

    // Create payment record
    const paymentRef = adminDb
      .collection('subscriptions')
      .doc(user.tenantId)
      .collection('payments')
      .doc();

    const paymentData = {
      id: paymentRef.id,
      subscriptionId: user.tenantId,
      tenantId: user.tenantId,
      amount: PRICING.monthlyPriceAmount,
      currency: PRICING.currency,
      method: 'bank_transfer' as const,
      status: 'pending' as const,
      bankTransfer: {
        transactionReference: '',
      },
      createdAt: now,
    };

    await paymentRef.set(paymentData);

    // Update subscription with pending bank transfer
    await adminDb.collection('subscriptions').doc(user.tenantId).update({
      pendingBankTransfer: {
        paymentId: paymentRef.id,
        submittedAt: now,
      },
      status: 'pending_payment',
      updatedAt: now,
    });

    const bankDetails = BANK_TRANSFER_DETAILS[locale];

    return success({
      paymentId: paymentRef.id,
      amount: PRICING.monthlyPriceAmount,
      currency: PRICING.currency,
      bankDetails: {
        ...bankDetails,
        reference,
      },
    });
  } catch (err) {
    console.error('initiateBankTransferAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to initiate bank transfer',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T191: Upload subscription payment proof
 */
export async function uploadSubscriptionPaymentProofAction(
  input: UploadPaymentProofInput,
  proofDocumentUrl: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    // Validate input
    const validation = uploadPaymentProofSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { paymentId, transactionReference, bankName } = validation.data;

    // Verify the payment belongs to this tenant
    const paymentRef = adminDb
      .collection('subscriptions')
      .doc(user.tenantId)
      .collection('payments')
      .doc(paymentId);

    const paymentSnapshot = await paymentRef.get();
    if (!paymentSnapshot.exists) {
      return error('Payment not found', ErrorCodes.NOT_FOUND);
    }

    const paymentData = paymentSnapshot.data() as SubscriptionPayment;
    if (paymentData.status !== 'pending') {
      return error('Payment is not pending', ErrorCodes.CONFLICT);
    }

    // Update payment with proof
    await paymentRef.update({
      'bankTransfer.transactionReference': transactionReference,
      'bankTransfer.bankName': bankName || null,
      'bankTransfer.proofDocumentUrl': proofDocumentUrl,
      updatedAt: Timestamp.now(),
    });

    return success(undefined);
  } catch (err) {
    console.error('uploadSubscriptionPaymentProofAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to upload payment proof',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T192: Cancel subscription
 */
export interface CancelResult {
  cancelledAt: Date;
  accessUntil: Date;
}

export async function cancelSubscriptionAction(
  input: CancelSubscriptionInput
): Promise<ActionResult<CancelResult>> {
  try {
    const user = await requireAuthenticatedUser();

    // Only owner can cancel subscription
    if (user.role !== 'owner') {
      return error('Only the owner can cancel the subscription', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = cancelSubscriptionSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const subscription = await getSubscriptionDoc(user.tenantId);
    if (!subscription) {
      return error('No subscription found', ErrorCodes.NOT_FOUND);
    }

    const now = new Date();
    let accessUntil: Date;

    // If Stripe subscription, cancel via Stripe
    if (subscription.stripeSubscriptionId) {
      const stripeSubscription: Stripe.Subscription = await cancelStripeSubscription(
        subscription.stripeSubscriptionId,
        false // Cancel at period end
      );
      accessUntil = new Date(stripeSubscription.current_period_end * 1000);
    } else {
      // For trial or bank transfer, access ends immediately or at trial end
      accessUntil = subscription.trialEndsAt?.toDate() || now;
    }

    // Update subscription
    await adminDb.collection('subscriptions').doc(user.tenantId).update({
      status: 'cancelled',
      cancelledAt: Timestamp.fromDate(now),
      accessUntil: Timestamp.fromDate(accessUntil),
      cancellationReason: input.reason || null,
      cancellationFeedback: input.feedback || null,
      updatedAt: Timestamp.now(),
    });

    return success({
      cancelledAt: now,
      accessUntil,
    });
  } catch (err) {
    console.error('cancelSubscriptionAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to cancel subscription',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T193: Reactivate cancelled subscription
 */
export async function reactivateSubscriptionAction(): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    // Only owner can reactivate subscription
    if (user.role !== 'owner') {
      return error('Only the owner can reactivate the subscription', ErrorCodes.UNAUTHORIZED);
    }

    const subscription = await getSubscriptionDoc(user.tenantId);
    if (!subscription) {
      return error('No subscription found', ErrorCodes.NOT_FOUND);
    }

    if (subscription.status !== 'cancelled') {
      return error('Subscription is not cancelled', ErrorCodes.CONFLICT);
    }

    // Check if still within access period
    const now = new Date();
    const accessUntil = subscription.accessUntil?.toDate();
    if (accessUntil && accessUntil < now) {
      return error('Subscription has expired - please create a new subscription', ErrorCodes.CONFLICT);
    }

    // If Stripe subscription, reactivate via Stripe
    if (subscription.stripeSubscriptionId) {
      await reactivateStripeSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription
    await adminDb.collection('subscriptions').doc(user.tenantId).update({
      status: 'active',
      cancelledAt: null,
      accessUntil: null,
      cancellationReason: null,
      cancellationFeedback: null,
      updatedAt: Timestamp.now(),
    });

    return success(undefined);
  } catch (err) {
    console.error('reactivateSubscriptionAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to reactivate subscription',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Get subscription payment history
 */
export async function getSubscriptionPaymentsAction(): Promise<ActionResult<SubscriptionPayment[]>> {
  try {
    const user = await requireAuthenticatedUser();

    const paymentsRef = adminDb
      .collection('subscriptions')
      .doc(user.tenantId)
      .collection('payments')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const snapshot = await paymentsRef.get();

    const payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SubscriptionPayment[];

    return success(payments);
  } catch (err) {
    console.error('getSubscriptionPaymentsAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to get subscription payments',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
