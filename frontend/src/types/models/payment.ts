// Payment type definition per data-model.md
// T125 [US3] Create Payment type definition

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

export type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash';
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
  paymentNumber: string; // e.g., "PAY-2024-0001"

  // References
  invoiceId: string;
  customerId: string;

  // Amount
  amount: number;
  currency: CurrencyCode;

  // Method
  method: PaymentMethod;

  // Status
  status: PaymentTransactionStatus;

  // Stripe (if applicable)
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCheckoutSessionId?: string;

  // Bank Transfer (if applicable)
  bankTransfer?: BankTransferDetails;

  // Dates
  paymentDate: Timestamp;
  processedAt?: Timestamp;

  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating cash payment
export type CreateCashPaymentInput = {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: CurrencyCode;
  notes?: string;
};

// Helper type for creating bank transfer payment
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

// Helper type for Stripe checkout
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
