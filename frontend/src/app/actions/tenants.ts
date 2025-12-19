'use server';

/**
 * Tenant Server Actions
 *
 * Server actions for tenant/workspace management.
 * Uses Firebase Admin SDK for server-side operations.
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import type { Tenant, TenantSettings, CurrencyCode, Language, ThemePreference, Address } from '@/types/models/tenant';
import type { User } from '@/types/models/user';
import { z } from 'zod';

// ==========================================
// Validation Schemas
// ==========================================

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  currency: z.enum(['USD', 'SAR', 'EUR', 'SDG', 'AED', 'EGP', 'GBP']).optional(),
  timezone: z.string().optional(),
  language: z.enum(['ar', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get the current authenticated user from the session
 */
async function getCurrentUser(): Promise<{ uid: string; tenantId: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value);
    return {
      uid: decodedToken.uid,
      tenantId: decodedToken.tenantId as string,
      role: decodedToken.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Verify the user has access to the specified tenant
 */
async function verifyTenantAccess(
  currentUser: { uid: string; tenantId: string; role: string },
  requiredTenantId?: string
): Promise<boolean> {
  // If a specific tenant ID is required, verify it matches
  if (requiredTenantId && currentUser.tenantId !== requiredTenantId) {
    return false;
  }
  return true;
}

// ==========================================
// T211: Get Tenant Action
// ==========================================

/**
 * Get the current tenant data
 * Returns the tenant document for the authenticated user's tenant
 */
export async function getTenantAction(): Promise<ActionResult<Tenant>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId } = currentUser;

    // Fetch the tenant document
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();

    if (!tenantDoc.exists) {
      return error('Tenant not found', ErrorCodes.NOT_FOUND);
    }

    const tenantData = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

    return success(tenantData);
  } catch (err) {
    console.error('Get tenant error:', err);
    return error('Failed to fetch tenant data', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// T212: Update Tenant Action
// ==========================================

/**
 * Update tenant settings
 * Requires owner or admin role
 */
export async function updateTenantAction(
  input: UpdateTenantInput
): Promise<ActionResult<Tenant>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission - only owner and admin can update tenant settings
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to update workspace settings', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = updateTenantSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { tenantId } = currentUser;
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

    // Build update object with only provided fields
    const validatedInput = validation.data;
    if (validatedInput.name !== undefined) updateData.name = validatedInput.name;
    if (validatedInput.email !== undefined) updateData.email = validatedInput.email;
    if (validatedInput.phone !== undefined) updateData.phone = validatedInput.phone;
    if (validatedInput.address !== undefined) updateData.address = validatedInput.address;
    if (validatedInput.currency !== undefined) updateData.currency = validatedInput.currency;
    if (validatedInput.timezone !== undefined) updateData.timezone = validatedInput.timezone;
    if (validatedInput.language !== undefined) updateData.language = validatedInput.language;
    if (validatedInput.theme !== undefined) updateData.theme = validatedInput.theme;

    // Update the tenant document
    await adminDb.collection('tenants').doc(tenantId).update(updateData);

    // Fetch and return the updated tenant
    const updatedTenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const updatedTenant = { id: updatedTenantDoc.id, ...updatedTenantDoc.data() } as Tenant;

    return success(updatedTenant, 'Workspace settings updated successfully');
  } catch (err) {
    console.error('Update tenant error:', err);
    return error('Failed to update workspace settings', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// T213: Get Tenant Users Action
// ==========================================

export interface TenantUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface GetTenantUsersResult {
  users: TenantUser[];
  total: number;
}

/**
 * Get all users in the current tenant
 * Requires owner or admin role
 */
export async function getTenantUsersAction(): Promise<ActionResult<GetTenantUsersResult>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission - only owner and admin can view all users
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to view team members', ErrorCodes.UNAUTHORIZED);
    }

    const { tenantId } = currentUser;

    // Fetch all users in the tenant
    const usersSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users: TenantUser[] = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        status: data.status,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return success({
      users,
      total: users.length,
    });
  } catch (err) {
    console.error('Get tenant users error:', err);
    return error('Failed to fetch team members', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Additional Tenant Management Actions
// ==========================================

/**
 * Update user role within the tenant
 * Requires owner role
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: string
): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Only owner can change roles
    if (currentUser.role !== 'owner') {
      return error('Only the owner can change user roles', ErrorCodes.UNAUTHORIZED);
    }

    // Validate role
    const validRoles = ['admin', 'staff', 'customer', 'partner'];
    if (!validRoles.includes(newRole)) {
      return error('Invalid role', ErrorCodes.VALIDATION_ERROR);
    }

    // Cannot change own role
    if (userId === currentUser.uid) {
      return error('You cannot change your own role', ErrorCodes.CONFLICT);
    }

    const { tenantId } = currentUser;

    // Update user role in Firestore
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .update({
        role: newRole,
        updatedAt: Timestamp.now(),
      });

    // Update custom claims
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
      ...existingClaims,
      role: newRole,
    });

    return success(undefined, 'User role updated successfully');
  } catch (err) {
    console.error('Update user role error:', err);
    return error('Failed to update user role', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Remove a user from the tenant
 * Requires owner or admin role
 */
export async function removeUserFromTenantAction(userId: string): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to remove users', ErrorCodes.UNAUTHORIZED);
    }

    // Cannot remove self
    if (userId === currentUser.uid) {
      return error('You cannot remove yourself', ErrorCodes.CONFLICT);
    }

    const { tenantId } = currentUser;

    // Check if the user being removed is the owner
    const userDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return error('User not found', ErrorCodes.NOT_FOUND);
    }

    const userData = userDoc.data();
    if (userData?.role === 'owner') {
      return error('Cannot remove the owner from the workspace', ErrorCodes.CONFLICT);
    }

    // Admin cannot remove another admin
    if (currentUser.role === 'admin' && userData?.role === 'admin') {
      return error('Admins cannot remove other admins', ErrorCodes.UNAUTHORIZED);
    }

    // Delete user document from tenant
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .delete();

    // Clear user's custom claims (remove tenant access)
    await adminAuth.setCustomUserClaims(userId, {
      tenantId: null,
      role: null,
    });

    return success(undefined, 'User removed from workspace successfully');
  } catch (err) {
    console.error('Remove user from tenant error:', err);
    return error('Failed to remove user', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Suspend a user in the tenant
 * Requires owner or admin role
 */
export async function suspendUserAction(userId: string): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to suspend users', ErrorCodes.UNAUTHORIZED);
    }

    // Cannot suspend self
    if (userId === currentUser.uid) {
      return error('You cannot suspend yourself', ErrorCodes.CONFLICT);
    }

    const { tenantId } = currentUser;

    // Check if the user being suspended is the owner
    const userDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return error('User not found', ErrorCodes.NOT_FOUND);
    }

    const userData = userDoc.data();
    if (userData?.role === 'owner') {
      return error('Cannot suspend the owner', ErrorCodes.CONFLICT);
    }

    // Admin cannot suspend another admin
    if (currentUser.role === 'admin' && userData?.role === 'admin') {
      return error('Admins cannot suspend other admins', ErrorCodes.UNAUTHORIZED);
    }

    // Update user status to suspended
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .update({
        status: 'suspended',
        updatedAt: Timestamp.now(),
      });

    // Disable the Firebase Auth user
    await adminAuth.updateUser(userId, { disabled: true });

    return success(undefined, 'User suspended successfully');
  } catch (err) {
    console.error('Suspend user error:', err);
    return error('Failed to suspend user', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Reactivate a suspended user
 * Requires owner or admin role
 */
export async function reactivateUserAction(userId: string): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to reactivate users', ErrorCodes.UNAUTHORIZED);
    }

    const { tenantId } = currentUser;

    // Update user status to active
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .update({
        status: 'active',
        updatedAt: Timestamp.now(),
      });

    // Enable the Firebase Auth user
    await adminAuth.updateUser(userId, { disabled: false });

    return success(undefined, 'User reactivated successfully');
  } catch (err) {
    console.error('Reactivate user error:', err);
    return error('Failed to reactivate user', ErrorCodes.INTERNAL_ERROR);
  }
}
