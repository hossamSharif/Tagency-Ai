'use server';

// Invoice server actions
// T128-T131 [US3] Invoice actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase/firestore';
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
    const lineItems: InvoiceLineItem[] = booking.packageSnapshot.services.map((service, index) => {
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
      entityType: 'invoice',
      entityId: invoice.id,
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
      entityType: 'invoice',
      entityId: invoiceId,
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
      entityType: 'invoice',
      entityId: invoiceId,
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
      entityType: 'invoice',
      entityId: invoiceId,
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
