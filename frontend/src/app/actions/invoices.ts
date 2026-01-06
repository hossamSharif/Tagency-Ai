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
import { Booking } from '@/types/models/booking';
import { Customer } from '@/types/models/customer';

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
    const lineItems = booking.packageSnapshot.services.map((service, index) => {
      const quantity = booking.travelers.length;
      const total = service.price * quantity;
      const commissionAmount = service.isOutsourced && service.commissionPercentage
        ? calculateCommission(total, service.commissionPercentage)
        : 0;

      return {
        id: `item_${index + 1}`,
        serviceId: service.id,
        description: service.name,
        quantity,
        unitPrice: service.price,
        total,
        isOutsourced: service.isOutsourced,
        partnerOfficeId: service.partnerOfficeId,
        partnerOfficeName: service.partnerOfficeName,
        commissionPercentage: service.commissionPercentage,
        commissionAmount,
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

    partnerCommissions.forEach((value, partnerId) => {
      commissionsByPartner.push({
        partnerOfficeId: partnerId,
        partnerOfficeName: value.name,
        totalAmount: value.amount,
        status: 'pending',
      });
    });

    const totalCommissions = commissionsByPartner.reduce((sum, c) => sum + c.totalAmount, 0);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Create invoice
    const invoiceRef = adminDb.collection(`tenants/${tenantId}/invoices`).doc();
    const now = Timestamp.now();

    const invoice: Invoice = {
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
      issueDate: now,
      dueDate: Timestamp.fromDate(new Date(validatedData.dueDate)),
      notes: validatedData.notes,
      terms: validatedData.terms,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

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
        : validatedData.tax ?? existingInvoice.tax;

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
    const updateData: Partial<Invoice> = {
      status: 'issued',
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
    const updateData: Partial<Invoice> = {
      status: 'cancelled',
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
 * T039 [US1] Create a service-based invoice (draft status)
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

    // Create invoice
    const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${adminDb.collection('dummy').doc().id}`);
    const now = new Date();

    const invoice: Invoice = {
      id: invoiceRef.id,
      invoiceNumber,
      customerId: customer.id!,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      lineItems: data.lineItems.map((item: any, index: number) => ({
        ...item,
        id: `${invoiceRef.id}-${index}`,
        displayOrder: index
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      discountPercentage: data.discountPercentage || 0,
      total: data.total,
      currency,
      totalCommissions: data.totalCommissions,
      commissionsByPartner: data.commissionsByPartner || [],
      status: 'draft',
      paidAmount: 0,
      balance: data.total,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : now,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || '',
      attachments: data.attachments || [],
      version: 1,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now
    } as any;

    await invoiceRef.set(invoice);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'invoice',
      resourceId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber, status: 'draft' }
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
        error: 'VERSION_CONFLICT',
        data: { message: 'Invoice was modified by another user. Please reload.' }
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
      updatedAt: new Date()
    };

    await invoiceRef.update(updatedInvoice);

    revalidatePath('/[locale]/(dashboard)/invoices');
    revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);

    return { success: true, data: updatedInvoice as Invoice };
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

    // T040 - Create journal entry for double-entry accounting
    // Debit: Customer Account (Receivable) - increases asset
    // Credit: Service Revenue - increases income

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

    // Create journal entry
    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Invoice ${invoice.invoiceNumber} issued to ${invoice.customerName}`,
      type: 'invoice_created',
      lines: [
        {
          accountId: customerAccount.id,
          accountName: customerAccount.name,
          accountCode: customerAccount.code,
          debit: invoice.total,
          credit: 0
        },
        {
          accountId: revenueAccount.id,
          accountName: revenueAccount.name,
          accountCode: revenueAccount.code,
          debit: 0,
          credit: invoice.total
        }
      ],
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
        if (commission.partnerOfficeId && commission.totalAmount > 0) {
          const partnerRef = adminDb.doc(
            `tenants/${tenantId}/partnerOffices/${commission.partnerOfficeId}`
          );

          await partnerRef.update({
            pendingCommissions: FieldValue.increment(commission.totalAmount),
            totalCommissionsEarned: FieldValue.increment(commission.totalAmount),
            updatedAt: new Date()
          });
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

    return {
      success: true,
      data: { ...invoice, status: 'issued', journalEntryId: journalEntry.id } as Invoice
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
          action: 'error',
          resource: 'invoice',
          resourceId: invoice.id,
          details: {
            error: 'Failed to create reversal journal entry',
            message: error instanceof Error ? error.message : 'Unknown error',
            invoiceNumber: invoice.invoiceNumber
          }
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
    const updatedInvoice = { id: updatedInvoiceDoc.id, ...updatedInvoiceDoc.data() } as Invoice;

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
    const invoicesSnapshot = await adminDb
      .collection(`tenants/${tenantId}/invoices`)
      .where('status', '==', 'issued')
      .get();

    const invoices: InvoiceWithCommission[] = [];

    invoicesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const commissionsByPartner = data.commissionsByPartner || [];

      // Find this partner's commission
      const partnerCommission = commissionsByPartner.find(
        (c: any) => c.partnerOfficeId === partnerId && c.status === 'pending'
      );

      if (partnerCommission) {
        // Calculate gross amount from line items for this partner
        const grossAmount = (data.lineItems || [])
          .filter((item: any) => item.partnerOfficeId === partnerId)
          .reduce((sum: number, item: any) => sum + (item.total || 0), 0);

        const commissionPercentage = grossAmount > 0
          ? (partnerCommission.totalAmount / grossAmount) * 100
          : 0;

        invoices.push({
          invoiceId: doc.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate?.toDate() || data.invoiceDate || new Date(),
          commissionAmount: partnerCommission.totalAmount,
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
