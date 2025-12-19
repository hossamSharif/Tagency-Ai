// Customer validation schemas
// T092 [US2] Create customer validation schemas

import { z } from 'zod';

// Address schema
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().optional(),
});

// Passport data schema
export const passportDataSchema = z.object({
  passportNumber: z.string().min(6, 'Passport number must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, 'Invalid date of birth'),
  expiryDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid expiry date'),
  nationality: z.string().length(3, 'Nationality must be a 3-letter country code'),
  gender: z.enum(['M', 'F']),
  issuingCountry: z.string().length(3, 'Issuing country must be a 3-letter country code'),
});

// Customer document schema
export const customerDocumentSchema = z.object({
  id: z.string(),
  type: z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']),
  name: z.string().min(1, 'Document name is required'),
  url: z.string().url('Invalid document URL'),
  uploadedAt: z.any(), // Timestamp
});

// Create customer schema
export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .regex(/^[\d\s+()-]+$/, 'Invalid phone number format'),
  nationality: z.string().min(2, 'Nationality is required'),
  nationalId: z.string().optional(),
  passport: passportDataSchema.optional(),
  address: addressSchema.optional(),
  preferredLanguage: z.enum(['ar', 'en']).default('ar'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
});

// Update customer schema (partial of create)
export const updateCustomerSchema = createCustomerSchema.partial();

// Update passport schema
export const updatePassportSchema = z.object({
  passportNumber: z.string().min(6, 'Passport number must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string(),
  expiryDate: z.string(),
  nationality: z.string().length(3, 'Nationality must be a 3-letter country code'),
  gender: z.enum(['M', 'F']),
  issuingCountry: z.string().length(3, 'Issuing country must be a 3-letter country code'),
  manuallyVerified: z.boolean().default(false),
});

// Upload document schema
export const uploadDocumentSchema = z.object({
  type: z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']),
  name: z.string().min(1, 'Document name is required'),
  file: z.any(), // File object
});

// Search customers schema
export const searchCustomersSchema = z.object({
  query: z.string().optional(),
  nationality: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasPassport: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdatePassportInput = z.infer<typeof updatePassportSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type SearchCustomersInput = z.infer<typeof searchCustomersSchema>;
