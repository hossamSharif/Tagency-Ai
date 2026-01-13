'use server';

// Service Catalog server actions
// T017 [P] [US2] Service catalog CRUD actions

import { revalidatePath } from 'next/cache';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { ActionResult } from '@/lib/actions/types';
import {
  serviceCatalogItemSchema,
  updateServiceCatalogItemSchema,
  quickAddServiceSchema,
  ServiceCatalogItemInput,
  UpdateServiceCatalogItemInput,
  QuickAddServiceInput,
} from '@/lib/validations/services-catalog';
import { ServiceCatalogItem } from '@/types/models/service-catalog';

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
 * Serialize Firestore Timestamps to ISO strings for client components
 */
function serializeServiceCatalogItem(service: Record<string, unknown>): ServiceCatalogItem {
  const serializeTimestamp = (ts: unknown): unknown => {
    if (!ts) return undefined;
    if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().toISOString();
    }
    return ts;
  };

  return {
    ...service,
    createdAt: serializeTimestamp(service.createdAt),
    updatedAt: serializeTimestamp(service.updatedAt),
  } as unknown as ServiceCatalogItem;
}

/**
 * Create a new service catalog item
 */
export async function createServiceCatalogItem(
  input: ServiceCatalogItemInput
): Promise<ActionResult<ServiceCatalogItem>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = serviceCatalogItemSchema.parse(input);

    // Create service document
    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc();
    const now = Timestamp.now();

    const service = {
      id: serviceRef.id,
      ...validatedData,
      isActive: true,
      usageCount: 0,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
    } as unknown as ServiceCatalogItem;

    await serviceRef.set(service);

    // Revalidate services pages
    revalidatePath('/[locale]/(dashboard)/services');
    revalidatePath('/[locale]/(dashboard)/invoices/new');

    return {
      success: true,
      data: serializeServiceCatalogItem(service as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error creating service catalog item:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to create service',
    };
  }
}

/**
 * T087 [US10] Quick-add service (simplified fields for invoice form)
 */
export async function quickAddServiceAction(
  input: QuickAddServiceInput
): Promise<ActionResult<ServiceCatalogItem>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = quickAddServiceSchema.parse(input);

    // Get tenant's currency
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    // Create service document
    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc();
    const now = Timestamp.now();

    const service = {
      id: serviceRef.id,
      name: validatedData.name,
      nameAr: validatedData.nameAr,
      description: undefined,
      price: validatedData.price,
      currency,
      type: validatedData.type,
      providerType: validatedData.providerType,
      defaultPartnerId: undefined,
      defaultPartnerName: undefined,
      commissionPercentage: validatedData.commissionPercentage,
      isActive: true,
      usageCount: 0,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
    } as unknown as ServiceCatalogItem;

    await serviceRef.set(service);

    // Revalidate services pages
    revalidatePath('/[locale]/(dashboard)/services');
    revalidatePath('/[locale]/(dashboard)/invoices/new');

    return {
      success: true,
      data: serializeServiceCatalogItem(service as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error quick-adding service:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to create service',
    };
  }
}

/**
 * Get all service catalog items
 */
export async function getServiceCatalogItems(options?: {
  activeOnly?: boolean;
  type?: string;
  providerType?: string;
}): Promise<ActionResult<ServiceCatalogItem[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    let query = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).orderBy('name', 'asc');

    // Apply filters
    if (options?.activeOnly !== false) {
      query = query.where('isActive', '==', true) as any;
    }
    if (options?.type) {
      query = query.where('type', '==', options.type) as any;
    }
    if (options?.providerType) {
      query = query.where('providerType', '==', options.providerType) as any;
    }

    const snapshot = await query.get();
    const services = snapshot.docs.map((doc) => serializeServiceCatalogItem(doc.data()));

    return {
      success: true,
      data: services,
    };
  } catch (error) {
    console.error('Error fetching service catalog items:', error);
    return {
      success: false,
      error: 'Failed to fetch services',
    };
  }
}

/**
 * Get a single service catalog item by ID
 */
export async function getServiceCatalogItem(
  serviceId: string
): Promise<ActionResult<ServiceCatalogItem>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const doc = await adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc(serviceId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Service not found',
      };
    }

    return {
      success: true,
      data: serializeServiceCatalogItem(doc.data()!),
    };
  } catch (error) {
    console.error('Error fetching service catalog item:', error);
    return {
      success: false,
      error: 'Failed to fetch service',
    };
  }
}

/**
 * Update a service catalog item
 */
export async function updateServiceCatalogItem(
  serviceId: string,
  input: UpdateServiceCatalogItemInput
): Promise<ActionResult<ServiceCatalogItem>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = updateServiceCatalogItemSchema.parse(input);

    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc(serviceId);
    const doc = await serviceRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Service not found',
      };
    }

    const now = Timestamp.now();
    const updatedService = {
      ...validatedData,
      updatedAt: now,
    };

    await serviceRef.update(updatedService);

    // Revalidate services pages
    revalidatePath('/[locale]/(dashboard)/services');
    revalidatePath(`/[locale]/(dashboard)/services/${serviceId}`);
    revalidatePath('/[locale]/(dashboard)/invoices/new');

    // Fetch and return updated service
    const updatedDoc = await serviceRef.get();
    return {
      success: true,
      data: serializeServiceCatalogItem(updatedDoc.data()!),
    };
  } catch (error) {
    console.error('Error updating service catalog item:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to update service',
    };
  }
}

/**
 * Delete (soft delete) a service catalog item
 * Sets isActive to false instead of deleting
 */
export async function deleteServiceCatalogItem(
  serviceId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc(serviceId);
    const doc = await serviceRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Service not found',
      };
    }

    const service = doc.data();

    // Check if service is in use
    if (service?.usageCount && service.usageCount > 0) {
      return {
        success: false,
        error: 'Cannot delete service that has been used in invoices. You can deactivate it instead.',
      };
    }

    // Soft delete by setting isActive to false
    await serviceRef.update({
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    // Revalidate services pages
    revalidatePath('/[locale]/(dashboard)/services');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting service catalog item:', error);
    return {
      success: false,
      error: 'Failed to delete service',
    };
  }
}

/**
 * Increment usage count when service is added to an invoice
 */
export async function incrementServiceUsage(
  serviceId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc(serviceId);

    await serviceRef.update({
      usageCount: FieldValue.increment(1),
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error incrementing service usage:', error);
    return {
      success: false,
      error: 'Failed to update service usage',
    };
  }
}

/**
 * Quick add service (minimal fields for invoice form)
 * US10 - Quick-add entities from invoice page
 */
export async function quickAddService(
  input: QuickAddServiceInput
): Promise<ActionResult<ServiceCatalogItem>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = quickAddServiceSchema.parse(input);

    // Get tenant currency from settings
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const currency = tenantData?.settings?.currency || 'USD';

    // Create service with defaults
    const serviceRef = adminDb.collection(`tenants/${tenantId}/serviceCatalog`).doc();
    const now = Timestamp.now();

    const service = {
      id: serviceRef.id,
      ...validatedData,
      currency,
      isActive: true,
      usageCount: 0,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
    } as unknown as ServiceCatalogItem;

    await serviceRef.set(service);

    // Revalidate services pages
    revalidatePath('/[locale]/(dashboard)/services');
    revalidatePath('/[locale]/(dashboard)/invoices/new');

    return {
      success: true,
      data: serializeServiceCatalogItem(service as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error quick adding service:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to create service',
    };
  }
}
