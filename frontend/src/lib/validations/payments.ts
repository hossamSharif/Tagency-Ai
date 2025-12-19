// Payment validation schemas
// T127 [US3] Create payment validation schemas

import { z } from 'zod';

// Create cash payment schema
export const createCashPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Create bank transfer payment schema
export const createBankTransferPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  proofDocumentUrl: z.string().url('Invalid proof document URL'),
  bankName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Create Stripe checkout schema
export const createStripeCheckoutSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

// Approve bank transfer schema
export const approveBankTransferSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

// Reject bank transfer schema
export const rejectBankTransferSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  rejectionReason: z.string().min(1, 'Rejection reason is required').max(500),
});

// Upload bank transfer proof schema
export const uploadBankTransferProofSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  bankName: z.string().optional(),
  notes: z.string().max(500).optional(),
  // File will be handled separately
});

// Search payments schema
export const searchPaymentsSchema = z.object({
  query: z.string().optional(), // payment number
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  method: z.enum(['stripe', 'bank_transfer', 'cash']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type CreateCashPaymentInput = z.infer<typeof createCashPaymentSchema>;
export type CreateBankTransferPaymentInput = z.infer<typeof createBankTransferPaymentSchema>;
export type CreateStripeCheckoutInput = z.infer<typeof createStripeCheckoutSchema>;
export type ApproveBankTransferInput = z.infer<typeof approveBankTransferSchema>;
export type RejectBankTransferInput = z.infer<typeof rejectBankTransferSchema>;
export type UploadBankTransferProofInput = z.infer<typeof uploadBankTransferProofSchema>;
export type SearchPaymentsInput = z.infer<typeof searchPaymentsSchema>;
