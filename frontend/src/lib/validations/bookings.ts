// Booking validation schemas
// T093 [US2] Create booking validation schemas

import { z } from 'zod';
import { passportDataSchema } from './customers';

// Traveler schema
export const travelerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  isPrimary: z.boolean(),
  passport: passportDataSchema.optional(),
});

// Required document schema for bookings
export const requiredDocumentSchema = z.object({
  type: z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']),
  status: z.enum(['pending', 'uploaded', 'verified', 'rejected']).default('pending'),
  documentId: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Create booking schema
export const createBookingSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  packageId: z.string().min(1, 'Package is required'),
  travelers: z
    .array(travelerSchema)
    .min(1, 'At least one traveler is required')
    .refine(
      (travelers) => travelers.filter((t) => t.isPrimary).length === 1,
      'Exactly one traveler must be marked as primary'
    ),
  travelDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Travel date must be in the future'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  source: z.enum(['web', 'walk-in', 'phone']),
});

// Update booking schema
export const updateBookingSchema = z.object({
  travelers: z.array(travelerSchema).optional(),
  travelDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
});

// Update booking status schema
export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// Upload booking document schema
export const uploadBookingDocumentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  documentType: z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']),
  file: z.any(), // File object
});

// Update traveler passport schema
export const updateTravelerPassportSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  travelerIndex: z.number().min(0, 'Invalid traveler index'),
  passport: passportDataSchema,
});

// Verify document schema
export const verifyDocumentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  documentType: z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']),
  verified: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

// Search bookings schema
export const searchBookingsSchema = z.object({
  query: z.string().optional(), // booking number or customer name
  customerId: z.string().optional(),
  packageId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type TravelerInput = z.infer<typeof travelerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type UploadBookingDocumentInput = z.infer<typeof uploadBookingDocumentSchema>;
export type UpdateTravelerPassportInput = z.infer<typeof updateTravelerPassportSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
export type SearchBookingsInput = z.infer<typeof searchBookingsSchema>;
