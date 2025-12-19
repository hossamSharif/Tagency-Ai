'use server';

/**
 * Settlement Server Actions
 *
 * Server actions for commission settlement management.
 * Uses Firebase Admin SDK for server-side operations.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import {
  createSettlementSchema,
  approveSettlementSchema,
  markSettlementPaidSchema,
  disputeSettlementSchema,
  resolveDisputeSchema,
  type CreateSettlementInput,
  type ApproveSettlementInput,
  type MarkSettlementPaidInput,
  type DisputeSettlementInput,
  type ResolveDisputeInput,
} from '@/lib/validations/settlements';
import { createAuditLog } from '@/lib/audit/create-log';
import type { CommissionSettlement } from '@/types/models/partner-office';

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
 * Check if user can manage settlements
 */
function canManageSettlements(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}

/**
 * Generate settlement number
 */
async function generateSettlementNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SET-${year}-`;

  // Get the last settlement number for this year
  const lastSettlement = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('settlements')
    .where('settlementNumber', '>=', prefix)
    .where('settlementNumber', '<', `${prefix}Z`)
    .orderBy('settlementNumber', 'desc')
    .limit(1)
    .get();

  let sequence = 1;
  if (!lastSettlement.empty) {
    const lastNumber = lastSettlement.docs[0].data().settlementNumber as string;
    const lastSequence = parseInt(lastNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

/**
 * Check if status transition is valid
 */
function isValidSettlementStatusTransition(
  current: CommissionSettlement['status'],
  next: CommissionSettlement['status']
): boolean {
  const validTransitions: Record<CommissionSettlement['status'], CommissionSettlement['status'][]> = {
    pending: ['approved', 'disputed'],
    approved: ['paid', 'disputed'],
    paid: [],
    disputed: ['pending', 'approved'],
  };
  return validTransitions[current]?.includes(next) ?? false;
}

// ==========================================
// Settlement Actions
// ==========================================

export interface CreateSettlementResult {
  settlementId: string;
  settlementNumber: string;
  totalAmount: number;
}

/**
 * Create a new commission settlement
 */
export async function createSettlementAction(
  input: CreateSettlementInput
): Promise<ActionResult<CreateSettlementResult>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManageSettlements(user.role)) {
      return error('You do not have permission to create settlements', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = createSettlementSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const now = Timestamp.now();

    // Verify partner exists
    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(data.partnerOfficeId);

    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const partnerData = partnerDoc.data()!;

    // Calculate total commission from invoices
    let totalAmount = 0;
    const bookingIds: string[] = [];

    for (const invoiceId of data.invoiceIds) {
      const invoiceDoc = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('invoices')
        .doc(invoiceId)
        .get();

      if (!invoiceDoc.exists) {
        return error(`Invoice ${invoiceId} not found`, ErrorCodes.NOT_FOUND);
      }

      const invoiceData = invoiceDoc.data()!;

      // Find commission for this partner in this invoice
      const partnerCommission = invoiceData.commissionsByPartner?.find(
        (c: { partnerOfficeId: string }) => c.partnerOfficeId === data.partnerOfficeId
      );

      if (!partnerCommission) {
        return error(`Invoice ${invoiceId} has no commission for this partner`, ErrorCodes.INVALID_INPUT);
      }

      if (partnerCommission.status === 'settled') {
        return error(`Invoice ${invoiceId} commission already settled`, ErrorCodes.CONFLICT);
      }

      totalAmount += partnerCommission.totalAmount;
      if (invoiceData.bookingId && !bookingIds.includes(invoiceData.bookingId)) {
        bookingIds.push(invoiceData.bookingId);
      }
    }

    if (totalAmount <= 0) {
      return error('No commission amount to settle', ErrorCodes.INVALID_INPUT);
    }

    // Generate settlement number
    const settlementNumber = await generateSettlementNumber(user.tenantId);

    // Use plain object to avoid Timestamp type mismatch between firebase-admin and firebase/firestore
    const settlementData = {
      partnerOfficeId: data.partnerOfficeId,
      partnerOfficeName: partnerData.name,
      invoiceIds: data.invoiceIds,
      bookingIds,
      amount: totalAmount,
      currency: partnerData.currency,
      periodStart: Timestamp.fromDate(data.periodStart),
      periodEnd: Timestamp.fromDate(data.periodEnd),
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional settlement number (using workaround for type)
    const fullSettlementData = {
      ...settlementData,
      settlementNumber,
    };

    const settlementRef = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .add(fullSettlementData);

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'settlement',
      resourceId: settlementRef.id,
      details: {
        settlementNumber,
        partnerOfficeId: data.partnerOfficeId,
        amount: totalAmount,
        invoiceCount: data.invoiceIds.length,
      },
    });

    return success(
      {
        settlementId: settlementRef.id,
        settlementNumber,
        totalAmount,
      },
      'Settlement created successfully'
    );
  } catch (err) {
    console.error('Create settlement error:', err);
    return error('Failed to create settlement', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Approve a settlement
 */
export async function approveSettlementAction(
  input: ApproveSettlementInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManageSettlements(user.role)) {
      return error('You do not have permission to approve settlements', ErrorCodes.UNAUTHORIZED);
    }

    const validation = approveSettlementSchema.safeParse(input);
    if (!validation.success) {
      return error('Invalid input', ErrorCodes.VALIDATION_ERROR);
    }

    const { settlementId } = validation.data;

    const settlementRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .doc(settlementId);

    const settlementDoc = await settlementRef.get();
    if (!settlementDoc.exists) {
      return error('Settlement not found', ErrorCodes.NOT_FOUND);
    }

    const currentStatus = settlementDoc.data()!.status;

    if (!isValidSettlementStatusTransition(currentStatus, 'approved')) {
      return error(
        `Cannot approve settlement with status ${currentStatus}`,
        ErrorCodes.INVALID_INPUT
      );
    }

    await settlementRef.update({
      status: 'approved',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'status_change',
      resource: 'settlement',
      resourceId: settlementId,
      details: { from: currentStatus, to: 'approved' },
    });

    return success(undefined, 'Settlement approved');
  } catch (err) {
    console.error('Approve settlement error:', err);
    return error('Failed to approve settlement', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Mark a settlement as paid
 */
export async function markSettlementPaidAction(
  input: MarkSettlementPaidInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManageSettlements(user.role)) {
      return error('You do not have permission to mark settlements as paid', ErrorCodes.UNAUTHORIZED);
    }

    const validation = markSettlementPaidSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { settlementId, paymentMethod, paymentReference } = validation.data;
    const now = Timestamp.now();

    const settlementRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .doc(settlementId);

    const settlementDoc = await settlementRef.get();
    if (!settlementDoc.exists) {
      return error('Settlement not found', ErrorCodes.NOT_FOUND);
    }

    const settlementData = settlementDoc.data()!;
    const currentStatus = settlementData.status;

    if (!isValidSettlementStatusTransition(currentStatus, 'paid')) {
      return error(
        `Cannot mark settlement as paid with status ${currentStatus}`,
        ErrorCodes.INVALID_INPUT
      );
    }

    // Start a batch for transactional updates
    const batch = adminDb.batch();

    // Update settlement
    batch.update(settlementRef, {
      status: 'paid',
      paymentMethod,
      paymentReference: paymentReference || null,
      paidAt: now,
      updatedAt: now,
    });

    // Update partner's commission totals
    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(settlementData.partnerOfficeId);

    batch.update(partnerRef, {
      totalCommissionsPaid: FieldValue.increment(settlementData.amount),
      pendingCommissions: FieldValue.increment(-settlementData.amount),
      updatedAt: now,
    });

    // Update invoice commission statuses
    for (const invoiceId of settlementData.invoiceIds) {
      const invoiceRef = adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('invoices')
        .doc(invoiceId);

      const invoiceDoc = await invoiceRef.get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data()!;
        const updatedCommissions = invoiceData.commissionsByPartner?.map(
          (c: { partnerOfficeId: string; status: string; settlementId?: string }) => {
            if (c.partnerOfficeId === settlementData.partnerOfficeId) {
              return { ...c, status: 'settled', settlementId };
            }
            return c;
          }
        );
        batch.update(invoiceRef, {
          commissionsByPartner: updatedCommissions,
          updatedAt: now,
        });
      }
    }

    await batch.commit();

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'status_change',
      resource: 'settlement',
      resourceId: settlementId,
      details: {
        from: currentStatus,
        to: 'paid',
        paymentMethod,
        paymentReference,
        amount: settlementData.amount,
      },
    });

    return success(undefined, 'Settlement marked as paid');
  } catch (err) {
    console.error('Mark settlement paid error:', err);
    return error('Failed to mark settlement as paid', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Dispute a settlement
 */
export async function disputeSettlementAction(
  input: DisputeSettlementInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    // Partners can dispute their own settlements
    if (!['owner', 'admin', 'partner'].includes(user.role)) {
      return error('You do not have permission to dispute settlements', ErrorCodes.UNAUTHORIZED);
    }

    const validation = disputeSettlementSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { settlementId, reason } = validation.data;
    const now = Timestamp.now();

    const settlementRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .doc(settlementId);

    const settlementDoc = await settlementRef.get();
    if (!settlementDoc.exists) {
      return error('Settlement not found', ErrorCodes.NOT_FOUND);
    }

    const settlementData = settlementDoc.data()!;
    const currentStatus = settlementData.status;

    // Partners can only dispute their own settlements
    if (user.role === 'partner') {
      const userDoc = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.data()?.partnerOfficeId !== settlementData.partnerOfficeId) {
        return error('You can only dispute your own settlements', ErrorCodes.UNAUTHORIZED);
      }
    }

    if (!isValidSettlementStatusTransition(currentStatus, 'disputed')) {
      return error(
        `Cannot dispute settlement with status ${currentStatus}`,
        ErrorCodes.INVALID_INPUT
      );
    }

    await settlementRef.update({
      status: 'disputed',
      disputeReason: reason,
      disputedAt: now,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'status_change',
      resource: 'settlement',
      resourceId: settlementId,
      details: { from: currentStatus, to: 'disputed', reason },
    });

    return success(undefined, 'Settlement disputed');
  } catch (err) {
    console.error('Dispute settlement error:', err);
    return error('Failed to dispute settlement', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Resolve a settlement dispute
 */
export async function resolveDisputeAction(
  input: ResolveDisputeInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManageSettlements(user.role)) {
      return error('You do not have permission to resolve disputes', ErrorCodes.UNAUTHORIZED);
    }

    const validation = resolveDisputeSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { settlementId, resolution, adjustedAmount } = validation.data;
    const now = Timestamp.now();

    const settlementRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .doc(settlementId);

    const settlementDoc = await settlementRef.get();
    if (!settlementDoc.exists) {
      return error('Settlement not found', ErrorCodes.NOT_FOUND);
    }

    const settlementData = settlementDoc.data()!;

    if (settlementData.status !== 'disputed') {
      return error('Settlement is not in disputed status', ErrorCodes.INVALID_INPUT);
    }

    const updateData: Record<string, unknown> = {
      status: 'pending', // Goes back to pending for re-approval
      disputeResolution: resolution,
      disputeResolvedAt: now,
      disputeResolvedBy: user.uid,
      updatedAt: now,
    };

    // If amount was adjusted, update it
    if (adjustedAmount !== undefined && adjustedAmount !== settlementData.amount) {
      const difference = adjustedAmount - settlementData.amount;
      updateData.amount = adjustedAmount;
      updateData.amountAdjustment = difference;
      updateData.originalAmount = settlementData.amount;

      // Update partner pending commissions to reflect adjustment
      await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('partnerOffices')
        .doc(settlementData.partnerOfficeId)
        .update({
          pendingCommissions: FieldValue.increment(difference),
          updatedAt: now,
        });
    }

    await settlementRef.update(updateData);

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'settlement',
      resourceId: settlementId,
      details: {
        action: 'dispute_resolved',
        resolution,
        adjustedAmount,
        originalAmount: settlementData.amount,
      },
    });

    return success(undefined, 'Dispute resolved');
  } catch (err) {
    console.error('Resolve dispute error:', err);
    return error('Failed to resolve dispute', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Get settlement details
 */
export async function getSettlementAction(
  settlementId: string
): Promise<ActionResult<CommissionSettlement & { settlementNumber: string }>> {
  try {
    const user = await requireAuthenticatedUser();

    const settlementDoc = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .doc(settlementId)
      .get();

    if (!settlementDoc.exists) {
      return error('Settlement not found', ErrorCodes.NOT_FOUND);
    }

    const settlementData = settlementDoc.data()!;

    // Partners can only view their own settlements
    if (user.role === 'partner') {
      const userDoc = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.data()?.partnerOfficeId !== settlementData.partnerOfficeId) {
        return error('You can only view your own settlements', ErrorCodes.UNAUTHORIZED);
      }
    } else if (!['owner', 'admin', 'staff'].includes(user.role)) {
      return error('You do not have permission to view settlements', ErrorCodes.UNAUTHORIZED);
    }

    return success({
      id: settlementDoc.id,
      ...settlementData,
    } as CommissionSettlement & { settlementNumber: string });
  } catch (err) {
    console.error('Get settlement error:', err);
    return error('Failed to get settlement', ErrorCodes.INTERNAL_ERROR);
  }
}
