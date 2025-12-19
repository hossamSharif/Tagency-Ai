/**
 * Partner Validation Schemas
 *
 * Zod schemas for partner office management
 */

import { z } from 'zod';
import {
  requiredString,
  emailSchema,
  phoneSchema,
  percentageSchema,
  currencyCodeSchema,
} from './index';

// ==========================================
// Enums
// ==========================================

export const partnerStatusSchema = z.enum(['active', 'suspended', 'pending']);

// ==========================================
// Bank Details Schema
// ==========================================

export const bankDetailsSchema = z.object({
  bankName: requiredString,
  accountNumber: requiredString,
  accountHolder: requiredString,
  iban: z.string().optional().or(z.literal('')),
  swiftCode: z.string().optional().or(z.literal('')),
});

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;

// ==========================================
// Partner Schemas
// ==========================================

/**
 * Create partner office form validation
 */
export const createPartnerSchema = z.object({
  name: z
    .string()
    .min(2, 'Partner name must be at least 2 characters')
    .max(200, 'Partner name cannot exceed 200 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  contactPerson: requiredString,
  email: emailSchema,
  phone: phoneSchema,
  defaultCommissionPercentage: percentageSchema,
  bankAccount: bankDetailsSchema.optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;

/**
 * Update partner office form validation
 */
export const updatePartnerSchema = z.object({
  name: z
    .string()
    .min(2, 'Partner name must be at least 2 characters')
    .max(200, 'Partner name cannot exceed 200 characters')
    .optional(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  contactPerson: requiredString.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  defaultCommissionPercentage: percentageSchema.optional(),
  bankAccount: bankDetailsSchema.optional().nullable(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

/**
 * Update partner status
 */
export const updatePartnerStatusSchema = z.object({
  partnerId: requiredString,
  status: partnerStatusSchema,
});

export type UpdatePartnerStatusInput = z.infer<typeof updatePartnerStatusSchema>;

/**
 * Invite partner user
 */
export const invitePartnerUserSchema = z.object({
  partnerId: requiredString,
  email: emailSchema,
  name: requiredString,
});

export type InvitePartnerUserInput = z.infer<typeof invitePartnerUserSchema>;

// ==========================================
// Filter Schemas
// ==========================================

/**
 * Partner list filters
 */
export const partnerFiltersSchema = z.object({
  status: partnerStatusSchema.optional(),
  search: z.string().optional(),
  startAfter: z.string().optional(), // Cursor for pagination
  limit: z.number().int().positive().max(100).default(20),
});

export type PartnerFiltersInput = z.infer<typeof partnerFiltersSchema>;
