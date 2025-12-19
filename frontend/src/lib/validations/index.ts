/**
 * Validation Schemas Base
 *
 * Common Zod schemas and validation utilities used across the application
 */

import { z } from 'zod';

// ==========================================
// Common Field Schemas
// ==========================================

/**
 * Email validation with custom message
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Password validation (min 8 chars)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/**
 * Phone number validation (basic)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

/**
 * Non-empty string
 */
export const requiredString = z.string().min(1, 'This field is required');

/**
 * Optional string that can be empty
 */
export const optionalString = z.string().optional().or(z.literal(''));

/**
 * Positive number
 */
export const positiveNumber = z.number().positive('Must be a positive number');

/**
 * Non-negative number
 */
export const nonNegativeNumber = z.number().nonnegative('Cannot be negative');

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL').optional().or(z.literal(''));

/**
 * Date string (ISO format)
 */
export const dateStringSchema = z.string().datetime().or(z.date());

// ==========================================
// Common Object Schemas
// ==========================================

/**
 * Address schema
 */
export const addressSchema = z.object({
  street: z.string().optional(),
  city: requiredString,
  country: requiredString,
  postalCode: z.string().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Pagination params
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Sort params
 */
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type SortInput = z.infer<typeof sortSchema>;

/**
 * Date range filter
 */
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// ==========================================
// Enum Schemas
// ==========================================

/**
 * Currency codes
 */
export const currencyCodeSchema = z.enum(['USD', 'SAR', 'EUR', 'SDG', 'AED', 'EGP', 'GBP']);

/**
 * Languages
 */
export const languageSchema = z.enum(['ar', 'en']);

/**
 * Theme preferences
 */
export const themeSchema = z.enum(['light', 'dark', 'system']);

/**
 * User roles
 */
export const userRoleSchema = z.enum(['owner', 'admin', 'staff', 'customer', 'partner']);

// ==========================================
// Validation Utilities
// ==========================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  }

  return { success: false, errors };
}

/**
 * Create a schema with Arabic error messages
 */
export function withArabicMessages<T extends z.ZodTypeAny>(
  schema: T,
  messages: Record<string, string>
): T {
  // This is a simplified version - in production, you'd use z.setErrorMap
  return schema;
}

/**
 * Passport number validation (alphanumeric, 6-9 chars)
 */
export const passportNumberSchema = z
  .string()
  .min(6, 'Passport number must be at least 6 characters')
  .max(9, 'Passport number cannot exceed 9 characters')
  .regex(/^[A-Z0-9]+$/, 'Passport number must contain only letters and numbers');

/**
 * Gender schema
 */
export const genderSchema = z.enum(['M', 'F']);

/**
 * Passport data schema
 */
export const passportDataSchema = z.object({
  passportNumber: passportNumberSchema,
  fullName: requiredString,
  dateOfBirth: z.date(),
  expiryDate: z.date(),
  nationality: requiredString,
  gender: genderSchema,
  issuingCountry: requiredString,
  extractedAt: z.date().optional(),
  extractionConfidence: z.number().min(0).max(100).optional(),
  manuallyVerified: z.boolean().default(false),
});

export type PassportDataInput = z.infer<typeof passportDataSchema>;

// ==========================================
// Form Helpers
// ==========================================

/**
 * Convert Zod errors to form-compatible format
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Get first error message for a field
 */
export function getFirstError(
  errors: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  return errors?.[field]?.[0];
}

// Re-export Zod for convenience
export { z };
