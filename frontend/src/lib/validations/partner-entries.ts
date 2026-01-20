/**
 * Partner Entry Validation Schemas
 *
 * Zod schemas for partner account entries (prepayments and withdrawals)
 */

import { z } from 'zod';
import { requiredString, positiveNumber } from './index';

// ==========================================
// Partner Entry Schemas
// ==========================================

/**
 * Entry type - Credit (prepayment to partner) or Debit (withdrawal/adjustment)
 */
export const partnerEntryTypeSchema = z.enum(['credit', 'debit']);

/**
 * Payment method schema
 */
export const paymentMethodSchema = z.enum(['cash', 'bank']);

/**
 * Create partner entry form validation
 */
export const createPartnerEntrySchema = z.object({
  partnerId: requiredString,
  type: partnerEntryTypeSchema,
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount cannot exceed 10,000,000'),
  method: paymentMethodSchema,
  accountId: requiredString, // The cash or bank account to use
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CreatePartnerEntryInput = z.infer<typeof createPartnerEntrySchema>;
export type PartnerEntryType = z.infer<typeof partnerEntryTypeSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/**
 * Partner entries list options
 */
export const partnerEntriesOptionsSchema = z.object({
  partnerId: requiredString,
  limit: z.number().int().positive().max(100).default(20),
  startAfter: z.string().optional(),
});

export type PartnerEntriesOptions = z.infer<typeof partnerEntriesOptionsSchema>;
