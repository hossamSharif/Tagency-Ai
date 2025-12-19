'use server';

// Payment server actions
// T132-T136 [US3] Payment actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { createAuditLog } from '@/lib/audit/create-log';
import {
  createCashPaymentSchema,
  createBankTransferPaymentSchema,
  approveBankTransferSchema,
  rejectBankTransferSchema,
  CreateCashPaymentInput,
  CreateBankTransferPaymentInput,
  ApproveBankTransferInput,
  RejectBankTransferInput,
} from '@/lib/validations/payments';
import { Payment, PaymentTransactionStatus } from '@/types/models/payment';
import { Invoice } from '@/types/models/invoice';
import { updateInvoicePaymentStatus } from './invoices';

/**
 * Generate payment number (e.g., "PAY-2024-0001")
 */
async function generatePaymentNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const payments = await adminDb
    .collection(`tenants/${tenantId}/payments`)
    .where('paymentNumber', '>=', prefix)
    .where('paymentNumber', '<', `PAY-${year + 1}-`)
    .orderBy('paymentNumber', 'desc')
    .limit(1)
    .get();

  if (payments.empty) {
    return `${prefix}0001`;
  }

  const lastNumber = payments.docs[0].data().paymentNumber;
  const lastSequence = parseInt(lastNumber.split('-')[2], 10);
  const newSequence = (lastSequence + 1).toString().padStart(4, '0');

  return `${prefix}${newSequence}`;
}

/**
 * Get total paid amount for an invoice
 */
async function getTotalPaidAmount(tenantId: string, invoiceId: string): Promise<number> {
  const payments = await adminDb
    .collection(`tenants/${tenantId}/payments`)
    .where('invoiceId', '==', invoiceId)
    .where('status', '==', 'completed')
    .get();

  return payments.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
}

/**
 * T132 [US3] Create cash payment
 */
export async function createPaymentAction(
  tenantId: string,
  userId: string,
  input: CreateCashPaymentInput
): Promise<ActionResult<Payment>> {
  try {
    const validatedData = createCashPaymentSchema.parse(input);

    // Get invoice
    const invoiceDoc = await adminDb
      .doc(`tenants/${tenantId}/invoices/${validatedData.invoiceId}`)
      .get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return { success: false, error: 'Cannot add payment to a paid or cancelled invoice' };
    }

    // Validate payment amount
    const currentPaid = await getTotalPaidAmount(tenantId, invoice.id);
    const maxPayable = invoice.total - currentPaid;

    if (validatedData.amount > maxPayable) {
      return { success: false, error: `Payment amount exceeds balance of ${maxPayable}` };
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(tenantId);

    // Create payment
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();

    const payment: Payment = {
      id: paymentRef.id,
      paymentNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: validatedData.amount,
      currency: invoice.currency,
      method: 'cash',
      status: 'completed',
      paymentDate: now,
      processedAt: now,
      notes: validatedData.notes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await paymentRef.set(payment);

    // Update invoice payment status
    const newPaidAmount = currentPaid + validatedData.amount;
    await updateInvoicePaymentStatus(tenantId, invoice.id, newPaidAmount);

    // Update customer balance
    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${invoice.customerId}`);
    const customerDoc = await customerRef.get();
    if (customerDoc.exists) {
      const customer = customerDoc.data();
      await customerRef.update({
        balance: (customer?.balance || 0) - validatedData.amount,
        updatedAt: now,
      });
    }

    // Update booking payment status
    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${invoice.bookingId}`);
    const bookingDoc = await bookingRef.get();
    if (bookingDoc.exists) {
      const booking = bookingDoc.data();
      const bookingPaidAmount = (booking?.paidAmount || 0) + validatedData.amount;
      const bookingBalance = (booking?.totalAmount || 0) - bookingPaidAmount;
      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
      if (bookingBalance <= 0) paymentStatus = 'paid';
      else if (bookingPaidAmount > 0) paymentStatus = 'partial';

      await bookingRef.update({
        paidAmount: bookingPaidAmount,
        balance: bookingBalance,
        paymentStatus,
        updatedAt: now,
      });
    }

    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'payment',
      resourceId: payment.id,
      description: `Created cash payment ${paymentNumber} for ${validatedData.amount}`,
    });

    revalidatePath(`/[locale]/(dashboard)/invoices/${invoice.id}`);
    revalidatePath(`/[locale]/(dashboard)/payments`);

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment',
    };
  }
}

/**
 * T133 [US3] Create Stripe checkout session
 */
export async function createStripeCheckoutAction(
  tenantId: string,
  userId: string,
  invoiceId: string,
  amount: number,
  successUrl: string,
  cancelUrl: string
): Promise<ActionResult<{ checkoutUrl: string; sessionId: string }>> {
  try {
    // Get invoice
    const invoiceDoc = await adminDb
      .doc(`tenants/${tenantId}/invoices/${invoiceId}`)
      .get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return { success: false, error: 'Cannot pay a paid or cancelled invoice' };
    }

    // Note: In a real implementation, you would use Stripe SDK here
    // This is a placeholder that shows the structure
    const stripe = await import('stripe').then((m) => new m.default(process.env.STRIPE_SECRET_KEY!));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        invoiceId,
        customerId: invoice.customerId,
      },
    });

    // Create pending payment record
    const paymentNumber = await generatePaymentNumber(tenantId);
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();

    const payment: Payment = {
      id: paymentRef.id,
      paymentNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount,
      currency: invoice.currency,
      method: 'stripe',
      status: 'pending',
      stripeCheckoutSessionId: session.id,
      paymentDate: now,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await paymentRef.set(payment);

    return {
      success: true,
      data: {
        checkoutUrl: session.url!,
        sessionId: session.id,
      },
    };
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

/**
 * T134 [US3] Upload bank transfer proof
 */
export async function uploadBankTransferProofAction(
  tenantId: string,
  userId: string,
  input: CreateBankTransferPaymentInput
): Promise<ActionResult<Payment>> {
  try {
    const validatedData = createBankTransferPaymentSchema.parse(input);

    // Get invoice
    const invoiceDoc = await adminDb
      .doc(`tenants/${tenantId}/invoices/${validatedData.invoiceId}`)
      .get();

    if (!invoiceDoc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return { success: false, error: 'Cannot pay a paid or cancelled invoice' };
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(tenantId);

    // Create pending payment
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();

    const payment: Payment = {
      id: paymentRef.id,
      paymentNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: validatedData.amount,
      currency: invoice.currency,
      method: 'bank_transfer',
      status: 'pending',
      bankTransfer: {
        transactionReference: validatedData.transactionReference,
        proofDocumentUrl: validatedData.proofDocumentUrl,
        bankName: validatedData.bankName,
      },
      paymentDate: now,
      notes: validatedData.notes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await paymentRef.set(payment);

    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'payment',
      resourceId: payment.id,
      description: `Submitted bank transfer proof for ${paymentNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/invoices/${invoice.id}`);
    revalidatePath(`/[locale]/(dashboard)/payments`);

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error uploading bank transfer proof:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload proof',
    };
  }
}

/**
 * T135 [US3] Approve bank transfer
 */
export async function approveBankTransferAction(
  tenantId: string,
  userId: string,
  input: ApproveBankTransferInput
): Promise<ActionResult<Payment>> {
  try {
    const validatedData = approveBankTransferSchema.parse(input);

    const paymentRef = adminDb.doc(`tenants/${tenantId}/payments/${validatedData.paymentId}`);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return { success: false, error: 'Payment not found' };
    }

    const payment = paymentDoc.data() as Payment;

    if (payment.method !== 'bank_transfer') {
      return { success: false, error: 'This is not a bank transfer payment' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: 'Payment is not pending approval' };
    }

    const now = Timestamp.now();

    // Update payment status
    const updateData: Partial<Payment> = {
      status: 'completed',
      processedAt: now,
      bankTransfer: {
        ...payment.bankTransfer!,
        reviewedBy: userId,
        reviewedAt: now,
      },
      updatedAt: now,
    };

    await paymentRef.update(updateData);

    // Update invoice payment status
    const currentPaid = await getTotalPaidAmount(tenantId, payment.invoiceId);
    await updateInvoicePaymentStatus(tenantId, payment.invoiceId, currentPaid + payment.amount);

    // Update customer and booking (similar to cash payment)
    const invoiceDoc = await adminDb.doc(`tenants/${tenantId}/invoices/${payment.invoiceId}`).get();
    if (invoiceDoc.exists) {
      const invoice = invoiceDoc.data() as Invoice;

      const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${invoice.customerId}`);
      const customerDoc = await customerRef.get();
      if (customerDoc.exists) {
        const customer = customerDoc.data();
        await customerRef.update({
          balance: (customer?.balance || 0) - payment.amount,
          updatedAt: now,
        });
      }

      const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${invoice.bookingId}`);
      const bookingDoc = await bookingRef.get();
      if (bookingDoc.exists) {
        const booking = bookingDoc.data();
        const bookingPaidAmount = (booking?.paidAmount || 0) + payment.amount;
        const bookingBalance = (booking?.totalAmount || 0) - bookingPaidAmount;
        let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
        if (bookingBalance <= 0) paymentStatus = 'paid';
        else if (bookingPaidAmount > 0) paymentStatus = 'partial';

        await bookingRef.update({
          paidAmount: bookingPaidAmount,
          balance: bookingBalance,
          paymentStatus,
          updatedAt: now,
        });
      }
    }

    await createAuditLog({
      tenantId,
      userId,
      action: 'status_change',
      resource: 'payment',
      resourceId: payment.id,
      description: `Approved bank transfer ${payment.paymentNumber}`,
      changes: [{ field: 'status', oldValue: 'pending', newValue: 'completed' }],
    });

    revalidatePath(`/[locale]/(dashboard)/payments`);
    revalidatePath(`/[locale]/(dashboard)/invoices/${payment.invoiceId}`);

    return { success: true, data: { ...payment, ...updateData } as Payment };
  } catch (error) {
    console.error('Error approving bank transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve payment',
    };
  }
}

/**
 * T136 [US3] Reject bank transfer
 */
export async function rejectBankTransferAction(
  tenantId: string,
  userId: string,
  input: RejectBankTransferInput
): Promise<ActionResult<Payment>> {
  try {
    const validatedData = rejectBankTransferSchema.parse(input);

    const paymentRef = adminDb.doc(`tenants/${tenantId}/payments/${validatedData.paymentId}`);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return { success: false, error: 'Payment not found' };
    }

    const payment = paymentDoc.data() as Payment;

    if (payment.method !== 'bank_transfer') {
      return { success: false, error: 'This is not a bank transfer payment' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: 'Payment is not pending approval' };
    }

    const now = Timestamp.now();

    const updateData: Partial<Payment> = {
      status: 'failed',
      processedAt: now,
      bankTransfer: {
        ...payment.bankTransfer!,
        reviewedBy: userId,
        reviewedAt: now,
        rejectionReason: validatedData.rejectionReason,
      },
      updatedAt: now,
    };

    await paymentRef.update(updateData);

    await createAuditLog({
      tenantId,
      userId,
      action: 'status_change',
      resource: 'payment',
      resourceId: payment.id,
      description: `Rejected bank transfer ${payment.paymentNumber}: ${validatedData.rejectionReason}`,
      changes: [{ field: 'status', oldValue: 'pending', newValue: 'failed' }],
    });

    revalidatePath(`/[locale]/(dashboard)/payments`);

    return { success: true, data: { ...payment, ...updateData } as Payment };
  } catch (error) {
    console.error('Error rejecting bank transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject payment',
    };
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentAction(
  tenantId: string,
  paymentId: string
): Promise<ActionResult<Payment>> {
  try {
    const paymentDoc = await adminDb
      .doc(`tenants/${tenantId}/payments/${paymentId}`)
      .get();

    if (!paymentDoc.exists) {
      return { success: false, error: 'Payment not found' };
    }

    return { success: true, data: paymentDoc.data() as Payment };
  } catch (error) {
    console.error('Error getting payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment',
    };
  }
}
