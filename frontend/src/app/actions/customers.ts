'use server';

// Customer server actions
// T094-T097 [US2] Customer actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { createAuditLog } from '@/lib/audit/create-log';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updatePassportSchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  UpdatePassportInput,
} from '@/lib/validations/customers';
import { Customer } from '@/types/models/customer';

/**
 * T094 [US2] Create a new customer
 */
export async function createCustomerAction(
  tenantId: string,
  userId: string,
  input: CreateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
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

    const customer: Customer = {
      id: customerRef.id,
      ...validatedData,
      balance: 0,
      documents: [],
      createdAt: now,
      updatedAt: now,
    };

    await customerRef.set(customer);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'customer',
      resourceId: customer.id,
      description: `Created customer: ${customer.firstName} ${customer.lastName}`,
    });

    revalidatePath(`/[locale]/(dashboard)/customers`);

    return {
      success: true,
      data: customer,
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
  tenantId: string,
  userId: string,
  customerId: string,
  input: UpdateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
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

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'customer',
      resourceId: customerId,
      description: `Updated customer: ${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
      changes: Object.keys(validatedData).map((key) => ({
        field: key,
        oldValue: existingCustomer[key as keyof Customer],
        newValue: validatedData[key as keyof UpdateCustomerInput],
      })),
    });

    revalidatePath(`/[locale]/(dashboard)/customers`);
    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: updatedCustomer as Customer,
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
  tenantId: string,
  userId: string,
  customerId: string,
  input: UpdatePassportInput
): Promise<ActionResult<Customer>> {
  try {
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

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'customer',
      resourceId: customerId,
      description: `Updated passport for customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
      changes: [
        {
          field: 'passport',
          oldValue: existingCustomer.passport,
          newValue: passportData,
        },
      ],
    });

    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: updatedCustomer as Customer,
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
  tenantId: string,
  userId: string,
  customerId: string,
  documentType: 'passport' | 'visa' | 'photo' | 'vaccination' | 'other',
  documentName: string,
  documentUrl: string
): Promise<ActionResult<Customer>> {
  try {
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

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'customer',
      resourceId: customerId,
      description: `Uploaded ${documentType} document for customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
    });

    revalidatePath(`/[locale]/(dashboard)/customers/${customerId}`);

    return {
      success: true,
      data: {
        ...existingCustomer,
        documents,
        updatedAt: now,
      } as Customer,
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
  tenantId: string,
  userId: string,
  customerId: string,
  documentId: string
): Promise<ActionResult<void>> {
  try {
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

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'delete',
      resource: 'customer',
      resourceId: customerId,
      description: `Deleted document from customer: ${existingCustomer.firstName} ${existingCustomer.lastName}`,
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
  tenantId: string,
  customerId: string
): Promise<ActionResult<Customer>> {
  try {
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
      data: customerDoc.data() as Customer,
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
 * Delete customer
 */
export async function deleteCustomerAction(
  tenantId: string,
  userId: string,
  customerId: string
): Promise<ActionResult<void>> {
  try {
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

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'delete',
      resource: 'customer',
      resourceId: customerId,
      description: `Deleted customer: ${customer.firstName} ${customer.lastName}`,
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
