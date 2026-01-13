// Payment type definition per data-model.md
// T125 [US3] Create Payment type definition
// T006 [P] Extended with partner payment fields

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';
import { Attachment } from './expense';

export type PaymentType = 'customer_receipt' | 'partner_payment';
export type PaymentMethod = 'cash' | 'bank' | 'stripe' | 'bank_transfer';
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface BankTransferDetails {
  transactionReference: string;
  proofDocumentUrl: string;
  bankName?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}

export interface Payment {
  // Identity
  id: string;
  paymentNumber: string;

  // Payment Type
  paymentType: PaymentType;

  // Parties
  // For customer_receipt:
  customerId?: string;
  customerName?: string;
  invoiceId?: string;

  // For partner_payment:
  partnerId?: string;
  partnerName?: string;
  invoiceIds?: string[];

  // Amount
  amount: number;
  currency: CurrencyCode;

  // For partner payments: commission breakdown
  grossAmount?: number;
  commissionAmount?: number;
  netAmount?: number;

  // Method
  method: PaymentMethod;
  accountId: string;
  accountName: string;

  // Reference
  transactionReference?: string;

  // Status
  status: PaymentTransactionStatus;

  // Stripe (if applicable)
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCheckoutSessionId?: string;

  // Bank Transfer (if applicable)
  bankTransfer?: BankTransferDetails;

  // Attachments (receipts, proofs)
  attachments?: Attachment[];

  // Notes
  notes?: string;

  // Accounting Reference
  journalEntryId?: string;

  // Dates
  paymentDate: Timestamp;
  processedAt?: Timestamp;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating customer payment
export type CreateCustomerPaymentInput = {
  paymentType: 'customer_receipt';
  customerId: string;
  customerName: string;
  invoiceId?: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  accountId: string;
  accountName: string;
  transactionReference?: string;
  attachments?: Attachment[];
  notes?: string;
};

// Helper type for creating partner payment
export type CreatePartnerPaymentInput = {
  paymentType: 'partner_payment';
  partnerId: string;
  partnerName: string;
  invoiceIds?: string[];
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  accountId: string;
  accountName: string;
  transactionReference?: string;
  attachments?: Attachment[];
  notes?: string;
};

// Helper type for creating cash payment (legacy)
export type CreateCashPaymentInput = {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: CurrencyCode;
  notes?: string;
};

// Helper type for creating bank transfer payment (legacy)
export type CreateBankTransferInput = {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: CurrencyCode;
  transactionReference: string;
  proofDocumentUrl: string;
  bankName?: string;
  notes?: string;
};

// Helper type for Stripe checkout (legacy)
export type CreateStripeCheckoutInput = {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: CurrencyCode;
  successUrl: string;
  cancelUrl: string;
};

// Helper type for approving bank transfer
export type ApproveBankTransferInput = {
  paymentId: string;
  reviewedBy: string;
};

// Helper type for rejecting bank transfer
export type RejectBankTransferInput = {
  paymentId: string;
  reviewedBy: string;
  rejectionReason: string;
};
