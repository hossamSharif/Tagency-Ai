'use server';

// Customer server actions
// T094-T097 [US2] Customer actions

import { revalidatePath } from 'next/cache';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { ActionResult } from '@/lib/actions/types';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updatePassportSchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  UpdatePassportInput,
} from '@/lib/validations/customers';
import { Customer } from '@/types/models/customer';
import { createCustomerAccount } from '@/lib/accounting/default-accounts';

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
 * Note: Using unknown casting due to admin/client SDK Timestamp type differences
 */
function serializeCustomer(customer: Record<string, unknown>): Customer {
  const serializeTimestamp = (ts: unknown): unknown => {
    if (!ts) return undefined;
    if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().toISOString();
    }
    return ts;
  };

  return {
    ...customer,
    createdAt: serializeTimestamp(customer.createdAt),
    updatedAt: serializeTimestamp(customer.updatedAt),
  } as unknown as Customer;
}

/**
 * T094 [US2] Create a new customer
 */
export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = createCustomerSchema.parse(input);

    // Check for duplicate email within tenant
    const existingCustomer = await adminDb
      .collection(`tenants/${tenantId}/customers`)
      .where('email', '==', validatedData.email)
      .limit(1)
      .get();

    if (!existingCustomer.empty) {
      return {
        success: false,
        error: 'A customer with this email already exists',
      };
    }

    // Create customer document
    const customerRef = adminDb.collection(`tenants/${tenantId}/customers`).doc();
    const now = Timestamp.now();

    // Note: Using admin SDK types which are compatible at runtime but differ in TypeScript definitions
    const customer = {
      id: customerRef.id,
      ...validatedData,
      balance: 0,
      documents: [],
      createdAt: now,
      updatedAt: now,
    } as unknown as Customer;

    await customerRef.set(customer);

    // T030 [US6] Create customer account in chart of accounts
    try {
      await createCustomerAccount(
        tenantId,
        customer.id,
        `${customer.firstName} ${customer.lastName}`
      );
    } catch (accountError) {
      console.error('Error creating customer account:', accountError);
      // Don't fail the customer creation if account creation fails
      // Account can be created manually later if needed
    }

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'create',
        entityType: 'customer',
        entityId: customer.id,
        description: `Created customer: ${customer.firstName} ${customer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers`);

    return {
      success: true,
      data: serializeCustomer(customer as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

/**
 * T095 [US2] Update an existing customer
 */
export async function updateCustomerAction(
  customerId: string,
  input: UpdateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = updateCustomerSchema.parse(input);

    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    const existingCustomer = customerDoc.data() as Customer;

    // Check for duplicate email if email is being changed
    if (validatedData.email && validatedData.email !== existingCustomer.email) {
      const duplicateCheck = await adminDb
        .collection(`tenants/${tenantId}/customers`)
        .where('email', '==', validatedData.email)
        .limit(1)
        .get();

      if (!duplicateCheck.empty) {
        return {
          success: false,
          error: 'A customer with this email already exists',
        };
      }
    }

    const updatedCustomer = {
      ...existingCustomer,
      ...validatedData,
      updatedAt: Timestamp.now(),
    };

    await customerRef.update(updatedCustomer);

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'update',
        entityType: 'customer',
        entityId: customerId,
        description: `Updated customer: ${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
        changes: JSON.stringify(Object.keys(validatedData).map((key) => ({
          field: key,
          oldValue: existingCustomer[key as keyof Customer],
          newValue: validatedData[key as keyof UpdateCustomerInput],
        }))),
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers`);
    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: serializeCustomer(updatedCustomer as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error updating customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customer',
    };
  }
}

/**
 * T096 [US2] Update customer passport data
 */
export async function updateCustomerPassportAction(
  customerId: string,
  input: UpdatePassportInput
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = updatePassportSchema.parse(input);

    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    const existingCustomer = customerDoc.data() as Customer;

    const passportData = {
      passportNumber: validatedData.passportNumber.toUpperCase(),
      fullName: validatedData.fullName,
      dateOfBirth: Timestamp.fromDate(new Date(validatedData.dateOfBirth)),
      expiryDate: Timestamp.fromDate(new Date(validatedData.expiryDate)),
      nationality: validatedData.nationality.toUpperCase(),
      gender: validatedData.gender,
      issuingCountry: validatedData.issuingCountry.toUpperCase(),
      manuallyVerified: validatedData.manuallyVerified,
      extractedAt: Timestamp.now(),
    };

    const updatedCustomer = {
      ...existingCustomer,
      passport: passportData,
      updatedAt: Timestamp.now(),
    };

    await customerRef.update({
      passport: passportData,
      updatedAt: Timestamp.now(),
    });

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'update',
        entityType: 'customer',
        entityId: customerId,
        description: `Updated passport for customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: serializeCustomer(updatedCustomer as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error updating customer passport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update passport',
    };
  }
}

/**
 * T097 [US2] Upload customer document
 */
export async function uploadCustomerDocumentAction(
  customerId: string,
  documentType: 'passport' | 'visa' | 'photo' | 'vaccination' | 'other',
  documentName: string,
  documentUrl: string
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    const existingCustomer = customerDoc.data() as Customer;
    const now = Timestamp.now();

    const newDocument = {
      id: `doc_${Date.now()}`,
      type: documentType,
      name: documentName,
      url: documentUrl,
      uploadedAt: now,
    };

    const documents = [...(existingCustomer.documents || []), newDocument];

    await customerRef.update({
      documents,
      updatedAt: now,
    });

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'update',
        entityType: 'customer',
        entityId: customerId,
        description: `Uploaded ${documentType} document for customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: serializeCustomer({
        ...existingCustomer,
        documents,
        updatedAt: now,
      } as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error uploading customer document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    };
  }
}

/**
 * Delete customer document
 */
export async function deleteCustomerDocumentAction(
  customerId: string,
  documentId: string
): Promise<ActionResult<void>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    const existingCustomer = customerDoc.data() as Customer;
    const documents = (existingCustomer.documents || []).filter(
      (doc) => doc.id !== documentId
    );

    await customerRef.update({
      documents,
      updatedAt: Timestamp.now(),
    });

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'delete',
        entityType: 'customer',
        entityId: customerId,
        description: `Deleted document from customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting customer document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document',
    };
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerAction(
  customerId: string
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const customerDoc = await adminDb
      .doc(`tenants/${tenantId}/customers/${customerId}`)
      .get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    return {
      success: true,
      data: serializeCustomer({ id: customerDoc.id, ...customerDoc.data() } as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error getting customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get customer',
    };
  }
}

/**
 * List customers for tenant
 */
export async function listCustomersAction(options?: {
  search?: string;
  nationality?: string;
  hasPassport?: boolean;
  limit?: number;
}): Promise<ActionResult<Customer[]>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const { search, nationality, hasPassport, limit: limitCount = 100 } = options || {};

    let queryRef = adminDb
      .collection(`tenants/${tenantId}/customers`)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);

    // Add nationality filter if provided
    if (nationality) {
      queryRef = queryRef.where('nationality', '==', nationality);
    }

    const snapshot = await queryRef.get();

    let customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];

    // Client-side filtering for search and hasPassport (Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.firstName.toLowerCase().includes(searchLower) ||
          customer.lastName.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(search)
      );
    }

    if (hasPassport !== undefined) {
      customers = customers.filter(
        (customer) =>
          hasPassport
            ? customer.passport !== undefined
            : customer.passport === undefined
      );
    }

    return {
      success: true,
      data: (customers as unknown as Record<string, unknown>[]).map(serializeCustomer),
    };
  } catch (error) {
    console.error('Error listing customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list customers',
    };
  }
}

/**
 * T085 [US10] Quick-add customer (simplified fields for invoice form)
 */
export async function quickAddCustomerAction(
  input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    nationality?: string;
  }
): Promise<ActionResult<Customer>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Basic validation - only firstName and lastName are required
    if (!input.firstName || !input.lastName) {
      return {
        success: false,
        error: 'First name and last name are required',
      };
    }

    // Check for duplicate email within tenant (only if email is provided)
    if (input.email) {
      const existingCustomer = await adminDb
        .collection(`tenants/${tenantId}/customers`)
        .where('email', '==', input.email)
        .limit(1)
        .get();

      if (!existingCustomer.empty) {
        return {
          success: false,
          error: 'A customer with this email already exists',
        };
      }
    }

    // Create customer document
    const customerRef = adminDb.collection(`tenants/${tenantId}/customers`).doc();
    const now = Timestamp.now();

    const customer = {
      id: customerRef.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || '',
      phone: input.phone || '',
      nationality: input.nationality || '',
      balance: 0,
      documents: [],
      createdAt: now,
      updatedAt: now,
    } as unknown as Customer;

    await customerRef.set(customer);

    // Create customer account in chart of accounts
    try {
      await createCustomerAccount(
        tenantId,
        customer.id,
        `${customer.firstName} ${customer.lastName}`
      );
    } catch (accountError) {
      console.error('Error creating customer account:', accountError);
      // Don't fail the customer creation if account creation fails
    }

    // Create audit log
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'create',
        entityType: 'customer',
        entityId: customer.id,
        description: `Quick-added customer from invoice: ${customer.firstName} ${customer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers`);

    return {
      success: true,
      data: serializeCustomer(customer as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error quick-adding customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

/**
 * Delete customer
 */
export async function deleteCustomerAction(
  customerId: string
): Promise<ActionResult<void>> {
  try {
    // Get authenticated user from session
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    const customer = customerDoc.data() as Customer;

    // Check if customer has bookings
    const bookings = await adminDb
      .collection(`tenants/${tenantId}/bookings`)
      .where('customerId', '==', customerId)
      .limit(1)
      .get();

    if (!bookings.empty) {
      return {
        success: false,
        error: 'Cannot delete customer with existing bookings',
      };
    }

    await customerRef.delete();

    // Create audit log using Admin SDK
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('auditLogs')
      .add({
        userId: user.uid,
        userEmail: user.email || 'system',
        userRole: user.role || 'admin',
        action: 'delete',
        entityType: 'customer',
        entityId: customerId,
        description: `Deleted customer: ${customer.firstName} ${customer.lastName}`,
        timestamp: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/[locale]/(dashboard)/customers`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete customer',
    };
  }
}
