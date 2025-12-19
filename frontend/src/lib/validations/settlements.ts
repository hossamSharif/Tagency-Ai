/**
 * Settlement Validation Schemas
 *
 * Zod schemas for commission settlement management
 */

import { z } from 'zod';
import { requiredString, positiveNumber } from './index';

// ==========================================
// Enums
// ==========================================

export const settlementStatusSchema = z.enum(['pending', 'approved', 'paid', 'disputed']);
export const paymentMethodSchema = z.enum(['bank_transfer', 'cash', 'check']);

// ==========================================
// Settlement Schemas
// ==========================================

/**
 * Create settlement form validation
 */
export const createSettlementSchema = z.object({
  partnerOfficeId: requiredString,
  invoiceIds: z.array(z.string()).min(1, 'At least one invoice is required'),
  periodStart: z.date({ required_error: 'Period start date is required' }),
  periodEnd: z.date({ required_error: 'Period end date is required' }),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
}).refine(
  (data) => data.periodEnd >= data.periodStart,
  {
    message: 'Period end date must be after or equal to start date',
    path: ['periodEnd'],
  }
);

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

/**
 * Approve settlement
 */
export const approveSettlementSchema = z.object({
  settlementId: requiredString,
});

export type ApproveSettlementInput = z.infer<typeof approveSettlementSchema>;

/**
 * Mark settlement as paid
 */
export const markSettlementPaidSchema = z.object({
  settlementId: requiredString,
  paymentMethod: paymentMethodSchema,
  paymentReference: z.string().optional(),
});

export type MarkSettlementPaidInput = z.infer<typeof markSettlementPaidSchema>;

/**
 * Dispute settlement
 */
export const disputeSettlementSchema = z.object({
  settlementId: requiredString,
  reason: z
    .string()
    .min(10, 'Dispute reason must be at least 10 characters')
    .max(2000, 'Dispute reason cannot exceed 2000 characters'),
});

export type DisputeSettlementInput = z.infer<typeof disputeSettlementSchema>;

/**
 * Resolve dispute
 */
export const resolveDisputeSchema = z.object({
  settlementId: requiredString,
  resolution: z
    .string()
    .min(10, 'Resolution must be at least 10 characters')
    .max(2000, 'Resolution cannot exceed 2000 characters'),
  adjustedAmount: z.number().nonnegative('Amount cannot be negative').optional(),
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

// ==========================================
// Filter Schemas
// ==========================================

/**
 * Settlement list filters
 */
export const settlementFiltersSchema = z.object({
  partnerOfficeId: z.string().optional(),
  status: settlementStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startAfter: z.string().optional(), // Cursor for pagination
  limit: z.number().int().positive().max(100).default(20),
});

export type SettlementFiltersInput = z.infer<typeof settlementFiltersSchema>;

/**
 * Partner commission filters
 */
export const commissionFiltersSchema = z.object({
  partnerOfficeId: requiredString,
  settled: z.boolean().optional(), // Filter by settled/unsettled
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startAfter: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
});

export type CommissionFiltersInput = z.infer<typeof commissionFiltersSchema>;
