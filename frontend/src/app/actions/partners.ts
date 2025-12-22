'use server';

/**
 * Partner Office Server Actions
 *
 * Server actions for partner office management.
 * Uses Firebase Admin SDK for server-side operations.
 */

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import {
  createPartnerSchema,
  updatePartnerSchema,
  updatePartnerStatusSchema,
  invitePartnerUserSchema,
  type CreatePartnerInput,
  type UpdatePartnerInput,
  type UpdatePartnerStatusInput,
  type InvitePartnerUserInput,
} from '@/lib/validations/partners';
import { createAuditLog } from '@/lib/audit/create-log';
import type { PartnerOfficeStatus } from '@/types/models/partner-office';
import { createPartnerAccount } from '@/lib/accounting/default-accounts';

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
 * Check if user can manage partners
 */
function canManagePartners(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}

/**
 * Check if status transition is valid
 */
function isValidPartnerStatusTransition(
  current: PartnerOfficeStatus,
  next: PartnerOfficeStatus
): boolean {
  const validTransitions: Record<PartnerOfficeStatus, PartnerOfficeStatus[]> = {
    pending: ['active', 'suspended'],
    active: ['suspended'],
    suspended: ['active'],
  };
  return validTransitions[current]?.includes(next) ?? false;
}

// ==========================================
// Partner Actions
// ==========================================

export interface CreatePartnerResult {
  partnerId: string;
}

/**
 * Create a new partner office
 */
export async function createPartnerAction(
  input: CreatePartnerInput
): Promise<ActionResult<CreatePartnerResult>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePartners(user.role)) {
      return error('You do not have permission to create partners', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = createPartnerSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const now = Timestamp.now();

    // Check for duplicate code
    const existingCode = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .where('code', '==', data.code)
      .limit(1)
      .get();

    if (!existingCode.empty) {
      return error('Partner code already exists', ErrorCodes.ALREADY_EXISTS, {
        code: ['A partner with this code already exists'],
      });
    }

    // Check for duplicate email
    const existingEmail = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .where('email', '==', data.email)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
      return error('Partner email already exists', ErrorCodes.ALREADY_EXISTS, {
        email: ['A partner with this email already exists'],
      });
    }

    // Get tenant's currency
    const tenantDoc = await adminDb.collection('tenants').doc(user.tenantId).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    const partnerData = {
      name: data.name,
      code: data.code,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone || null,
      defaultCommissionPercentage: data.defaultCommissionPercentage,
      status: 'pending' as PartnerOfficeStatus,
      bankAccount: data.bankAccount || null,
      notes: data.notes || null,
      totalCommissionsEarned: 0,
      totalCommissionsPaid: 0,
      pendingCommissions: 0,
      currency,
      createdAt: now,
      updatedAt: now,
    };

    const partnerRef = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .add(partnerData);

    // T031 [US6] Create partner account in chart of accounts
    try {
      await createPartnerAccount(
        user.tenantId,
        partnerRef.id,
        data.name
      );
    } catch (accountError) {
      console.error('Error creating partner account:', accountError);
      // Don't fail the partner creation if account creation fails
      // Account can be created manually later if needed
    }

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'partner_office',
      resourceId: partnerRef.id,
      details: { name: data.name, code: data.code },
    });

    return success(
      { partnerId: partnerRef.id },
      'Partner created successfully'
    );
  } catch (err) {
    console.error('Create partner error:', err);
    return error('Failed to create partner', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update an existing partner office
 */
export async function updatePartnerAction(
  partnerId: string,
  input: UpdatePartnerInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePartners(user.role)) {
      return error('You do not have permission to update partners', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = updatePartnerSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(partnerId);

    // Check if partner exists
    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const currentData = partnerDoc.data()!;

    // Check for duplicate code if changing
    if (data.code && data.code !== currentData.code) {
      const existingCode = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('partnerOffices')
        .where('code', '==', data.code)
        .limit(1)
        .get();

      if (!existingCode.empty) {
        return error('Partner code already exists', ErrorCodes.ALREADY_EXISTS, {
          code: ['A partner with this code already exists'],
        });
      }
    }

    // Check for duplicate email if changing
    if (data.email && data.email !== currentData.email) {
      const existingEmail = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('partnerOffices')
        .where('email', '==', data.email)
        .limit(1)
        .get();

      if (!existingEmail.empty) {
        return error('Partner email already exists', ErrorCodes.ALREADY_EXISTS, {
          email: ['A partner with this email already exists'],
        });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

    // Build update object
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.defaultCommissionPercentage !== undefined) {
      updateData.defaultCommissionPercentage = data.defaultCommissionPercentage;
    }
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await partnerRef.update(updateData);

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'partner_office',
      resourceId: partnerId,
      details: { changes: Object.keys(updateData) },
    });

    return success(undefined, 'Partner updated successfully');
  } catch (err) {
    console.error('Update partner error:', err);
    return error('Failed to update partner', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update partner status
 */
export async function updatePartnerStatusAction(
  input: UpdatePartnerStatusInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePartners(user.role)) {
      return error('You do not have permission to update partner status', ErrorCodes.UNAUTHORIZED);
    }

    const validation = updatePartnerStatusSchema.safeParse(input);
    if (!validation.success) {
      return error('Invalid status', ErrorCodes.VALIDATION_ERROR);
    }

    const { partnerId, status: newStatus } = validation.data;

    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(partnerId);

    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const currentStatus = partnerDoc.data()!.status as PartnerOfficeStatus;

    // Validate status transition
    if (!isValidPartnerStatusTransition(currentStatus, newStatus)) {
      return error(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
        ErrorCodes.INVALID_INPUT
      );
    }

    await partnerRef.update({
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'status_change',
      resource: 'partner_office',
      resourceId: partnerId,
      details: { from: currentStatus, to: newStatus },
    });

    return success(undefined, 'Partner status updated');
  } catch (err) {
    console.error('Update partner status error:', err);
    return error('Failed to update partner status', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Invite a user to access partner dashboard
 */
export async function invitePartnerUserAction(
  input: InvitePartnerUserInput
): Promise<ActionResult<{ userId: string }>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePartners(user.role)) {
      return error('You do not have permission to invite partner users', ErrorCodes.UNAUTHORIZED);
    }

    const validation = invitePartnerUserSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { partnerId, email, name } = validation.data;

    // Verify partner exists
    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(partnerId);

    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const partnerData = partnerDoc.data()!;

    if (partnerData.status !== 'active') {
      return error('Cannot invite users for inactive partner', ErrorCodes.INVALID_INPUT);
    }

    // Check if email already exists
    const existingUsers = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      return error('A user with this email already exists', ErrorCodes.ALREADY_EXISTS);
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        displayName: name,
        emailVerified: false,
      });
    } catch (authError: unknown) {
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
      if (errorMessage.includes('already exists')) {
        return error('An account with this email already exists', ErrorCodes.ALREADY_EXISTS);
      }
      throw authError;
    }

    // Set custom claims for the user
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      tenantId: user.tenantId,
      role: 'partner',
      partnerOfficeId: partnerId,
    });

    const now = Timestamp.now();

    // Create user document
    await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('users')
      .doc(firebaseUser.uid)
      .set({
        id: firebaseUser.uid,
        email,
        displayName: name,
        role: 'partner',
        partnerOfficeId: partnerId,
        status: 'pending_verification',
        emailVerified: false,
        language: 'ar',
        theme: 'system',
        emailNotifications: true,
        createdAt: now,
        updatedAt: now,
      });

    // Update partner's userIds
    await partnerRef.update({
      userIds: FieldValue.arrayUnion(firebaseUser.uid),
      updatedAt: now,
    });

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // TODO: Send invitation email with resetLink using Firebase Extension or email service

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'user',
      resourceId: firebaseUser.uid,
      details: { email, partnerOfficeId: partnerId, role: 'partner' },
    });

    return success(
      { userId: firebaseUser.uid },
      'Partner user invited successfully. An invitation email will be sent.'
    );
  } catch (err) {
    console.error('Invite partner user error:', err);
    return error('Failed to invite partner user', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Delete a partner office
 */
export async function deletePartnerAction(
  partnerId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!['owner'].includes(user.role)) {
      return error('Only owners can delete partners', ErrorCodes.UNAUTHORIZED);
    }

    const partnerRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(partnerId);

    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const partnerData = partnerDoc.data()!;

    // Check for pending commissions
    if (partnerData.pendingCommissions > 0) {
      return error(
        'Cannot delete partner with pending commissions',
        ErrorCodes.CONFLICT
      );
    }

    // Check for unsettled invoices
    const unsettledInvoices = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('invoices')
      .where('commissionsByPartner.partnerOfficeId', '==', partnerId)
      .where('commissionsByPartner.status', '==', 'pending')
      .limit(1)
      .get();

    if (!unsettledInvoices.empty) {
      return error(
        'Cannot delete partner with unsettled invoices',
        ErrorCodes.CONFLICT
      );
    }

    // Delete the partner
    await partnerRef.delete();

    // Deactivate partner users
    const partnerUsers = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('users')
      .where('partnerOfficeId', '==', partnerId)
      .get();

    const batch = adminDb.batch();
    partnerUsers.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'suspended', updatedAt: Timestamp.now() });
    });
    await batch.commit();

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'delete',
      resource: 'partner_office',
      resourceId: partnerId,
      details: { name: partnerData.name },
    });

    return success(undefined, 'Partner deleted successfully');
  } catch (err) {
    console.error('Delete partner error:', err);
    return error('Failed to delete partner', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * List all partner offices for the tenant
 */
export async function listPartnersAction(options?: {
  status?: PartnerOfficeStatus;
  search?: string;
  limit?: number;
}): Promise<ActionResult<any[]>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePartners(user.role)) {
      return error('You do not have permission to view partners', ErrorCodes.UNAUTHORIZED);
    }

    const { status: statusFilter, search, limit: limitCount = 100 } = options || {};

    let queryRef = adminDb
      .collection(`tenants/${user.tenantId}/partnerOffices`)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);

    // Add status filter if provided
    if (statusFilter) {
      queryRef = queryRef.where('status', '==', statusFilter) as any;
    }

    const snapshot = await queryRef.get();

    let partners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      partners = partners.filter(
        (partner: any) =>
          partner.name.toLowerCase().includes(searchLower) ||
          partner.code.toLowerCase().includes(searchLower) ||
          partner.email.toLowerCase().includes(searchLower)
      );
    }

    return success(partners);
  } catch (err) {
    console.error('List partners error:', err);
    return error('Failed to list partners', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Get partner summary stats
 */
export async function getPartnerStatsAction(
  partnerId: string
): Promise<ActionResult<{
  totalCommissionsEarned: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  serviceCount: number;
  settlementsCount: number;
}>> {
  try {
    const user = await requireAuthenticatedUser();

    // Partners can view their own stats, admins can view all
    if (user.role === 'partner') {
      // Verify partner access
      const userDoc = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.data()?.partnerOfficeId !== partnerId) {
        return error('You can only view your own partner stats', ErrorCodes.UNAUTHORIZED);
      }
    } else if (!['owner', 'admin'].includes(user.role)) {
      return error('You do not have permission to view partner stats', ErrorCodes.UNAUTHORIZED);
    }

    const partnerDoc = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('partnerOffices')
      .doc(partnerId)
      .get();

    if (!partnerDoc.exists) {
      return error('Partner not found', ErrorCodes.NOT_FOUND);
    }

    const partnerData = partnerDoc.data()!;

    // Count services assigned to this partner (across all packages)
    const packagesSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .get();

    let serviceCount = 0;
    for (const pkg of packagesSnapshot.docs) {
      const services = await pkg.ref
        .collection('services')
        .where('partnerOfficeId', '==', partnerId)
        .get();
      serviceCount += services.size;
    }

    // Count settlements
    const settlementsSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('settlements')
      .where('partnerOfficeId', '==', partnerId)
      .get();

    return success({
      totalCommissionsEarned: partnerData.totalCommissionsEarned || 0,
      totalCommissionsPaid: partnerData.totalCommissionsPaid || 0,
      pendingCommissions: partnerData.pendingCommissions || 0,
      serviceCount,
      settlementsCount: settlementsSnapshot.size,
    });
  } catch (err) {
    console.error('Get partner stats error:', err);
    return error('Failed to get partner stats', ErrorCodes.INTERNAL_ERROR);
  }
}
