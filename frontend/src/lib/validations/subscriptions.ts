/**
 * Subscription Validation Schemas
 *
 * Zod schemas for subscription management operations.
 */

import { z } from 'zod';

/**
 * Create checkout session input
 */
export const createCheckoutSchema = z.object({
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

/**
 * Create billing portal session input
 */
export const createBillingPortalSchema = z.object({
  returnUrl: z.string().url('Invalid return URL'),
});

export type CreateBillingPortalInput = z.infer<typeof createBillingPortalSchema>;

/**
 * Initiate bank transfer input
 */
export const initiateBankTransferSchema = z.object({
  // No additional input needed - uses subscription pricing
});

export type InitiateBankTransferInput = z.infer<typeof initiateBankTransferSchema>;

/**
 * Upload payment proof input
 */
export const uploadPaymentProofSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  bankName: z.string().optional(),
});

export type UploadPaymentProofInput = z.infer<typeof uploadPaymentProofSchema>;

/**
 * Cancel subscription input
 */
export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

/**
 * Platform admin: Approve subscription payment input
 */
export const approveSubscriptionPaymentSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
});

export type ApproveSubscriptionPaymentInput = z.infer<typeof approveSubscriptionPaymentSchema>;

/**
 * Platform admin: Reject subscription payment input
 */
export const rejectSubscriptionPaymentSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().min(1, 'Rejection reason is required'),
});

export type RejectSubscriptionPaymentInput = z.infer<typeof rejectSubscriptionPaymentSchema>;

/**
 * Platform admin: Extend trial input
 */
export const extendTrialSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  days: z.number().int().min(1).max(30, 'Maximum 30 days extension'),
  reason: z.string().optional(),
});

export type ExtendTrialInput = z.infer<typeof extendTrialSchema>;

/**
 * Platform admin: Suspend tenant input
 */
export const suspendTenantSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  reason: z.string().min(1, 'Suspension reason is required'),
});

export type SuspendTenantInput = z.infer<typeof suspendTenantSchema>;

/**
 * Platform admin: List subscriptions filter input
 */
export const listSubscriptionsFilterSchema = z.object({
  status: z.enum(['active', 'past_due', 'cancelled', 'expired', 'pending_payment']).optional(),
  plan: z.enum(['trial', 'monthly']).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export type ListSubscriptionsFilterInput = z.infer<typeof listSubscriptionsFilterSchema>;
