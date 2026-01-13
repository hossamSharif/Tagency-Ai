'use server';

// Payment server actions
// T132-T136 [US3] Payment actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { createAuditLog } from '@/lib/audit/create-log';
import { getSessionUser } from '@/lib/auth/require-role';
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
import { CurrencyCode } from '@/types/models/tenant';
import { updateInvoicePaymentStatus } from './invoices';
import {
  triggerPaymentReceivedNotification,
  triggerPaymentApprovedNotification,
  triggerPaymentRejectedNotification,
} from '@/lib/notifications/triggers';

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
 * Create customer payment (wrapper that gets user from session)
 */
export async function createCustomerPayment(
  input: CreateCashPaymentInput
): Promise<ActionResult<Payment>> {
  try {
    const user = await getSessionUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    return await createPaymentAction(user.tenantId, user.uid, input);
  } catch (error) {
    console.error('Error creating customer payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment',
    };
  }
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
    console.log('[createPaymentAction] Input received:', {
      invoiceId: input.invoiceId,
      amount: input.amount,
      accountId: input.accountId,
      method: input.method,
    });

    const validatedData = createCashPaymentSchema.parse(input);

    console.log('[createPaymentAction] After validation:', {
      invoiceId: validatedData.invoiceId,
      amount: validatedData.amount,
      accountId: validatedData.accountId,
      method: validatedData.method,
    });

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

    // Get account information from validated data
    const accountId = validatedData.accountId;
    const accountName = validatedData.accountName || 'Cash';

    console.log('[createPaymentAction] Account info:', {
      tenantId,
      accountId,
      accountName,
      accountPath: `tenants/${tenantId}/accounts/${accountId}`
    });

    // Create payment
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();

    // Note: Using admin SDK types which are compatible at runtime but differ in TypeScript definitions
    const payment = {
      id: paymentRef.id,
      paymentNumber,
      paymentType: 'customer_receipt' as const,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: validatedData.amount,
      currency: invoice.currency,
      method: validatedData.method || 'cash',
      accountId,
      accountName,
      status: 'completed' as const,
      paymentDate: now,
      processedAt: now,
      ...(validatedData.notes && { notes: validatedData.notes }),
      ...(validatedData.transactionReference && { transactionReference: validatedData.transactionReference }),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Payment;

    // Create journal entry for customer payment
    // Debit: Cash/Bank account (increase asset)
    // Credit: Accounts Receivable - Customer (decrease asset)
    const { createJournalEntry, createSimpleEntry } = await import('@/lib/accounting/journal-entries');

    // Get payment account
    const paymentAccount = await adminDb.doc(`tenants/${tenantId}/accounts/${accountId}`).get();
    if (!paymentAccount.exists) {
      return {
        success: false,
        error: `Payment account with ID '${accountId}' not found. Please select a valid cash or bank account.`
      };
    }

    // Get or create customer receivable account
    // Use linkedEntityType and linkedEntityId for consistency with createCustomerAccount()
    const customerAccounts = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', invoice.customerId)
      .limit(1)
      .get();

    let customerAccountData;
    if (!customerAccounts.empty) {
      customerAccountData = customerAccounts.docs[0].data();
    } else {
      // Create customer receivable account if not exists
      // Use consistent field names with createCustomerAccount() in default-accounts.ts
      const arAccountRef = adminDb.collection(`tenants/${tenantId}/accounts`).doc();

      // Generate proper account code (sequential 2xxx series)
      const lastCustomerAccount = await adminDb
        .collection(`tenants/${tenantId}/accounts`)
        .where('type', '==', 'asset')
        .where('subtype', '==', 'receivable')
        .orderBy('code', 'desc')
        .limit(1)
        .get();

      let nextCode = 2001;
      if (!lastCustomerAccount.empty) {
        const lastCode = parseInt(lastCustomerAccount.docs[0].data().code);
        if (!isNaN(lastCode) && lastCode >= 2000) {
          nextCode = lastCode + 1;
        }
      }

      customerAccountData = {
        id: arAccountRef.id,
        code: nextCode.toString(),
        name: `Accounts Receivable - ${invoice.customerName}`,
        nameAr: `حسابات القبض - ${invoice.customerName}`,
        type: 'asset',
        subtype: 'receivable',
        linkedEntityType: 'customer',
        linkedEntityId: invoice.customerId,
        balance: 0,
        currency: invoice.currency,
        isSystem: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await arAccountRef.set(customerAccountData);
    }

    const journalLines = createSimpleEntry(
      {
        id: paymentAccount.id,
        name: paymentAccount.data()?.name || accountName,
        code: paymentAccount.data()?.code || accountId,
      },
      {
        id: customerAccountData.id,
        name: customerAccountData.name,
        code: customerAccountData.code,
      },
      validatedData.amount
    );

    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Customer payment ${paymentNumber} from ${invoice.customerName} for invoice ${invoice.invoiceNumber}`,
      type: 'customer_payment',
      lines: journalLines,
      sourceType: 'payment',
      sourceId: paymentRef.id,
      createdBy: userId,
      date: now.toDate(),
    });

    // Link journal entry to payment
    payment.journalEntryId = journalEntry.id;

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

    // Update booking payment status (only if invoice has a booking)
    if (invoice.bookingId) {
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
    }

    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'payment',
      resourceId: payment.id,
      description: `Created cash payment ${paymentNumber} for ${validatedData.amount}`,
    });

    // Trigger payment received notification for the customer
    try {
      await triggerPaymentReceivedNotification(tenantId, invoice.customerId, {
        paymentNumber,
        amount: validatedData.amount,
        currency: invoice.currency,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
      });
    } catch (notificationError) {
      console.error('Failed to send payment notification:', notificationError);
      // Don't fail the action if notification fails
    }

    revalidatePath(`/[locale]/(dashboard)/invoices/${invoice.id}`);
    revalidatePath(`/[locale]/(dashboard)/payments`);

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const serializedPayment = serializePayment(payment);

    return { success: true, data: serializedPayment };
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

    const payment = {
      id: paymentRef.id,
      paymentNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount,
      currency: invoice.currency,
      method: 'stripe' as const,
      status: 'pending' as const,
      stripeCheckoutSessionId: session.id,
      paymentDate: now,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Payment;

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

    const payment = {
      id: paymentRef.id,
      paymentNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: validatedData.amount,
      currency: invoice.currency,
      method: 'bank_transfer' as const,
      status: 'pending' as const,
      bankTransfer: {
        transactionReference: validatedData.transactionReference,
        proofDocumentUrl: validatedData.proofDocumentUrl,
        bankName: validatedData.bankName,
      },
      paymentDate: now,
      ...(validatedData.notes && { notes: validatedData.notes }),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Payment;

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

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const serializedPayment = serializePayment(payment);

    return { success: true, data: serializedPayment };
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
    const updateData = {
      status: 'completed' as const,
      processedAt: now,
      bankTransfer: {
        ...payment.bankTransfer!,
        reviewedBy: userId,
        reviewedAt: now,
      },
      updatedAt: now,
    };

    await paymentRef.update(updateData);

    // Update invoice payment status (if payment has invoice)
    if (payment.invoiceId) {
      const currentPaid = await getTotalPaidAmount(tenantId, payment.invoiceId);
      await updateInvoicePaymentStatus(tenantId, payment.invoiceId, currentPaid + payment.amount);
    }

    // Update customer and booking (similar to cash payment)
    const invoiceDoc = payment.invoiceId ? await adminDb.doc(`tenants/${tenantId}/invoices/${payment.invoiceId}`).get() : null;
    if (invoiceDoc?.exists) {
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

    // Trigger payment approved notification for the customer
    if (payment.customerId && payment.invoiceId) {
      try {
        await triggerPaymentApprovedNotification(tenantId, payment.customerId, {
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          currency: payment.currency,
          invoiceId: payment.invoiceId,
        });
      } catch (notificationError) {
        console.error('Failed to send payment approved notification:', notificationError);
      }
    }

    revalidatePath(`/[locale]/(dashboard)/payments`);
    if (payment.invoiceId) {
      revalidatePath(`/[locale]/(dashboard)/invoices/${payment.invoiceId}`);
    }

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const mergedPayment = { ...payment, ...updateData } as Payment;
    const serializedPayment = serializePayment(mergedPayment);

    return { success: true, data: serializedPayment };
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

    const updateData = {
      status: 'failed' as const,
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

    // Trigger payment rejected notification for the customer
    if (payment.customerId && payment.invoiceId) {
      try {
        await triggerPaymentRejectedNotification(tenantId, payment.customerId, {
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          currency: payment.currency,
          rejectionReason: validatedData.rejectionReason,
          invoiceId: payment.invoiceId,
        });
      } catch (notificationError) {
        console.error('Failed to send payment rejected notification:', notificationError);
      }
    }

    revalidatePath(`/[locale]/(dashboard)/payments`);

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const mergedPayment = { ...payment, ...updateData } as Payment;
    const serializedPayment = serializePayment(mergedPayment);

    return { success: true, data: serializedPayment };
  } catch (error) {
    console.error('Error rejecting bank transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject payment',
    };
  }
}

/**
 * Serialize Payment object for client component consumption
 * Converts Firestore Timestamps to ISO strings
 */
function serializePayment(data: any): Payment {
  const payment = { ...data };

  // Convert Timestamp objects to ISO strings
  if (payment.paymentDate?._seconds !== undefined) {
    payment.paymentDate = new Date(payment.paymentDate._seconds * 1000 + payment.paymentDate._nanoseconds / 1000000).toISOString();
  } else if (payment.paymentDate?.toDate) {
    payment.paymentDate = payment.paymentDate.toDate().toISOString();
  }

  if (payment.processedAt?._seconds !== undefined) {
    payment.processedAt = new Date(payment.processedAt._seconds * 1000 + payment.processedAt._nanoseconds / 1000000).toISOString();
  } else if (payment.processedAt?.toDate) {
    payment.processedAt = payment.processedAt.toDate().toISOString();
  }

  if (payment.createdAt?._seconds !== undefined) {
    payment.createdAt = new Date(payment.createdAt._seconds * 1000 + payment.createdAt._nanoseconds / 1000000).toISOString();
  } else if (payment.createdAt?.toDate) {
    payment.createdAt = payment.createdAt.toDate().toISOString();
  }

  if (payment.updatedAt?._seconds !== undefined) {
    payment.updatedAt = new Date(payment.updatedAt._seconds * 1000 + payment.updatedAt._nanoseconds / 1000000).toISOString();
  } else if (payment.updatedAt?.toDate) {
    payment.updatedAt = payment.updatedAt.toDate().toISOString();
  }

  // Handle nested bankTransfer.reviewedAt
  if (payment.bankTransfer?.reviewedAt) {
    if (payment.bankTransfer.reviewedAt._seconds !== undefined) {
      payment.bankTransfer.reviewedAt = new Date(payment.bankTransfer.reviewedAt._seconds * 1000 + payment.bankTransfer.reviewedAt._nanoseconds / 1000000).toISOString();
    } else if (payment.bankTransfer.reviewedAt.toDate) {
      payment.bankTransfer.reviewedAt = payment.bankTransfer.reviewedAt.toDate().toISOString();
    }
  }

  return payment as Payment;
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

    const paymentData = paymentDoc.data();
    const serializedPayment = serializePayment(paymentData);

    return { success: true, data: serializedPayment };
  } catch (error) {
    console.error('Error getting payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment',
    };
  }
}

/**
 * T048 [US3] Record customer payment (service-based invoices)
 * Records a payment received from a customer against an invoice or account balance
 * Creates journal entry and updates invoice status
 */
export async function recordCustomerPaymentAction(
  tenantId: string,
  userId: string,
  data: {
    customerId: string;
    customerName: string;
    invoiceId?: string;
    amount: number;
    method: 'cash' | 'bank';
    accountId: string;
    accountName: string;
    paymentDate?: Date;
    transactionReference?: string;
    notes?: string;
  }
): Promise<ActionResult<Payment>> {
  try {
    const { createJournalEntry, createSimpleEntry } = await import('@/lib/accounting/journal-entries');
    // CurrencyCode is imported at the top of the file

    // Get tenant currency (simplified - in production, fetch from tenant settings)
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    // Validate invoice if provided
    let invoice = null;
    if (data.invoiceId) {
      const invoiceDoc = await adminDb
        .doc(`tenants/${tenantId}/invoices/${data.invoiceId}`)
        .get();

      if (!invoiceDoc.exists) {
        return { success: false, error: 'Invoice not found' };
      }

      invoice = invoiceDoc.data() as Invoice;

      if (['paid', 'cancelled'].includes(invoice.status)) {
        return { success: false, error: 'Cannot add payment to a paid or cancelled invoice' };
      }

      // Validate payment amount doesn't exceed balance
      const balance = invoice.balance || 0;
      if (data.amount > balance) {
        return { success: false, error: `Payment amount exceeds invoice balance of ${balance}` };
      }
    }

    // Get payment account
    const paymentAccountDoc = await adminDb
      .doc(`tenants/${tenantId}/accounts/${data.accountId}`)
      .get();

    if (!paymentAccountDoc.exists) {
      return {
        success: false,
        error: 'Payment account not found. Please ensure Cash or Bank accounts are set up in your workspace.'
      };
    }

    const paymentAccount = paymentAccountDoc.data()!;

    // Get customer receivable account
    const customerAccountsQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', data.customerId)
      .limit(1)
      .get();

    if (customerAccountsQuery.empty) {
      return { success: false, error: 'Customer account not found' };
    }

    const customerAccount = customerAccountsQuery.docs[0].data()!;

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(tenantId);

    // Create payment record
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();
    const paymentDate = data.paymentDate ? Timestamp.fromDate(data.paymentDate) : now;

    const payment = {
      id: paymentRef.id,
      paymentNumber,
      paymentType: 'customer_receipt' as const,
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceId: data.invoiceId,
      amount: data.amount,
      currency: currency as CurrencyCode,
      method: data.method,
      accountId: data.accountId,
      accountName: data.accountName,
      ...(data.transactionReference && { transactionReference: data.transactionReference }),
      status: 'completed' as const,
      paymentDate,
      processedAt: now,
      ...(data.notes && { notes: data.notes }),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Payment;

    // T049 [US3] Create journal entry for customer payment
    // Debit: Cash/Bank account (increase asset)
    // Credit: Customer Receivable account (decrease asset)
    const journalLines = createSimpleEntry(
      {
        id: paymentAccount.id,
        name: paymentAccount.name,
        code: paymentAccount.code,
      },
      {
        id: customerAccount.id,
        name: customerAccount.name,
        code: customerAccount.code,
      },
      data.amount
    );

    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Customer payment ${paymentNumber} from ${data.customerName}${data.invoiceId ? ` for invoice ${data.invoiceId}` : ''}`,
      type: 'customer_payment',
      lines: journalLines,
      sourceType: 'payment',
      sourceId: paymentRef.id,
      createdBy: userId,
      date: data.paymentDate,
    });

    // Link journal entry to payment
    payment.journalEntryId = journalEntry.id;

    // Save payment
    await paymentRef.set(payment);

    // T050 [US3] Update invoice status if invoice payment
    if (data.invoiceId && invoice) {
      const newPaidAmount = (invoice.paidAmount || 0) + data.amount;
      const newBalance = invoice.total - newPaidAmount;

      let newStatus: 'issued' | 'partial' | 'paid' = 'issued';
      if (newBalance <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      await adminDb.doc(`tenants/${tenantId}/invoices/${data.invoiceId}`).update({
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
        paidDate: newStatus === 'paid' ? now : null,
        updatedAt: now,
      });
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'payment',
      resourceId: payment.id,
      description: `Recorded customer payment ${paymentNumber} for ${data.amount} ${currency}`,
    });

    revalidatePath(`/[locale]/(dashboard)/payments`);
    if (data.invoiceId) {
      revalidatePath(`/[locale]/(dashboard)/invoices/${data.invoiceId}`);
    }
    revalidatePath(`/[locale]/(dashboard)/customers/${data.customerId}`);

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const serializedPayment = serializePayment(payment);

    return { success: true, data: serializedPayment };
  } catch (error) {
    console.error('Error recording customer payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment',
    };
  }
}

/**
 * T048 [US3] Get customer balance from account
 */
export async function getCustomerBalanceAction(
  tenantId: string,
  customerId: string
): Promise<ActionResult<{ balance: number; currency: string }>> {
  try {
    // Get customer account
    const accountsQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', customerId)
      .limit(1)
      .get();

    if (accountsQuery.empty) {
      return { success: false, error: 'Customer account not found' };
    }

    const account = accountsQuery.docs[0].data();

    // Get tenant currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    return {
      success: true,
      data: {
        balance: account.balance || 0,
        currency,
      },
    };
  } catch (error) {
    console.error('Error getting customer balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

/**
 * T055 [US4] Record partner payment with commission deduction
 */
export async function recordPartnerPaymentAction(
  tenantId: string,
  userId: string,
  data: {
    partnerId: string;
    partnerName: string;
    invoiceIds?: string[];
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    method: 'cash' | 'bank';
    accountId: string;
    accountName: string;
    paymentDate?: Date;
    transactionReference?: string;
    notes?: string;
  }
): Promise<ActionResult<Payment>> {
  try {
    const { createJournalEntry } = await import('@/lib/accounting/journal-entries');
    // CurrencyCode is imported at the top of the file

    // Get tenant currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    // Validate invoices if provided
    if (data.invoiceIds && data.invoiceIds.length > 0) {
      for (const invoiceId of data.invoiceIds) {
        const invoiceDoc = await adminDb
          .doc(`tenants/${tenantId}/invoices/${invoiceId}`)
          .get();

        if (!invoiceDoc.exists) {
          return { success: false, error: `Invoice ${invoiceId} not found` };
        }

        const invoice = invoiceDoc.data();
        if (invoice?.status === 'cancelled') {
          return { success: false, error: `Cannot settle cancelled invoice ${invoiceId}` };
        }
      }
    }

    // Get payment account (cash or bank)
    const paymentAccountDoc = await adminDb
      .doc(`tenants/${tenantId}/accounts/${data.accountId}`)
      .get();

    if (!paymentAccountDoc.exists) {
      return {
        success: false,
        error: 'Payment account not found. Please ensure Cash or Bank accounts are set up in your workspace.'
      };
    }

    const paymentAccount = paymentAccountDoc.data()!;

    // Get partner payable account
    const partnerAccountsQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', data.partnerId)
      .limit(1)
      .get();

    if (partnerAccountsQuery.empty) {
      return { success: false, error: 'Partner account not found' };
    }

    const partnerAccount = partnerAccountsQuery.docs[0].data()!;

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(tenantId);

    // Create payment record
    const paymentRef = adminDb.collection(`tenants/${tenantId}/payments`).doc();
    const now = Timestamp.now();
    const paymentDate = data.paymentDate ? Timestamp.fromDate(data.paymentDate) : now;

    const payment = {
      id: paymentRef.id,
      paymentNumber,
      paymentType: 'partner_payment' as const,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      invoiceIds: data.invoiceIds,
      amount: data.netAmount, // The actual amount paid out
      grossAmount: data.grossAmount,
      commissionAmount: data.commissionAmount,
      netAmount: data.netAmount,
      currency: currency as CurrencyCode,
      method: data.method,
      accountId: data.accountId,
      accountName: data.accountName,
      ...(data.transactionReference && { transactionReference: data.transactionReference }),
      status: 'completed' as const,
      paymentDate,
      processedAt: now,
      ...(data.notes && { notes: data.notes }),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Payment;

    // T057 [US4] Create journal entry for partner payment
    // CORRECTED: Simple 2-line entry since commission was already recorded at invoice creation
    // The AP balance represents the NET amount we owe the partner (gross - commission)
    // Debit: Partner Payable account (decrease liability) - net amount we owe
    // Credit: Cash/Bank account (decrease asset) - net amount paid

    const journalLines = [
      {
        accountId: partnerAccount.id,
        accountName: partnerAccount.name,
        accountCode: partnerAccount.code,
        debit: data.netAmount,  // Clear the net liability (what we actually owe)
        credit: 0,
      },
      {
        accountId: paymentAccount.id,
        accountName: paymentAccount.name,
        accountCode: paymentAccount.code,
        debit: 0,
        credit: data.netAmount,  // Cash paid out
      },
    ];

    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Partner payment ${paymentNumber} to ${data.partnerName} (Net: ${data.netAmount})`,
      type: 'partner_payment',
      lines: journalLines,
      sourceType: 'payment',
      sourceId: paymentRef.id,
      createdBy: userId,
      date: data.paymentDate,
    });

    // Link journal entry to payment
    payment.journalEntryId = journalEntry.id;

    // Save payment
    await paymentRef.set(payment);

    // T059 [US4] Update invoice commission status when partner is paid
    if (data.invoiceIds && data.invoiceIds.length > 0) {
      for (const invoiceId of data.invoiceIds) {
        const invoiceRef = adminDb.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
        const invoiceDoc = await invoiceRef.get();

        if (invoiceDoc.exists) {
          const invoice = invoiceDoc.data();

          // Update commission status for this partner
          if (invoice?.commissionsByPartner) {
            const updatedCommissions = invoice.commissionsByPartner.map((c: any) => {
              if (c.partnerId === data.partnerId && c.status === 'pending') {
                return {
                  ...c,
                  status: 'settled',
                  settlementId: payment.id,
                };
              }
              return c;
            });

            await invoiceRef.update({
              commissionsByPartner: updatedCommissions,
              updatedAt: now,
            });
          }
        }
      }
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'payment',
      resourceId: payment.id,
      description: `Recorded partner payment ${paymentNumber} for ${data.netAmount} ${currency} (commission: ${data.commissionAmount})`,
    });

    revalidatePath(`/[locale]/(dashboard)/payments`);
    if (data.invoiceIds) {
      data.invoiceIds.forEach(invoiceId => {
        revalidatePath(`/[locale]/(dashboard)/invoices/${invoiceId}`);
      });
    }
    revalidatePath(`/[locale]/(dashboard)/partners/${data.partnerId}`);

    // Serialize payment to convert Timestamp objects to ISO strings for client
    const serializedPayment = serializePayment(payment);

    return { success: true, data: serializedPayment };
  } catch (error) {
    console.error('Error recording partner payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record partner payment',
    };
  }
}

/**
 * T056 [US4] Get partner balance from account
 */
export async function getPartnerBalanceAction(
  tenantId: string,
  partnerId: string
): Promise<ActionResult<{ balance: number; currency: string }>> {
  try {
    // Get partner account
    const accountsQuery = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', partnerId)
      .limit(1)
      .get();

    if (accountsQuery.empty) {
      return { success: false, error: 'Partner account not found' };
    }

    const account = accountsQuery.docs[0].data();

    // Get tenant currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    return {
      success: true,
      data: {
        balance: account.balance || 0,
        currency,
      },
    };
  } catch (error) {
    console.error('Error getting partner balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get partner balance',
    };
  }
}

/**
 * Serialize Account object for client component consumption
 * Converts Firestore Timestamps to ISO strings
 */
function serializeAccount(data: any): any {
  const account = { ...data };

  // Convert Timestamp objects to ISO strings
  if (account.lastUpdated?._seconds !== undefined) {
    account.lastUpdated = new Date(account.lastUpdated._seconds * 1000).toISOString();
  } else if (account.lastUpdated?.toDate) {
    account.lastUpdated = account.lastUpdated.toDate().toISOString();
  }

  if (account.createdAt?._seconds !== undefined) {
    account.createdAt = new Date(account.createdAt._seconds * 1000).toISOString();
  } else if (account.createdAt?.toDate) {
    account.createdAt = account.createdAt.toDate().toISOString();
  }

  if (account.updatedAt?._seconds !== undefined) {
    account.updatedAt = new Date(account.updatedAt._seconds * 1000).toISOString();
  } else if (account.updatedAt?.toDate) {
    account.updatedAt = account.updatedAt.toDate().toISOString();
  }

  return account;
}

/**
 * Get payment accounts (cash and bank accounts for payment recording)
 */
export async function getPaymentAccountsAction(
  tenantId: string
): Promise<ActionResult<any[]>> {
  try {
    // Fetch all active accounts and filter in JS to avoid compound query index issues
    const accountsSnapshot = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('isActive', '==', true)
      .get();

    const accounts = accountsSnapshot.docs
      .map((doc) => serializeAccount({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((acc: any) => acc.subtype === 'cash' || acc.subtype === 'bank');

    return {
      success: true,
      data: accounts,
    };
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment accounts',
    };
  }
}
