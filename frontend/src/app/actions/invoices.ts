'use server';

// Invoice server actions
// T128-T131 [US3] Invoice actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { createAuditLog } from '@/lib/audit/create-log';
import {
  generateInvoiceSchema,
  updateInvoiceSchema,
  GenerateInvoiceInput,
  UpdateInvoiceInput,
} from '@/lib/validations/invoices';
import { Invoice, InvoiceLineItem, CommissionSummary, InvoiceStatus } from '@/types/models/invoice';
import { Booking, ServiceSnapshot } from '@/types/models/booking';
import { Customer } from '@/types/models/customer';
import { ServiceType } from '@/types/models/service-catalog';
import { ServiceCategory } from '@/types/models/service';

// Map ServiceCategory to ServiceType
function mapCategoryToServiceType(category: ServiceCategory): ServiceType {
  const mapping: Record<ServiceCategory, ServiceType> = {
    flight: 'ticket',
    hotel: 'hotel',
    visa: 'visa',
    transport: 'other',
    guide: 'other',
    meal: 'other',
    other: 'other',
  };
  return mapping[category] || 'other';
}

/**
 * Generate invoice number (e.g., "INV-2024-0001")
 */
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const invoices = await adminDb
    .collection(`tenants/${tenantId}/invoices`)
    .where('invoiceNumber', '>=', prefix)
    .where('invoiceNumber', '<', `INV-${year + 1}-`)
    .orderBy('invoiceNumber', 'desc')
    .limit(1)
    .get();

  if (invoices.empty) {
    return `${prefix}0001`;
  }

  const lastNumber = invoices.docs[0].data().invoiceNumber;
  const lastSequence = parseInt(lastNumber.split('-')[2], 10);
  const newSequence = (lastSequence + 1).toString().padStart(4, '0');

  return `${prefix}${newSequence}`;
}

/**
 * Calculate commission amount
 */
function calculateCommission(price: number, percentage: number): number {
  return Math.round(price * (percentage / 100) * 100) / 100;
}

/**
 * Serialize Firestore Timestamp to ISO string for client consumption
 */
function serializeTimestamp(ts: unknown): string | undefined {
  if (!ts) return undefined;
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (ts && typeof ts === 'object' && '_seconds' in ts) {
    // Handle Firestore Timestamp object that hasn't been converted
    return new Date((ts as { _seconds: number })._seconds * 1000).toISOString();
  }
  if (typeof ts === 'string') {
    return ts;
  }
  return undefined;
}

/**
 * Serialize invoice data for client consumption (converts Timestamps to strings)
 */
function serializeInvoiceForClient(id: string, data: Record<string, unknown>): Invoice {
  const serializeAttachment = (att: Record<string, unknown> | null) => {
    if (!att) return null;
    const serialized: Record<string, unknown> = {};
    for (const key in att) {
      const value = att[key];
      if (value && typeof value === 'object' && ('toDate' in value || '_seconds' in value)) {
        serialized[key] = serializeTimestamp(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  };

  const serializeLineItem = (item: Record<string, unknown>) => {
    const serialized: Record<string, unknown> = { ...item };
    if (item.attachments && Array.isArray(item.attachments)) {
      serialized.attachments = item.attachments.map(serializeAttachment).filter((a) => a !== null);
    }
    return serialized;
  };

  return {
    id,
    ...data,
    // Map legacy field names to new schema
    total: data.total ?? data.netAmount ?? 0,
    balance: data.balance ?? data.remainingBalance ?? 0,
    totalCommissions: data.totalCommissions ?? data.totalCommission ?? 0,
    // Serialize timestamps
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    invoiceDate: serializeTimestamp(data.invoiceDate),
    dueDate: serializeTimestamp(data.dueDate),
    issueDate: serializeTimestamp(data.issueDate),
    paidDate: serializeTimestamp(data.paidDate),
    cancelledAt: serializeTimestamp(data.cancelledAt),
    attachments: Array.isArray(data.attachments) ? data.attachments.map(serializeAttachment) : [],
    lineItems: (Array.isArray(data.lineItems) ? data.lineItems : (data.items as unknown[] ?? [])).map(serializeLineItem),
    commissionsByPartner: data.commissionsByPartner || [],
  } as unknown as Invoice;
}

/**
 * T128 [US3] Generate invoice from booking
 */
export async function generateInvoiceAction(
  tenantId: string,
  userId: string,
  input: GenerateInvoiceInput
): Promise<ActionResult<Invoice>> {
  try {
    // Validate input
    const validatedData = generateInvoiceSchema.parse(input);

    // Get booking
    const bookingDoc = await adminDb
      .doc(`tenants/${tenantId}/bookings/${validatedData.bookingId}`)
      .get();

    if (!bookingDoc.exists) {
      return { success: false, error: 'Booking not found' };
    }

    const booking = bookingDoc.data() as Booking;

    // Check if invoice already exists for this booking
    if (booking.invoiceId) {
      return { success: false, error: 'Invoice already exists for this booking' };
    }

    // Get customer
    const customerDoc = await adminDb
      .doc(`tenants/${tenantId}/customers/${booking.customerId}`)
      .get();

    if (!customerDoc.exists) {
      return { success: false, error: 'Customer not found' };
    }

    const customer = customerDoc.data() as Customer;

    // Create line items from package snapshot
    const lineItems: InvoiceLineItem[] = booking.packageSnapshot.services.map((service, index) => {
      const quantity = booking.travelers.length;
      const total = service.price * quantity;
      const commissionAmount = service.isOutsourced && service.commissionPercentage
        ? calculateCommission(total, service.commissionPercentage)
        : 0;

      return {
        id: `item_${index + 1}`,
        serviceCatalogId: service.id, // Use service ID as catalog reference
        serviceName: service.name,
        serviceNameAr: service.name, // Use English name as fallback
        serviceType: mapCategoryToServiceType(service.category),
        serviceId: service.id,
        description: service.name,
        quantity,
        unitPrice: service.price,
        discount: 0,
        total,
        isOutsourced: service.isOutsourced,
        partnerId: service.partnerOfficeId,
        partnerName: service.partnerOfficeName,
        partnerOfficeId: service.partnerOfficeId,
        partnerOfficeName: service.partnerOfficeName,
        commissionPercentage: service.commissionPercentage,
        commissionAmount,
        displayOrder: index,
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discount = validatedData.discountPercentage
      ? calculateCommission(subtotal, validatedData.discountPercentage)
      : validatedData.discount;
    const taxableAmount = subtotal - discount;
    const tax = validatedData.taxPercentage
      ? calculateCommission(taxableAmount, validatedData.taxPercentage)
      : validatedData.tax;
    const total = taxableAmount + tax;

    // Calculate commissions by partner
    const commissionsByPartner: CommissionSummary[] = [];
    const partnerCommissions = new Map<string, { name: string; amount: number }>();

    lineItems.forEach((item) => {
      if (item.isOutsourced && item.partnerOfficeId && item.commissionAmount) {
        const existing = partnerCommissions.get(item.partnerOfficeId);
        if (existing) {
          existing.amount += item.commissionAmount;
        } else {
          partnerCommissions.set(item.partnerOfficeId, {
            name: item.partnerOfficeName || 'Unknown Partner',
            amount: item.commissionAmount,
          });
        }
      }
    });

    partnerCommissions.forEach((value, partnerIdKey) => {
      commissionsByPartner.push({
        // Required fields
        partnerId: partnerIdKey,
        partnerName: value.name,
        amount: value.amount,
        status: 'pending',
        // Legacy support fields
        partnerOfficeId: partnerIdKey,
        partnerOfficeName: value.name,
        totalAmount: value.amount,
      });
    });

    const totalCommissions = commissionsByPartner.reduce((sum, c) => sum + (c.amount || c.totalAmount || 0), 0);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Create invoice
    const invoiceRef = adminDb.collection(`tenants/${tenantId}/invoices`).doc();
    const now = Timestamp.now();

    // Note: Using admin SDK types which are compatible at runtime but differ in TypeScript definitions
    const invoice = {
      id: invoiceRef.id,
      invoiceNumber,
      bookingId: booking.id,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      lineItems,
      subtotal,
      discount,
      discountPercentage: validatedData.discountPercentage,
      tax,
      taxPercentage: validatedData.taxPercentage,
      total,
      currency: booking.currency,
      totalCommissions,
      commissionsByPartner,
      status: 'draft',
      paidAmount: booking.paidAmount,
      balance: total - booking.paidAmount,
      invoiceDate: now,
      issueDate: now,
      dueDate: Timestamp.fromDate(new Date(validatedData.dueDate)),
      notes: validatedData.notes,
      terms: validatedData.terms,
      version: 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Invoice;

    // Update booking with invoice reference
    const batch = adminDb.batch();
    batch.set(invoiceRef, invoice);
    batch.update(adminDb.doc(`tenants/${tenantId}/bookings/${booking.id}`), {
      invoiceId: invoiceRef.id,
      updatedAt: now,
    });
    await batch.commit();

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'invoice',
      resourceId: invoice.id,
      description: `Generated invoice ${invoiceNumber} for booking ${booking.bookingNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/invoices`);
    revalidatePath(`/[locale]/(dashboard)/bookings/${booking.id}`);

    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}

/**
 * T129 [US3] Update invoice
 */
export async function updateInvoiceAction(
  tenantId: string,
  userId: string,
  invoiceId: string,
  input: UpdateInvoiceInput
): Promise<ActionResult<Invoice>> {
  try {
    const validatedData = updateInvoiceSchema.parse(input);

    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const existingInvoice = invoiceDoc.data() as Invoice;

    if (existingInvoice.status !== 'draft') {
      return { success: false, error: 'Only draft invoices can be updated' };
    }

    // Recalculate if discount or tax changed
    let { subtotal, total, balance } = existingInvoice;

    if (validatedData.discount !== undefined || validatedData.discountPercentage !== undefined) {
      const discount = validatedData.discountPercentage
        ? calculateCommission(subtotal, validatedData.discountPercentage)
        : validatedData.discount || 0;

      const tax = validatedData.taxPercentage
        ? calculateCommission(subtotal - discount, validatedData.taxPercentage)
        : (validatedData.tax ?? existingInvoice.tax ?? 0);

      total = subtotal - discount + tax;
      balance = total - existingInvoice.paidAmount;
    }

    const updatedInvoice = {
      ...existingInvoice,
      ...validatedData,
      total,
      balance,
      dueDate: validatedData.dueDate
        ? Timestamp.fromDate(new Date(validatedData.dueDate))
        : existingInvoice.dueDate,
      updatedAt: Timestamp.now(),
    };

    await invoiceRef.update(updatedInvoice);

    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'invoice',
      resourceId: invoiceId,
      description: `Updated invoice ${existingInvoice.invoiceNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

    return { success: true, data: updatedInvoice as Invoice };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    };
  }
}

/**
 * T130 [US3] Issue invoice (draft -> issued)
 */
export async function issueInvoiceAction(
  tenantId: string,
  userId: string,
  invoiceId: string
): Promise<ActionResult<Invoice>> {
  try {
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    if (invoice.status !== 'draft') {
      return { success: false, error: 'Only draft invoices can be issued' };
    }

    const now = Timestamp.now();
    const updateData = {
      status: 'issued' as const,
      issueDate: now,
      updatedAt: now,
    };

    await invoiceRef.update(updateData);

    await createAuditLog({
      tenantId,
      userId,
      action: 'status_change',
      resource: 'invoice',
      resourceId: invoiceId,
      description: `Issued invoice ${invoice.invoiceNumber}`,
      changes: [{ field: 'status', oldValue: 'draft', newValue: 'issued' }],
    });

    revalidatePath(`/[locale]/(dashboard)/invoices`);
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

    return { success: true, data: { ...invoice, ...updateData } as Invoice };
  } catch (error) {
    console.error('Error issuing invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue invoice',
    };
  }
}

/**
 * T131 [US3] Cancel invoice
 */
export async function cancelInvoiceAction(
  tenantId: string,
  userId: string,
  invoiceId: string,
  reason: string
): Promise<ActionResult<Invoice>> {
  try {
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return { success: false, error: 'Cannot cancel a paid or already cancelled invoice' };
    }

    const now = Timestamp.now();
    const updateData = {
      status: 'cancelled' as const,
      notes: invoice.notes ? `${invoice.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`,
      updatedAt: now,
    };

    await invoiceRef.update(updateData);

    // Remove invoice reference from booking
    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${invoice.bookingId}`);
    await bookingRef.update({
      invoiceId: null,
      updatedAt: now,
    });

    await createAuditLog({
      tenantId,
      userId,
      action: 'status_change',
      resource: 'invoice',
      resourceId: invoiceId,
      description: `Cancelled invoice ${invoice.invoiceNumber}: ${reason}`,
      changes: [{ field: 'status', oldValue: invoice.status, newValue: 'cancelled' }],
    });

    revalidatePath(`/[locale]/(dashboard)/invoices`);
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);
    revalidatePath(`/[locale]/(dashboard)/bookings/${invoice.bookingId}`);

    return { success: true, data: { ...invoice, ...updateData } as Invoice };
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel invoice',
    };
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceAction(
  tenantId: string,
  invoiceId: string
): Promise<ActionResult<Invoice>> {
  try {
    const invoiceDoc = await adminDb
      .doc(`tenants/${tenantId}/invoices/${invoiceId}`)
      .get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, data: invoiceDoc.data() as Invoice };
  } catch (error) {
    console.error('Error getting invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice',
    };
  }
}

/**
 * Update invoice payment status based on payments
 */
export async function updateInvoicePaymentStatus(
  tenantId: string,
  invoiceId: string,
  paidAmount: number
): Promise<void> {
  const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) return;

  const invoice = invoiceDoc.data() as Invoice;
  const balance = invoice.total - paidAmount;

  let status: InvoiceStatus = invoice.status;
  if (paidAmount >= invoice.total) {
    status = 'paid';
  } else if (paidAmount > 0) {
    status = 'partial';
  }

  await invoiceRef.update({
    paidAmount,
    balance,
    status,
    paidDate: status === 'paid' ? Timestamp.now() : null,
    updatedAt: Timestamp.now(),
  });
}

// ==========================================
// T039-T040 [US1] Service-Based Invoice Actions
// ==========================================

import { getSessionUser } from '@/lib/auth/require-role';
import { createJournalEntry, createReversalEntry } from '@/lib/accounting/journal-entries';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * T039 [US1] Create a service-based invoice (issued directly)
 * Invoices are now issued directly upon creation, creating journal entries immediately
 */
export async function createServiceInvoice(data: any): Promise<ActionResult<Invoice>> {
  try {
    const user = await getSessionUser();
    if (!user?.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantId = user.tenantId;

    // Get customer details
    const customerDoc = await adminDb
      .doc(`tenants/${tenantId}/customers/${data.customerId}`)
      .get();

    if (!customerDoc.exists) {
      return { success: false, error: 'Customer not found' };
    }

    const customer = customerDoc.data() as Customer;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Get tenant currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    // Create invoice reference
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${adminDb.collection('dummy').doc().id}`);
    const now = new Date();

    const lineItems = data.lineItems.map((item: any, index: number) => ({
      ...item,
      id: `${invoiceRef.id}-${index}`,
      displayOrder: index
    }));

    // Create journal entry for double-entry accounting (Net/Agency Method)
    // Get customer account
    const customerAccountQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', data.customerId)
      .limit(1)
      .get();

    if (customerAccountQuery.empty) {
      return { success: false, error: 'Customer account not found in chart of accounts' };
    }

    const customerAccount = customerAccountQuery.docs[0].data();

    // Get revenue account
    const revenueAccountQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('code', '==', '4001')
      .where('isSystem', '==', true)
      .limit(1)
      .get();

    if (revenueAccountQuery.empty) {
      return { success: false, error: 'Revenue account not found. Please initialize default accounts.' };
    }

    const revenueAccount = revenueAccountQuery.docs[0].data();

    // Build journal lines dynamically based on partner services
    const journalLines: Array<{
      accountId: string;
      accountName: string;
      accountCode: string;
      debit: number;
      credit: number;
    }> = [];

    // Always: Debit AR for full invoice amount (what customer owes us)
    journalLines.push({
      accountId: customerAccount.id,
      accountName: customerAccount.name,
      accountCode: customerAccount.code,
      debit: data.total,
      credit: 0
    });

    // Calculate partner liabilities and our commission revenue
    let totalPartnerLiability = 0;
    let totalCommissionRevenue = 0;
    const commissionsByPartner = data.commissionsByPartner || [];

    // Process partner services from commissionsByPartner
    if (commissionsByPartner.length > 0) {
      for (const commission of commissionsByPartner) {
        const partnerId = commission.partnerId || commission.partnerOfficeId;
        const commissionAmount = commission.amount || commission.totalAmount || 0;

        if (partnerId && commissionAmount > 0) {
          // Calculate gross amount for this partner from line items
          let partnerGross = 0;
          for (const item of lineItems) {
            const itemPartnerId = item.partnerId || item.partnerOfficeId;
            if (item.isOutsourced && itemPartnerId === partnerId) {
              partnerGross += item.total || 0;
            }
          }

          // Net amount we owe partner = gross - our commission
          const partnerNet = partnerGross - commissionAmount;

          if (partnerNet > 0) {
            // Get partner AP account
            const partnerAccountQuery = await adminDb
              .collection(`tenants/${tenantId}/accounts`)
              .where('linkedEntityType', '==', 'partner')
              .where('linkedEntityId', '==', partnerId)
              .limit(1)
              .get();

            if (!partnerAccountQuery.empty) {
              const partnerAccount = partnerAccountQuery.docs[0].data();

              // Credit AP for net amount owed to partner
              journalLines.push({
                accountId: partnerAccount.id,
                accountName: partnerAccount.name,
                accountCode: partnerAccount.code,
                debit: 0,
                credit: partnerNet
              });

              totalPartnerLiability += partnerNet;
            }
          }

          totalCommissionRevenue += commissionAmount;
        }
      }
    }

    // Calculate direct revenue (non-partner services)
    const directRevenue = data.total - totalPartnerLiability - totalCommissionRevenue;

    // Credit Revenue for our earnings (commission + direct services)
    const ourRevenue = totalCommissionRevenue + directRevenue;
    if (ourRevenue > 0) {
      journalLines.push({
        accountId: revenueAccount.id,
        accountName: revenueAccount.name,
        accountCode: revenueAccount.code,
        debit: 0,
        credit: ourRevenue
      });
    }

    // Create journal entry
    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Invoice ${invoiceNumber} issued to ${customer.firstName} ${customer.lastName}`,
      type: 'invoice_created',
      lines: journalLines,
      sourceType: 'invoice',
      sourceId: invoiceRef.id,
      createdBy: user.uid
    });

    // Create invoice with status 'issued'
    const invoice: Invoice = {
      id: invoiceRef.id,
      invoiceNumber,
      customerId: customer.id!,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      lineItems,
      subtotal: data.subtotal,
      discount: data.discount,
      discountPercentage: data.discountPercentage || 0,
      total: data.total,
      currency,
      totalCommissions: data.totalCommissions,
      commissionsByPartner: commissionsByPartner,
      status: 'issued',
      paidAmount: 0,
      balance: data.total,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : now,
      issueDate: now,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || '',
      attachments: data.attachments || [],
      journalEntryId: journalEntry.id,
      version: 1,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now
    } as any;

    await invoiceRef.set(invoice);

    // Update partner pending commissions and total commissions
    if (commissionsByPartner.length > 0) {
      for (const commission of commissionsByPartner) {
        const partnerId = commission.partnerId || commission.partnerOfficeId;
        const commissionAmount = commission.amount || commission.totalAmount || 0;

        if (partnerId && commissionAmount > 0) {
          const partnerRef = adminDb.doc(
            `tenants/${tenantId}/partnerOffices/${partnerId}`
          );

          await partnerRef.update({
            pendingCommissions: FieldValue.increment(commissionAmount),
            totalCommissionsEarned: FieldValue.increment(commissionAmount),
            updatedAt: new Date()
          });
        }
      }
    }

    // Increment service usage counts for all services in the invoice
    if (lineItems.length > 0) {
      const serviceIds = new Set<string>();
      for (const item of lineItems) {
        if (item.serviceId) {
          serviceIds.add(item.serviceId);
        }
      }
      // Update usage count for each unique service
      for (const serviceId of serviceIds) {
        try {
          const serviceRef = adminDb.doc(`tenants/${tenantId}/serviceCatalog/${serviceId}`);
          await serviceRef.update({
            usageCount: FieldValue.increment(1),
          });
        } catch (err) {
          // Log but don't fail the invoice creation if usage update fails
          console.warn(`Failed to increment usage count for service ${serviceId}:`, err);
        }
      }
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'invoice',
      resourceId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber, status: 'issued', journalEntryId: journalEntry.id }
    });

    revalidatePath('/[locale]/(dashboard)/invoices');

    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error creating service invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    };
  }
}

/**
 * T039 [US1] Update a service-based invoice (draft only)
 */
export async function updateServiceInvoice(
  invoiceId: string,
  data: any
): Promise<ActionResult<Invoice>> {
  try {
    const user = await getSessionUser();
    if (!user?.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantId = user.tenantId;
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    // Only allow updates to draft invoices
    if (invoice.status !== 'draft') {
      return { success: false, error: 'Only draft invoices can be updated' };
    }

    // Check version for optimistic locking
    if (data.version !== invoice.version) {
      return {
        success: false,
        error: 'Invoice was modified by another user. Please reload.',
        code: 'VERSION_CONFLICT',
      };
    }

    // Update invoice
    const updatedInvoice = {
      ...invoice,
      lineItems: data.lineItems,
      subtotal: data.subtotal,
      discount: data.discount,
      discountPercentage: data.discountPercentage || 0,
      total: data.total,
      balance: data.total,
      totalCommissions: data.totalCommissions,
      commissionsByPartner: data.commissionsByPartner || [],
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : invoice.invoiceDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
      notes: data.notes || '',
      attachments: data.attachments || [],
      version: invoice.version + 1,
      updatedAt: Timestamp.now()
    };

    await invoiceRef.update(updatedInvoice);

    revalidatePath('/[locale]/(dashboard)/invoices');
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

    return { success: true, data: updatedInvoice as unknown as Invoice };
  } catch (error) {
    console.error('Error updating service invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice'
    };
  }
}

/**
 * T040 [US1] Issue a service invoice (creates journal entries)
 */
export async function issueServiceInvoice(invoiceId: string): Promise<ActionResult<Invoice>> {
  try {
    const user = await getSessionUser();
    if (!user?.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantId = user.tenantId;
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    // Debug logging
    console.log('🔍 Invoice status check:', {
      invoiceId,
      status: invoice.status,
      statusType: typeof invoice.status,
      rawStatus: JSON.stringify(invoice.status)
    });

    // Only draft invoices can be issued
    // Normalize status by trimming whitespace and converting to lowercase
    const normalizedStatus = (invoice.status || '').toString().trim().toLowerCase();
    if (normalizedStatus !== 'draft') {
      console.error('❌ Status check failed:', {
        expected: 'draft',
        actual: invoice.status,
        normalized: normalizedStatus,
        comparison: normalizedStatus !== 'draft'
      });
      return { success: false, error: 'Only draft invoices can be issued' };
    }

    // T040 - Create journal entry for double-entry accounting (Net/Agency Method)
    // For invoices with partner services:
    //   Debit: Customer Account (AR) - full invoice amount
    //   Credit: Partner Account (AP) - net amount we owe partner (gross - commission)
    //   Credit: Service Revenue - our commission/markup earned
    // For direct services (no partner):
    //   Debit: Customer Account (AR) - full invoice amount
    //   Credit: Service Revenue - full amount

    // Get customer account
    const customerAccountQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', invoice.customerId)
      .limit(1)
      .get();

    if (customerAccountQuery.empty) {
      return { success: false, error: 'Customer account not found in chart of accounts' };
    }

    const customerAccount = customerAccountQuery.docs[0].data();

    // Get revenue account
    const revenueAccountQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('code', '==', '4001')
      .where('isSystem', '==', true)
      .limit(1)
      .get();

    if (revenueAccountQuery.empty) {
      return { success: false, error: 'Revenue account not found. Please initialize default accounts.' };
    }

    const revenueAccount = revenueAccountQuery.docs[0].data();

    // Build journal lines dynamically based on partner services
    const journalLines: Array<{
      accountId: string;
      accountName: string;
      accountCode: string;
      debit: number;
      credit: number;
    }> = [];

    // Always: Debit AR for full invoice amount (what customer owes us)
    journalLines.push({
      accountId: customerAccount.id,
      accountName: customerAccount.name,
      accountCode: customerAccount.code,
      debit: invoice.total,
      credit: 0
    });

    // Calculate partner liabilities and our commission revenue
    let totalPartnerLiability = 0;
    let totalCommissionRevenue = 0;

    // Process partner services from commissionsByPartner
    if (invoice.commissionsByPartner && invoice.commissionsByPartner.length > 0) {
      for (const commission of invoice.commissionsByPartner) {
        const partnerId = commission.partnerId || commission.partnerOfficeId;
        const commissionAmount = commission.amount || commission.totalAmount || 0;

        if (partnerId && commissionAmount > 0) {
          // Calculate gross amount for this partner from line items
          let partnerGross = 0;
          if (invoice.lineItems && invoice.lineItems.length > 0) {
            for (const item of invoice.lineItems) {
              const itemPartnerId = item.partnerId || item.partnerOfficeId;
              if (item.isOutsourced && itemPartnerId === partnerId) {
                partnerGross += item.total || 0;
              }
            }
          }

          // Net amount we owe partner = gross - our commission
          const partnerNet = partnerGross - commissionAmount;

          if (partnerNet > 0) {
            // Get partner AP account
            const partnerAccountQuery = await adminDb
              .collection(`tenants/${tenantId}/accounts`)
              .where('linkedEntityType', '==', 'partner')
              .where('linkedEntityId', '==', partnerId)
              .limit(1)
              .get();

            if (!partnerAccountQuery.empty) {
              const partnerAccount = partnerAccountQuery.docs[0].data();

              // Credit AP for net amount owed to partner
              journalLines.push({
                accountId: partnerAccount.id,
                accountName: partnerAccount.name,
                accountCode: partnerAccount.code,
                debit: 0,
                credit: partnerNet
              });

              totalPartnerLiability += partnerNet;
            }
          }

          totalCommissionRevenue += commissionAmount;
        }
      }
    }

    // Calculate direct revenue (non-partner services)
    const directRevenue = invoice.total - totalPartnerLiability - totalCommissionRevenue;

    // Credit Revenue for our earnings (commission + direct services)
    const ourRevenue = totalCommissionRevenue + directRevenue;
    if (ourRevenue > 0) {
      journalLines.push({
        accountId: revenueAccount.id,
        accountName: revenueAccount.name,
        accountCode: revenueAccount.code,
        debit: 0,
        credit: ourRevenue
      });
    }

    // Create journal entry
    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Invoice ${invoice.invoiceNumber} issued to ${invoice.customerName}`,
      type: 'invoice_created',
      lines: journalLines,
      sourceType: 'invoice',
      sourceId: invoice.id,
      createdBy: user.uid
    });

    // Update invoice status
    await invoiceRef.update({
      status: 'issued',
      journalEntryId: journalEntry.id,
      updatedAt: new Date(),
      version: (invoice.version || 1) + 1
    });

    // T040 [US1] Update partner commission totals when invoice is issued
    if (invoice.commissionsByPartner && invoice.commissionsByPartner.length > 0) {
      for (const commission of invoice.commissionsByPartner) {
        // Support both new (partnerId/amount) and legacy (partnerOfficeId/totalAmount) field names
        const partnerId = commission.partnerId || commission.partnerOfficeId;
        const commissionAmount = commission.amount || commission.totalAmount || 0;

        if (partnerId && commissionAmount > 0) {
          const partnerRef = adminDb.doc(
            `tenants/${tenantId}/partnerOffices/${partnerId}`
          );

          await partnerRef.update({
            pendingCommissions: FieldValue.increment(commissionAmount),
            totalCommissionsEarned: FieldValue.increment(commissionAmount),
            updatedAt: new Date()
          });
        }
      }
    }

    // Increment service usage counts for all services in the invoice
    if (invoice.lineItems && invoice.lineItems.length > 0) {
      const serviceIds = new Set<string>();
      for (const item of invoice.lineItems) {
        if (item.serviceId) {
          serviceIds.add(item.serviceId);
        }
      }
      // Update usage count for each unique service
      for (const serviceId of serviceIds) {
        try {
          const serviceRef = adminDb.doc(`tenants/${tenantId}/serviceCatalog/${serviceId}`);
          await serviceRef.update({
            usageCount: FieldValue.increment(1),
          });
        } catch (err) {
          // Log but don't fail the invoice issue if usage update fails
          console.warn(`Failed to increment usage count for service ${serviceId}:`, err);
        }
      }
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'invoice',
      resourceId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber, action: 'issued' }
    });

    revalidatePath('/[locale]/(dashboard)/invoices');
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

    // Refetch and serialize the invoice for client consumption
    const updatedInvoiceDoc = await invoiceRef.get();
    const serializedInvoice = serializeInvoiceForClient(
      updatedInvoiceDoc.id,
      updatedInvoiceDoc.data() as Record<string, unknown>
    );

    return {
      success: true,
      data: serializedInvoice
    };
  } catch (error) {
    console.error('Error issuing service invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue invoice'
    };
  }
}

/**
 * T078-T079 [US9] Cancel service-based invoice with reversal journal entry
 * Cancels an invoice, reverses journal entries, and handles partial payments
 */
export async function cancelServiceInvoice(
  invoiceId: string,
  version: number,
  reason: string
): Promise<ActionResult<Invoice>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return {
        success: false,
        error: 'Unauthenticated'
      };
    }

    const tenantId = user.tenantId;

    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return {
        success: false,
        error: 'Invoice not found'
      };
    }

    const invoice = invoiceDoc.data() as Invoice;

    // Optimistic locking check
    if (invoice.version !== version) {
      return {
        success: false,
        error: 'Invoice has been modified by another user. Please refresh and try again.'
      };
    }

    // Can only cancel draft, issued, or partial invoices
    if (['cancelled'].includes(invoice.status)) {
      return {
        success: false,
        error: 'Invoice is already cancelled'
      };
    }

    // Check if invoice has been fully paid
    if (invoice.status === 'paid') {
      return {
        success: false,
        error: 'Cannot cancel a fully paid invoice. Please issue a refund instead.'
      };
    }

    // T081 [US9] Handle partial payments
    // If invoice has partial payments, we need to handle them
    const hasPartialPayments = invoice.paidAmount > 0;
    if (hasPartialPayments) {
      // Note: In a real system, you might want to:
      // 1. Require approval for cancelling invoices with partial payments
      // 2. Automatically create a refund/credit note
      // 3. Move the credit to customer account for future use
      // For now, we'll just add a note about the partial payment
      console.warn(`Cancelling invoice ${invoice.invoiceNumber} with partial payment of ${invoice.paidAmount}`);
    }

    // T079 [US9] Create reversal journal entry if invoice was issued
    let reversalEntryId: string | undefined;
    if (invoice.journalEntryId && invoice.status === 'issued') {
      try {
        const reversalEntry = await createReversalEntry(
          tenantId,
          invoice.journalEntryId,
          user.uid,
          `Invoice cancellation: ${reason}`
        );
        reversalEntryId = reversalEntry.id;
      } catch (error) {
        console.error('Error creating reversal entry:', error);
        // Continue with cancellation even if reversal fails
        // but log the error for manual review
        await createAuditLog({
          tenantId,
          userId: user.uid,
          action: 'update',
          resource: 'invoice',
          resourceId: invoice.id,
          description: `Failed to create reversal entry for invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Update invoice
    const updateData: any = {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: user.uid,
      cancellationReason: reason,
      notes: invoice.notes
        ? `${invoice.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`,
      updatedAt: FieldValue.serverTimestamp(),
      version: (invoice.version || 1) + 1
    };

    if (reversalEntryId) {
      updateData.reversalJournalEntryId = reversalEntryId;
    }

    await invoiceRef.update(updateData);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'invoice',
      resourceId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        action: 'cancelled',
        reason,
        hadPartialPayments: hasPartialPayments,
        paidAmount: invoice.paidAmount,
        reversalEntryId
      }
    });

    revalidatePath('/[locale]/(dashboard)/invoices');
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);
    revalidatePath('/[locale]/(dashboard)/accounting/journal');

    // Refetch the invoice to get the actual timestamp values
    const updatedInvoiceDoc = await invoiceRef.get();
    // Serialize the invoice data for client consumption (converts Timestamps to strings)
    const updatedInvoice = serializeInvoiceForClient(
      updatedInvoiceDoc.id,
      updatedInvoiceDoc.data() as Record<string, unknown>
    );

    return {
      success: true,
      data: updatedInvoice
    };
  } catch (error) {
    console.error('Error cancelling service invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel invoice'
    };
  }
}

// ==========================================
// Partner Payment Invoice Linking
// ==========================================

/**
 * Interface for invoices with pending partner commissions
 */
export interface InvoiceWithCommission {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  commissionAmount: number;
  commissionPercentage: number;
  grossAmount: number;
}

/**
 * Get invoices with pending commissions for a specific partner
 * Used for invoice-based partner payment flow
 */
export async function getInvoicesWithPendingCommissionsAction(
  tenantId: string,
  partnerId: string
): Promise<ActionResult<InvoiceWithCommission[]>> {
  try {
    // Include both 'issued' and 'partial' status invoices (they may still have pending partner commissions)
    const invoicesSnapshot = await adminDb
      .collection(`tenants/${tenantId}/invoices`)
      .where('status', 'in', ['issued', 'partial'])
      .get();

    const invoices: InvoiceWithCommission[] = [];

    invoicesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const commissionsByPartner = data.commissionsByPartner || [];

      // Find this partner's commission - check both partnerId and partnerOfficeId for compatibility
      const partnerCommission = commissionsByPartner.find(
        (c: any) => (c.partnerOfficeId === partnerId || c.partnerId === partnerId) && c.status === 'pending'
      );

      if (partnerCommission) {
        // Calculate gross amount from line items for this partner
        // Check both partnerId and partnerOfficeId in line items for compatibility
        const grossAmount = (data.lineItems || [])
          .filter((item: any) => item.partnerOfficeId === partnerId || item.partnerId === partnerId)
          .reduce((sum: number, item: any) => sum + (item.total || 0), 0);

        // Support both amount and totalAmount field names
        const commissionAmount = partnerCommission.amount || partnerCommission.totalAmount || 0;
        const commissionPercentage = grossAmount > 0
          ? (commissionAmount / grossAmount) * 100
          : 0;

        invoices.push({
          invoiceId: doc.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate?.toDate() || data.invoiceDate || new Date(),
          commissionAmount,
          commissionPercentage,
          grossAmount,
        });
      }
    });

    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices with pending commissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices'
    };
  }
}

// ==========================================
// Edit Invoice (Any Status) with Accounting Adjustments
// ==========================================

import { createInvoiceAdjustmentEntry, InvoiceAdjustmentInput } from '@/lib/accounting/journal-entries';

/**
 * Interface for accounting state calculations (Net/Agency Method)
 */
interface InvoiceAccountingState {
  arAmount: number;
  apByPartner: Map<string, {
    partnerId: string;
    grossAmount: number;
    netAmount: number;
    commissionAmount: number;
  }>;
  totalAP: number;
  revenueAmount: number;
}

/**
 * Calculate the accounting state from invoice data
 */
function calculateInvoiceAccountingState(
  total: number,
  lineItems: any[],
  commissionsByPartner: any[]
): InvoiceAccountingState {
  const apByPartner = new Map<string, {
    partnerId: string;
    grossAmount: number;
    netAmount: number;
    commissionAmount: number;
  }>();

  let totalCommission = 0;
  let totalPartnerGross = 0;

  // Calculate partner amounts from line items
  for (const item of lineItems || []) {
    const partnerId = item.partnerId || item.partnerOfficeId;
    if (item.isOutsourced && partnerId) {
      const itemTotal = item.total || 0;
      const existing = apByPartner.get(partnerId);
      if (existing) {
        existing.grossAmount += itemTotal;
      } else {
        apByPartner.set(partnerId, {
          partnerId,
          grossAmount: itemTotal,
          netAmount: 0,
          commissionAmount: 0,
        });
      }
      totalPartnerGross += itemTotal;
    }
  }

  // Add commission info from commissionsByPartner
  for (const commission of commissionsByPartner || []) {
    const partnerId = commission.partnerId || commission.partnerOfficeId;
    const commissionAmount = commission.amount || commission.totalAmount || 0;
    const existing = apByPartner.get(partnerId);
    if (existing) {
      existing.commissionAmount = commissionAmount;
      existing.netAmount = existing.grossAmount - commissionAmount;
      totalCommission += commissionAmount;
    }
  }

  // Calculate totals
  const totalAP = Array.from(apByPartner.values()).reduce(
    (sum, p) => sum + p.netAmount,
    0
  );
  const directRevenue = total - totalPartnerGross;
  const revenueAmount = totalCommission + directRevenue;

  return {
    arAmount: total,
    apByPartner,
    totalAP,
    revenueAmount,
  };
}

/**
 * Calculate commissions by partner from line items
 */
function calculateCommissionsByPartner(
  lineItems: any[],
  partners: Map<string, { id: string; name: string }>
): Array<{
  partnerId: string;
  partnerName: string;
  amount: number;
  status: 'pending' | 'settled';
  partnerOfficeId: string;
  partnerOfficeName: string;
  totalAmount: number;
}> {
  const commissionMap = new Map<string, {
    partnerId: string;
    partnerName: string;
    amount: number;
  }>();

  for (const item of lineItems || []) {
    const partnerId = item.partnerId || item.partnerOfficeId;
    const partnerName = item.partnerName || item.partnerOfficeName;
    const commissionAmount = item.commissionAmount || 0;

    if (item.isOutsourced && partnerId && commissionAmount > 0) {
      const existing = commissionMap.get(partnerId);
      if (existing) {
        existing.amount += commissionAmount;
      } else {
        commissionMap.set(partnerId, {
          partnerId,
          partnerName: partnerName || partners.get(partnerId)?.name || 'Unknown Partner',
          amount: commissionAmount,
        });
      }
    }
  }

  return Array.from(commissionMap.values()).map((c) => ({
    partnerId: c.partnerId,
    partnerName: c.partnerName,
    amount: c.amount,
    status: 'pending' as const,
    // Legacy support
    partnerOfficeId: c.partnerId,
    partnerOfficeName: c.partnerName,
    totalAmount: c.amount,
  }));
}

/**
 * Edit an invoice at any status (draft, issued, partial, paid)
 * Creates accounting adjustment entries for non-draft invoices (Net/Agency Method)
 */
export async function editIssuedInvoice(
  invoiceId: string,
  data: {
    lineItems: any[];
    discount: number;
    discountPercentage?: number;
    invoiceDate?: string;
    dueDate?: string;
    notes?: string;
    attachments?: any[];
    version: number;
  }
): Promise<ActionResult<Invoice & { overpaymentInfo?: { amount: number } }>> {
  try {
    const user = await getSessionUser();
    if (!user?.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantId = user.tenantId;
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    // Check optimistic locking
    if (data.version !== invoice.version) {
      return {
        success: false,
        error: 'Invoice was modified by another user. Please reload.',
        code: 'VERSION_CONFLICT',
      };
    }

    // Cannot edit cancelled invoices
    if (invoice.status === 'cancelled') {
      return { success: false, error: 'Cannot edit cancelled invoices' };
    }

    // Calculate new totals
    const newSubtotal = data.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const newDiscount = data.discountPercentage
      ? Math.round(newSubtotal * (data.discountPercentage / 100) * 100) / 100
      : data.discount || 0;
    const newTotal = newSubtotal - newDiscount;

    // Calculate new commissions
    const newCommissionsByPartner = calculateCommissionsByPartner(data.lineItems, new Map());
    const newTotalCommissions = newCommissionsByPartner.reduce((sum, c) => sum + c.amount, 0);

    // For draft invoices, use simple update (no accounting)
    if (invoice.status === 'draft') {
      const updatedInvoice = {
        ...invoice,
        lineItems: data.lineItems.map((item: any, index: number) => ({
          ...item,
          id: item.id || `${invoiceId}-${index}`,
          displayOrder: index,
        })),
        subtotal: newSubtotal,
        discount: newDiscount,
        discountPercentage: data.discountPercentage || 0,
        total: newTotal,
        balance: newTotal,
        totalCommissions: newTotalCommissions,
        commissionsByPartner: newCommissionsByPartner,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : invoice.invoiceDate,
        dueDate: data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
        notes: data.notes || '',
        attachments: data.attachments || [],
        version: invoice.version + 1,
        updatedAt: new Date(),
      };

      await invoiceRef.update(updatedInvoice);

      await createAuditLog({
        tenantId,
        userId: user.uid,
        action: 'update',
        resource: 'invoice',
        resourceId: invoiceId,
        details: { invoiceNumber: invoice.invoiceNumber, action: 'edited_draft' }
      });

      revalidatePath('/[locale]/(dashboard)/invoices');
      revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

      const refetchedDoc = await invoiceRef.get();
      return {
        success: true,
        data: serializeInvoiceForClient(refetchedDoc.id, refetchedDoc.data() as Record<string, unknown>)
      };
    }

    // For partial invoices, validate total >= paidAmount
    if (invoice.status === 'partial' && newTotal < invoice.paidAmount) {
      return {
        success: false,
        error: `Cannot reduce total below paid amount (${invoice.paidAmount})`
      };
    }

    // For issued/partial/paid invoices, create accounting adjustments
    // Calculate old and new accounting states
    const oldState = calculateInvoiceAccountingState(
      invoice.total,
      invoice.lineItems,
      invoice.commissionsByPartner || []
    );

    const newState = calculateInvoiceAccountingState(
      newTotal,
      data.lineItems,
      newCommissionsByPartner
    );

    // Calculate deltas
    const arDelta = newState.arAmount - oldState.arAmount;
    const revenueDelta = newState.revenueAmount - oldState.revenueAmount;

    // Calculate AP deltas per partner
    const allPartnerIds = new Set([
      ...oldState.apByPartner.keys(),
      ...newState.apByPartner.keys(),
    ]);

    const apDeltas: InvoiceAdjustmentInput['apDeltas'] = [];
    const partnerCommissionDeltas = new Map<string, number>();

    for (const partnerId of allPartnerIds) {
      const oldAP = oldState.apByPartner.get(partnerId);
      const newAP = newState.apByPartner.get(partnerId);
      const oldNet = oldAP?.netAmount || 0;
      const newNet = newAP?.netAmount || 0;
      const delta = newNet - oldNet;

      // Track commission delta for partner record update
      const oldCommission = oldAP?.commissionAmount || 0;
      const newCommission = newAP?.commissionAmount || 0;
      partnerCommissionDeltas.set(partnerId, newCommission - oldCommission);

      if (Math.abs(delta) >= 0.01) {
        // Get partner account
        const partnerAccountQuery = await adminDb
          .collection(`tenants/${tenantId}/accounts`)
          .where('linkedEntityType', '==', 'partner')
          .where('linkedEntityId', '==', partnerId)
          .limit(1)
          .get();

        if (!partnerAccountQuery.empty) {
          const partnerAccount = partnerAccountQuery.docs[0].data();
          apDeltas.push({
            partnerId,
            accountId: partnerAccount.id,
            accountName: partnerAccount.name,
            accountCode: partnerAccount.code,
            delta,
          });
        }
      }
    }

    // Create adjustment journal entry if needed
    let adjustmentEntryId: string | undefined;
    if (invoice.journalEntryId && (Math.abs(arDelta) >= 0.01 || apDeltas.length > 0 || Math.abs(revenueDelta) >= 0.01)) {
      // Get customer account
      const customerAccountQuery = await adminDb
        .collection(`tenants/${tenantId}/accounts`)
        .where('linkedEntityType', '==', 'customer')
        .where('linkedEntityId', '==', invoice.customerId)
        .limit(1)
        .get();

      if (customerAccountQuery.empty) {
        return { success: false, error: 'Customer account not found' };
      }

      const customerAccount = customerAccountQuery.docs[0].data();

      // Get revenue account
      const revenueAccountQuery = await adminDb
        .collection(`tenants/${tenantId}/accounts`)
        .where('code', '==', '4001')
        .where('isSystem', '==', true)
        .limit(1)
        .get();

      if (revenueAccountQuery.empty) {
        return { success: false, error: 'Revenue account not found' };
      }

      const revenueAccount = revenueAccountQuery.docs[0].data();

      // Create adjustment entry
      const adjustmentEntry = await createInvoiceAdjustmentEntry({
        tenantId,
        originalEntryId: invoice.journalEntryId,
        sourceId: invoiceId,
        description: `Invoice ${invoice.invoiceNumber} edited - Adjustment`,
        createdBy: user.uid,
        arDelta,
        apDeltas,
        revenueDelta,
        customerAccount: {
          id: customerAccount.id,
          name: customerAccount.name,
          code: customerAccount.code,
        },
        revenueAccount: {
          id: revenueAccount.id,
          name: revenueAccount.name,
          code: revenueAccount.code,
        },
      });

      if (adjustmentEntry) {
        adjustmentEntryId = adjustmentEntry.id;
      }
    }

    // Update partner pending commissions and total commissions
    for (const [partnerId, commissionDelta] of partnerCommissionDeltas) {
      if (Math.abs(commissionDelta) >= 0.01) {
        const partnerRef = adminDb.doc(`tenants/${tenantId}/partnerOffices/${partnerId}`);
        await partnerRef.update({
          pendingCommissions: FieldValue.increment(commissionDelta),
          totalCommissions: FieldValue.increment(commissionDelta),
          updatedAt: new Date(),
        });
      }
    }

    // Calculate new balance and determine status change
    let newStatus = invoice.status;
    let newBalance = newTotal - invoice.paidAmount;
    let overpaymentInfo: { amount: number } | undefined;

    if (invoice.status === 'paid') {
      if (newTotal > invoice.paidAmount) {
        // Total increased - now has outstanding balance
        newStatus = 'partial';
        newBalance = newTotal - invoice.paidAmount;
      } else if (newTotal < invoice.paidAmount) {
        // Total decreased - overpayment scenario
        overpaymentInfo = { amount: invoice.paidAmount - newTotal };
        // Status could remain 'paid' or become 'overpaid' - keeping as paid for now
        newBalance = newTotal - invoice.paidAmount; // Will be negative
      }
      // If newTotal === paidAmount, status stays 'paid', balance is 0
    } else if (invoice.status === 'partial') {
      // Recalculate balance
      newBalance = newTotal - invoice.paidAmount;
      if (newBalance <= 0) {
        newStatus = 'paid';
      }
    }

    // Update invoice
    const updatedInvoice: Record<string, any> = {
      lineItems: data.lineItems.map((item: any, index: number) => ({
        ...item,
        id: item.id || `${invoiceId}-${index}`,
        displayOrder: index,
      })),
      subtotal: newSubtotal,
      discount: newDiscount,
      discountPercentage: data.discountPercentage || 0,
      total: newTotal,
      balance: newBalance,
      totalCommissions: newTotalCommissions,
      commissionsByPartner: newCommissionsByPartner,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : invoice.invoiceDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
      notes: data.notes || '',
      attachments: data.attachments || [],
      status: newStatus,
      version: invoice.version + 1,
      updatedAt: new Date(),
    };

    if (adjustmentEntryId) {
      updatedInvoice.adjustmentJournalEntryIds = FieldValue.arrayUnion(adjustmentEntryId);
    }

    await invoiceRef.update(updatedInvoice);

    // Update customer balance if AR changed (invoice total changed)
    // AR delta positive = customer owes more = customer balance should increase
    // AR delta negative = customer owes less = customer balance should decrease
    if (Math.abs(arDelta) >= 0.01) {
      const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${invoice.customerId}`);
      await customerRef.update({
        balance: FieldValue.increment(arDelta),
        updatedAt: new Date(),
      });
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'invoice',
      resourceId: invoiceId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        action: 'edited',
        previousStatus: invoice.status,
        newStatus,
        totalChanged: invoice.total !== newTotal,
        previousTotal: invoice.total,
        newTotal,
        adjustmentEntryId,
        hasOverpayment: !!overpaymentInfo,
      }
    });

    revalidatePath('/[locale]/(dashboard)/invoices');
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);
    revalidatePath('/[locale]/(dashboard)/accounting/journal');

    // Refetch and serialize
    const refetchedDoc = await invoiceRef.get();
    const serializedInvoice = serializeInvoiceForClient(
      refetchedDoc.id,
      refetchedDoc.data() as Record<string, unknown>
    );

    return {
      success: true,
      data: overpaymentInfo
        ? { ...serializedInvoice, overpaymentInfo }
        : serializedInvoice
    };
  } catch (error) {
    console.error('Error editing invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to edit invoice'
    };
  }
}
