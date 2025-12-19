'use server';

/**
 * Platform Admin Subscription Actions
 *
 * Server actions for platform-wide subscription management.
 * These actions require platformAdmin role.
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
  approveSubscriptionPaymentSchema,
  rejectSubscriptionPaymentSchema,
  extendTrialSchema,
  suspendTenantSchema,
  listSubscriptionsFilterSchema,
  type ApproveSubscriptionPaymentInput,
  type RejectSubscriptionPaymentInput,
  type ExtendTrialInput,
  type SuspendTenantInput,
  type ListSubscriptionsFilterInput,
} from '@/lib/validations/subscriptions';
import type {
  Subscription,
  SubscriptionWithTenant,
  SubscriptionPayment,
  SubscriptionPaymentWithTenant,
} from '@/types/models/subscription';
import { PRICING } from '@/lib/stripe/config';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Require platform admin authentication
 */
async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthenticated');
  }

  // Check for platform admin role (could be stored in custom claims or a separate collection)
  const adminRef = adminDb.collection('platformAdmins').doc(user.uid);
  const adminSnapshot = await adminRef.get();

  if (!adminSnapshot.exists) {
    throw new Error('Unauthorized - Platform admin required');
  }

  return user;
}

/**
 * Get subscription with tenant info
 */
async function getSubscriptionWithTenant(tenantId: string): Promise<SubscriptionWithTenant | null> {
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
  const subscriptionSnapshot = await subscriptionRef.get();

  if (!subscriptionSnapshot.exists) {
    return null;
  }

  const tenantRef = adminDb.collection('tenants').doc(tenantId);
  const tenantSnapshot = await tenantRef.get();

  const tenantData = tenantSnapshot.exists ? tenantSnapshot.data() : {};

  return {
    id: subscriptionSnapshot.id,
    ...subscriptionSnapshot.data(),
    tenantName: tenantData?.name || 'Unknown',
    tenantEmail: tenantData?.email || '',
  } as SubscriptionWithTenant;
}

// ==========================================
// Admin Actions
// ==========================================

/**
 * List all subscriptions with filters
 */
export async function listAllSubscriptionsAction(
  input: ListSubscriptionsFilterInput
): Promise<ActionResult<SubscriptionWithTenant[]>> {
  try {
    await requirePlatformAdmin();

    // Validate input
    const validation = listSubscriptionsFilterSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { status, plan, search, limit } = validation.data;

    // Build query
    let query = adminDb.collection('subscriptions').limit(limit || 50);

    if (status) {
      query = query.where('status', '==', status);
    }

    if (plan) {
      query = query.where('plan', '==', plan);
    }

    const subscriptionsSnapshot = await query.get();

    // Fetch tenant info for each subscription
    const subscriptions: SubscriptionWithTenant[] = [];

    for (const doc of subscriptionsSnapshot.docs) {
      const tenantRef = adminDb.collection('tenants').doc(doc.id);
      const tenantSnapshot = await tenantRef.get();
      const tenantData = tenantSnapshot.exists ? tenantSnapshot.data() : {};

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const nameMatch = tenantData?.name?.toLowerCase().includes(searchLower);
        const emailMatch = tenantData?.email?.toLowerCase().includes(searchLower);

        if (!nameMatch && !emailMatch) {
          continue;
        }
      }

      subscriptions.push({
        id: doc.id,
        ...doc.data(),
        tenantName: tenantData?.name || 'Unknown',
        tenantEmail: tenantData?.email || '',
      } as SubscriptionWithTenant);
    }

    return success(subscriptions);
  } catch (err) {
    console.error('listAllSubscriptionsAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to list subscriptions',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Get pending bank transfer payments
 */
export async function getPendingPaymentsAction(): Promise<ActionResult<SubscriptionPaymentWithTenant[]>> {
  try {
    await requirePlatformAdmin();

    // Get all subscriptions with pending bank transfers
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('status', '==', 'pending_payment')
      .get();

    const pendingPayments: SubscriptionPaymentWithTenant[] = [];

    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const tenantId = subscriptionDoc.id;
      const subscriptionData = subscriptionDoc.data();
      const pendingBankTransfer = subscriptionData.pendingBankTransfer;

      if (!pendingBankTransfer?.paymentId) {
        continue;
      }

      // Get the payment document
      const paymentRef = adminDb
        .collection('subscriptions')
        .doc(tenantId)
        .collection('payments')
        .doc(pendingBankTransfer.paymentId);

      const paymentSnapshot = await paymentRef.get();
      if (!paymentSnapshot.exists) {
        continue;
      }

      // Get tenant info
      const tenantRef = adminDb.collection('tenants').doc(tenantId);
      const tenantSnapshot = await tenantRef.get();
      const tenantData = tenantSnapshot.exists ? tenantSnapshot.data() : {};

      pendingPayments.push({
        id: paymentSnapshot.id,
        ...paymentSnapshot.data(),
        tenantName: tenantData?.name || 'Unknown',
        tenantEmail: tenantData?.email || '',
      } as SubscriptionPaymentWithTenant);
    }

    return success(pendingPayments);
  } catch (err) {
    console.error('getPendingPaymentsAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to get pending payments',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T194: Approve subscription payment
 */
export async function approveSubscriptionPaymentAction(
  input: ApproveSubscriptionPaymentInput
): Promise<ActionResult<void>> {
  try {
    const admin = await requirePlatformAdmin();

    // Validate input
    const validation = approveSubscriptionPaymentSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { tenantId, paymentId } = validation.data;
    const now = Timestamp.now();

    // Get the payment
    const paymentRef = adminDb
      .collection('subscriptions')
      .doc(tenantId)
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

    // Calculate subscription period (1 month)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update payment status
    await paymentRef.update({
      status: 'completed',
      'bankTransfer.reviewedBy': admin.uid,
      'bankTransfer.reviewedAt': now,
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      completedAt: now,
    });

    // Update subscription
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    await subscriptionRef.update({
      status: 'active',
      plan: 'monthly',
      pendingBankTransfer: null,
      currentPeriodStart: Timestamp.fromDate(periodStart),
      currentPeriodEnd: Timestamp.fromDate(periodEnd),
      updatedAt: now,
    });

    // Update tenant status
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    await tenantRef.update({
      status: 'active',
      updatedAt: now,
    });

    return success(undefined);
  } catch (err) {
    console.error('approveSubscriptionPaymentAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to approve payment',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T195: Reject subscription payment
 */
export async function rejectSubscriptionPaymentAction(
  input: RejectSubscriptionPaymentInput
): Promise<ActionResult<void>> {
  try {
    const admin = await requirePlatformAdmin();

    // Validate input
    const validation = rejectSubscriptionPaymentSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { tenantId, paymentId, reason } = validation.data;
    const now = Timestamp.now();

    // Get the payment
    const paymentRef = adminDb
      .collection('subscriptions')
      .doc(tenantId)
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

    // Update payment status
    await paymentRef.update({
      status: 'rejected',
      'bankTransfer.reviewedBy': admin.uid,
      'bankTransfer.reviewedAt': now,
      'bankTransfer.rejectionReason': reason,
    });

    // Update subscription - back to trial if still valid, otherwise expired
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    const subscriptionSnapshot = await subscriptionRef.get();
    const subscriptionData = subscriptionSnapshot.data() as Subscription;

    let newStatus: 'active' | 'expired' = 'expired';
    if (subscriptionData.trialEndsAt) {
      const trialEnd = subscriptionData.trialEndsAt.toDate();
      if (trialEnd > new Date()) {
        newStatus = 'active';
      }
    }

    await subscriptionRef.update({
      status: newStatus,
      plan: newStatus === 'active' ? 'trial' : subscriptionData.plan,
      pendingBankTransfer: null,
      updatedAt: now,
    });

    return success(undefined);
  } catch (err) {
    console.error('rejectSubscriptionPaymentAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to reject payment',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T196: Extend trial period
 */
export interface ExtendTrialResult {
  newTrialEndsAt: Date;
}

export async function extendTrialAction(
  input: ExtendTrialInput
): Promise<ActionResult<ExtendTrialResult>> {
  try {
    await requirePlatformAdmin();

    // Validate input
    const validation = extendTrialSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { tenantId, days, reason } = validation.data;
    const now = Timestamp.now();

    // Get subscription
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    const subscriptionSnapshot = await subscriptionRef.get();

    if (!subscriptionSnapshot.exists) {
      return error('Subscription not found', ErrorCodes.NOT_FOUND);
    }

    const subscriptionData = subscriptionSnapshot.data() as Subscription;

    // Calculate new trial end date
    let currentEnd: Date;
    if (subscriptionData.trialEndsAt) {
      currentEnd = subscriptionData.trialEndsAt.toDate();
      // If trial already expired, extend from today
      if (currentEnd < new Date()) {
        currentEnd = new Date();
      }
    } else {
      currentEnd = new Date();
    }

    const newTrialEndsAt = new Date(currentEnd);
    newTrialEndsAt.setDate(newTrialEndsAt.getDate() + days);

    // Update subscription
    await subscriptionRef.update({
      plan: 'trial',
      status: 'active',
      trialEndsAt: Timestamp.fromDate(newTrialEndsAt),
      trialExtensionReason: reason || null,
      updatedAt: now,
    });

    // Update tenant status if needed
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    await tenantRef.update({
      status: 'trial',
      updatedAt: now,
    });

    return success({
      newTrialEndsAt,
    });
  } catch (err) {
    console.error('extendTrialAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to extend trial',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * T197: Suspend tenant access
 */
export async function suspendTenantAction(
  input: SuspendTenantInput
): Promise<ActionResult<void>> {
  try {
    await requirePlatformAdmin();

    // Validate input
    const validation = suspendTenantSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { tenantId, reason } = validation.data;
    const now = Timestamp.now();

    // Update subscription
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    await subscriptionRef.update({
      status: 'expired',
      suspendedAt: now,
      suspensionReason: reason,
      updatedAt: now,
    });

    // Update tenant status
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    await tenantRef.update({
      status: 'suspended',
      suspensionReason: reason,
      updatedAt: now,
    });

    return success(undefined);
  } catch (err) {
    console.error('suspendTenantAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to suspend tenant',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Unsuspend tenant access
 */
export async function unsuspendTenantAction(
  tenantId: string
): Promise<ActionResult<void>> {
  try {
    await requirePlatformAdmin();

    if (!tenantId) {
      return error('Tenant ID is required', ErrorCodes.VALIDATION_ERROR);
    }

    const now = Timestamp.now();

    // Get subscription to determine what status to restore
    const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);
    const subscriptionSnapshot = await subscriptionRef.get();

    if (!subscriptionSnapshot.exists) {
      return error('Subscription not found', ErrorCodes.NOT_FOUND);
    }

    const subscriptionData = subscriptionSnapshot.data() as Subscription;

    // Determine new status based on subscription type
    let newStatus: 'active' | 'expired' = 'expired';
    let tenantStatus: 'active' | 'trial' | 'suspended' = 'suspended';

    if (subscriptionData.plan === 'monthly' && subscriptionData.currentPeriodEnd) {
      const periodEnd = subscriptionData.currentPeriodEnd.toDate();
      if (periodEnd > new Date()) {
        newStatus = 'active';
        tenantStatus = 'active';
      }
    } else if (subscriptionData.plan === 'trial' && subscriptionData.trialEndsAt) {
      const trialEnd = subscriptionData.trialEndsAt.toDate();
      if (trialEnd > new Date()) {
        newStatus = 'active';
        tenantStatus = 'trial';
      }
    }

    // Update subscription
    await subscriptionRef.update({
      status: newStatus,
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: now,
    });

    // Update tenant status
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    await tenantRef.update({
      status: tenantStatus,
      suspensionReason: null,
      updatedAt: now,
    });

    return success(undefined);
  } catch (err) {
    console.error('unsuspendTenantAction error:', err);
    return error(
      err instanceof Error ? err.message : 'Failed to unsuspend tenant',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
