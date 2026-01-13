'use server';

/**
 * Package Server Actions
 *
 * Server actions for package and service management.
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
  createPackageSchema,
  updatePackageSchema,
  updatePackageStatusSchema,
  duplicatePackageSchema,
  addServiceSchema,
  updateServiceSchema,
  reorderServicesSchema,
  type CreatePackageInput,
  type UpdatePackageInput,
  type UpdatePackageStatusInput,
  type DuplicatePackageInput,
  type AddServiceInput,
  type UpdateServiceInput,
  type ReorderServicesInput,
} from '@/lib/validations/packages';
import {
  isValidStatusTransition,
  calculateDuration,
  type PackageStatus,
} from '@/types/models/package';
import { createAuditLog } from '@/lib/audit/create-log';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Generate a URL-friendly slug from a package name
 */
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // Keep Arabic characters
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50) +
    '-' +
    Date.now().toString(36)
  );
}

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
 * Check if user can manage packages
 */
function canManagePackages(role: string): boolean {
  return ['owner', 'admin', 'staff'].includes(role);
}

/**
 * Calculate total price from services
 */
async function calculateTotalPrice(
  tenantId: string,
  packageId: string,
  basePrice: number
): Promise<number> {
  const servicesSnapshot = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('packages')
    .doc(packageId)
    .collection('services')
    .get();

  const servicesTotal = servicesSnapshot.docs.reduce((total, doc) => {
    return total + (doc.data().price || 0);
  }, 0);

  return basePrice + servicesTotal;
}

// ==========================================
// Package Actions
// ==========================================

export interface CreatePackageResult {
  packageId: string;
  slug: string;
}

/**
 * Create a new package
 */
export async function createPackageAction(
  input: CreatePackageInput
): Promise<ActionResult<CreatePackageResult>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to create packages', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = createPackageSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const slug = generateSlug(data.name);
    const now = Timestamp.now();

    // Calculate duration
    const duration = calculateDuration(data.startDate, data.endDate);

    // Get tenant's currency
    const tenantDoc = await adminDb.collection('tenants').doc(user.tenantId).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    const packageData = {
      name: data.name,
      slug,
      type: data.type,
      description: data.description || '',
      highlights: data.highlights || [],
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      duration,
      basePrice: data.basePrice || 0,
      totalPrice: data.basePrice || 0, // Initially equals base price
      currency,
      coverImage: data.coverImage || null,
      requiredDocuments: data.requiredDocuments,
      status: 'draft' as PackageStatus,
      maxCapacity: data.maxCapacity || null,
      currentBookings: 0,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const packageRef = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .add(packageData);

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: 'system',
        userRole: 'admin',
        action: 'create',
        entityType: 'package',
        entityId: packageRef.id,
        description: JSON.stringify({ name: data.name, type: data.type }),
        timestamp: FieldValue.serverTimestamp(),
      });

    return success(
      { packageId: packageRef.id, slug },
      'Package created successfully'
    );
  } catch (err) {
    console.error('Create package error:', err);
    return error('Failed to create package', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update an existing package
 */
export async function updatePackageAction(
  packageId: string,
  input: UpdatePackageInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to update packages', ErrorCodes.UNAUTHORIZED);
    }

    // Validate input
    const validation = updatePackageSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    // Check if package exists
    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const currentData = packageDoc.data()!;
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

    // Build update object
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.highlights !== undefined) updateData.highlights = data.highlights;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
    if (data.requiredDocuments !== undefined)
      updateData.requiredDocuments = data.requiredDocuments;

    // Handle date changes
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const startDate = data.startDate
        ? Timestamp.fromDate(data.startDate)
        : currentData.startDate;
      const endDate = data.endDate
        ? Timestamp.fromDate(data.endDate)
        : currentData.endDate;

      updateData.startDate = startDate;
      updateData.endDate = endDate;
      updateData.duration = calculateDuration(
        startDate.toDate(),
        endDate.toDate()
      );
    }

    // Handle base price change - recalculate total
    if (data.basePrice !== undefined) {
      updateData.basePrice = data.basePrice;
      updateData.totalPrice = await calculateTotalPrice(
        user.tenantId,
        packageId,
        data.basePrice
      );
    }

    await packageRef.update(updateData);

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'package',
      resourceId: packageId,
      details: { changes: Object.keys(updateData) },
    });

    return success(undefined, 'Package updated successfully');
  } catch (err) {
    console.error('Update package error:', err);
    return error('Failed to update package', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update package status
 */
export async function updatePackageStatusAction(
  input: UpdatePackageStatusInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to update package status', ErrorCodes.UNAUTHORIZED);
    }

    const validation = updatePackageStatusSchema.safeParse(input);
    if (!validation.success) {
      return error('Invalid status', ErrorCodes.VALIDATION_ERROR);
    }

    const { packageId, status: newStatus } = validation.data;

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const currentStatus = packageDoc.data()!.status as PackageStatus;

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return error(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
        ErrorCodes.INVALID_INPUT
      );
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: Timestamp.now(),
    };

    // Set publishedAt when activating
    if (newStatus === 'active' && currentStatus === 'draft') {
      updateData.publishedAt = Timestamp.now();
    }

    await packageRef.update(updateData);

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: 'system',
        userRole: 'admin',
        action: 'status_change',
        entityType: 'package',
        entityId: packageId,
        description: JSON.stringify({ from: currentStatus, to: newStatus }),
        timestamp: FieldValue.serverTimestamp(),
      });

    return success(undefined, 'Package status updated');
  } catch (err) {
    console.error('Update package status error:', err);
    return error('Failed to update package status', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Delete a package
 */
export async function deletePackageAction(
  packageId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!['owner', 'admin'].includes(user.role)) {
      return error('You do not have permission to delete packages', ErrorCodes.UNAUTHORIZED);
    }

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const packageData = packageDoc.data()!;

    // Check if package has bookings
    if (packageData.currentBookings > 0) {
      return error('Cannot delete package with existing bookings', ErrorCodes.CONFLICT);
    }

    // Delete all services first
    const servicesSnapshot = await packageRef.collection('services').get();
    const batch = adminDb.batch();
    servicesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(packageRef);
    await batch.commit();

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: 'system',
        userRole: 'admin',
        action: 'delete',
        entityType: 'package',
        entityId: packageId,
        description: JSON.stringify({ name: packageData.name }),
        timestamp: FieldValue.serverTimestamp(),
      });

    return success(undefined, 'Package deleted successfully');
  } catch (err) {
    console.error('Delete package error:', err);
    return error('Failed to delete package', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Duplicate a package
 */
export async function duplicatePackageAction(
  input: DuplicatePackageInput
): Promise<ActionResult<CreatePackageResult>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to duplicate packages', ErrorCodes.UNAUTHORIZED);
    }

    const validation = duplicatePackageSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR);
    }

    const { packageId, name: newName } = validation.data;

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const originalData = packageDoc.data()!;
    const name = newName || `${originalData.name} (Copy)`;
    const slug = generateSlug(name);
    const now = Timestamp.now();

    // Create new package
    const newPackageData = {
      ...originalData,
      name,
      slug,
      status: 'draft',
      currentBookings: 0,
      publishedAt: null,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const newPackageRef = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .add(newPackageData);

    // Copy services
    const servicesSnapshot = await packageRef.collection('services').get();
    const batch = adminDb.batch();

    servicesSnapshot.docs.forEach((serviceDoc) => {
      const serviceData = serviceDoc.data();
      const newServiceRef = newPackageRef.collection('services').doc();
      batch.set(newServiceRef, {
        ...serviceData,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: 'system',
        userRole: 'admin',
        action: 'create',
        entityType: 'package',
        entityId: newPackageRef.id,
        description: JSON.stringify({ originalId: packageId, name, duplicated: true }),
        timestamp: FieldValue.serverTimestamp(),
      });

    return success(
      { packageId: newPackageRef.id, slug },
      'Package duplicated successfully'
    );
  } catch (err) {
    console.error('Duplicate package error:', err);
    return error('Failed to duplicate package', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Service Actions
// ==========================================

export interface AddServiceResult {
  serviceId: string;
  newTotalPrice: number;
}

/**
 * Add a service to a package
 */
export async function addServiceAction(
  packageId: string,
  input: AddServiceInput
): Promise<ActionResult<AddServiceResult>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to add services', ErrorCodes.UNAUTHORIZED);
    }

    const validation = addServiceSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const packageData = packageDoc.data()!;
    const now = Timestamp.now();

    // Get partner name if outsourced
    let partnerOfficeName: string | null = null;
    if (data.isOutsourced && data.partnerOfficeId) {
      const partnerDoc = await adminDb
        .collection('tenants')
        .doc(user.tenantId)
        .collection('partnerOffices')
        .doc(data.partnerOfficeId)
        .get();
      partnerOfficeName = partnerDoc.exists ? partnerDoc.data()!.name : null;
    }

    // Get current max display order
    const servicesSnapshot = await packageRef
      .collection('services')
      .orderBy('displayOrder', 'desc')
      .limit(1)
      .get();

    const maxOrder = servicesSnapshot.empty
      ? 0
      : servicesSnapshot.docs[0].data().displayOrder;

    const serviceData = {
      name: data.name,
      category: data.category,
      description: data.description || '',
      price: data.price,
      currency: packageData.currency,
      serviceDate: data.serviceDate ? Timestamp.fromDate(data.serviceDate) : null,
      duration: data.duration || null,
      provider: data.provider || null,
      isOutsourced: data.isOutsourced,
      partnerOfficeId: data.partnerOfficeId || null,
      partnerOfficeName,
      commissionPercentage: data.commissionPercentage || null,
      displayOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    const serviceRef = await packageRef.collection('services').add(serviceData);

    // Recalculate total price
    const newTotalPrice = await calculateTotalPrice(
      user.tenantId,
      packageId,
      packageData.basePrice
    );

    await packageRef.update({
      totalPrice: newTotalPrice,
      updatedAt: now,
    });

    return success(
      { serviceId: serviceRef.id, newTotalPrice },
      'Service added successfully'
    );
  } catch (err) {
    console.error('Add service error:', err);
    return error('Failed to add service', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update a service
 */
export async function updateServiceAction(
  packageId: string,
  serviceId: string,
  input: UpdateServiceInput
): Promise<ActionResult<{ newTotalPrice: number }>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to update services', ErrorCodes.UNAUTHORIZED);
    }

    const validation = updateServiceSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const serviceRef = packageRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return error('Service not found', ErrorCodes.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.serviceDate !== undefined) {
      updateData.serviceDate = data.serviceDate
        ? Timestamp.fromDate(data.serviceDate)
        : null;
    }
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.isOutsourced !== undefined) updateData.isOutsourced = data.isOutsourced;
    if (data.partnerOfficeId !== undefined) {
      updateData.partnerOfficeId = data.partnerOfficeId;
      // Update partner name if changed
      if (data.partnerOfficeId) {
        const partnerDoc = await adminDb
          .collection('tenants')
          .doc(user.tenantId)
          .collection('partnerOffices')
          .doc(data.partnerOfficeId)
          .get();
        updateData.partnerOfficeName = partnerDoc.exists
          ? partnerDoc.data()!.name
          : null;
      } else {
        updateData.partnerOfficeName = null;
      }
    }
    if (data.commissionPercentage !== undefined) {
      updateData.commissionPercentage = data.commissionPercentage;
    }

    await serviceRef.update(updateData);

    // Recalculate total price
    const packageData = packageDoc.data()!;
    const newTotalPrice = await calculateTotalPrice(
      user.tenantId,
      packageId,
      packageData.basePrice
    );

    await packageRef.update({
      totalPrice: newTotalPrice,
      updatedAt: Timestamp.now(),
    });

    return success({ newTotalPrice }, 'Service updated successfully');
  } catch (err) {
    console.error('Update service error:', err);
    return error('Failed to update service', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Delete a service
 */
export async function deleteServiceAction(
  packageId: string,
  serviceId: string
): Promise<ActionResult<{ newTotalPrice: number }>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to delete services', ErrorCodes.UNAUTHORIZED);
    }

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const serviceRef = packageRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return error('Service not found', ErrorCodes.NOT_FOUND);
    }

    await serviceRef.delete();

    // Recalculate total price
    const packageData = packageDoc.data()!;
    const newTotalPrice = await calculateTotalPrice(
      user.tenantId,
      packageId,
      packageData.basePrice
    );

    await packageRef.update({
      totalPrice: newTotalPrice,
      updatedAt: Timestamp.now(),
    });

    return success({ newTotalPrice }, 'Service deleted successfully');
  } catch (err) {
    console.error('Delete service error:', err);
    return error('Failed to delete service', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Reorder services
 */
export async function reorderServicesAction(
  input: ReorderServicesInput
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();

    if (!canManagePackages(user.role)) {
      return error('You do not have permission to reorder services', ErrorCodes.UNAUTHORIZED);
    }

    const validation = reorderServicesSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR);
    }

    const { packageId, serviceIds } = validation.data;

    const packageRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages')
      .doc(packageId);

    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return error('Package not found', ErrorCodes.NOT_FOUND);
    }

    const batch = adminDb.batch();
    const now = Timestamp.now();

    serviceIds.forEach((serviceId, index) => {
      const serviceRef = packageRef.collection('services').doc(serviceId);
      batch.update(serviceRef, {
        displayOrder: index + 1,
        updatedAt: now,
      });
    });

    batch.update(packageRef, { updatedAt: now });

    await batch.commit();

    return success(undefined, 'Services reordered successfully');
  } catch (err) {
    console.error('Reorder services error:', err);
    return error('Failed to reorder services', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// List Actions (for populating dropdowns)
// ==========================================

/**
 * Serialize Firestore Timestamps to ISO strings for client components
 */
function serializePackage(pkg: Record<string, unknown>): Record<string, unknown> {
  const serializeTimestamp = (ts: unknown): string | null => {
    if (!ts) return null;
    if (ts instanceof Timestamp) {
      return ts.toDate().toISOString();
    }
    if (typeof ts === 'string') {
      return ts;
    }
    return null;
  };

  return {
    ...pkg,
    startDate: serializeTimestamp(pkg.startDate),
    endDate: serializeTimestamp(pkg.endDate),
    createdAt: serializeTimestamp(pkg.createdAt),
    updatedAt: serializeTimestamp(pkg.updatedAt),
    publishedAt: serializeTimestamp(pkg.publishedAt),
  };
}

/**
 * List packages for dropdown/selection
 */
export async function listPackagesAction(options?: {
  status?: PackageStatus;
  type?: string;
  limit?: number;
}): Promise<ActionResult<Record<string, unknown>[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const { status, type, limit: limitCount = 100 } = options || {};

    // Query without orderBy to avoid requiring composite index
    // We'll sort in memory after filtering
    const queryRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages');

    const snapshot = await queryRef.get();

    // Filter and sort in memory
    let packages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Record<string, unknown>[];

    // Apply status filter
    if (status) {
      packages = packages.filter((pkg) => pkg.status === status);
    }

    // Apply type filter
    if (type) {
      packages = packages.filter((pkg) => pkg.type === type);
    }

    // Sort by createdAt descending
    packages.sort((a, b) => {
      const aCreatedAt = a.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
      const bCreatedAt = b.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
      const aTime = aCreatedAt?.toMillis?.() || (aCreatedAt?.seconds ?? 0) * 1000 || 0;
      const bTime = bCreatedAt?.toMillis?.() || (bCreatedAt?.seconds ?? 0) * 1000 || 0;
      return bTime - aTime;
    });

    // Apply limit
    packages = packages.slice(0, limitCount);

    console.log('listPackagesAction: Found', packages.length, 'packages with status:', status);

    return success(
      packages.map(serializePackage),
      'Packages retrieved successfully'
    );
  } catch (err) {
    console.error('List packages error:', err);
    return error('Failed to list packages', ErrorCodes.INTERNAL_ERROR);
  }
}
