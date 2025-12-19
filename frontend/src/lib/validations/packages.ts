/**
 * Package Validation Schemas
 *
 * Zod schemas for package and service management
 */

import { z } from 'zod';
import { requiredString, positiveNumber, nonNegativeNumber, percentageSchema } from './index';

// ==========================================
// Enums
// ==========================================

export const packageTypeSchema = z.enum(['hajj', 'umrah', 'honeymoon', 'custom']);
export const packageStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
export const serviceCategorySchema = z.enum([
  'flight',
  'hotel',
  'visa',
  'transport',
  'guide',
  'meal',
  'other',
]);
export const documentTypeSchema = z.enum(['passport', 'visa', 'photo', 'vaccination', 'other']);

// ==========================================
// Package Schemas
// ==========================================

/**
 * Create package form validation
 */
export const createPackageSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Package name must be at least 2 characters')
      .max(200, 'Package name cannot exceed 200 characters'),
    type: packageTypeSchema,
    description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional(),
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date({ required_error: 'End date is required' }),
    basePrice: nonNegativeNumber.optional().default(0),
    coverImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
    maxCapacity: z.number().int().positive('Capacity must be a positive number').optional(),
    requiredDocuments: z.array(documentTypeSchema).default(['passport']),
    highlights: z.array(z.string()).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

/**
 * Update package form validation
 */
export const updatePackageSchema = z.object({
  name: z
    .string()
    .min(2, 'Package name must be at least 2 characters')
    .max(200, 'Package name cannot exceed 200 characters')
    .optional(),
  description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  basePrice: nonNegativeNumber.optional(),
  coverImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
  maxCapacity: z.number().int().positive('Capacity must be a positive number').optional().nullable(),
  requiredDocuments: z.array(documentTypeSchema).optional(),
  highlights: z.array(z.string()).optional(),
});

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

/**
 * Update package status
 */
export const updatePackageStatusSchema = z.object({
  packageId: requiredString,
  status: packageStatusSchema,
});

export type UpdatePackageStatusInput = z.infer<typeof updatePackageStatusSchema>;

/**
 * Duplicate package
 */
export const duplicatePackageSchema = z.object({
  packageId: requiredString,
  name: z
    .string()
    .min(2, 'Package name must be at least 2 characters')
    .max(200, 'Package name cannot exceed 200 characters')
    .optional(),
});

export type DuplicatePackageInput = z.infer<typeof duplicatePackageSchema>;

// ==========================================
// Service Schemas
// ==========================================

/**
 * Add service to package
 */
export const addServiceSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Service name must be at least 2 characters')
      .max(200, 'Service name cannot exceed 200 characters'),
    category: serviceCategorySchema,
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    price: nonNegativeNumber,
    serviceDate: z.date().optional(),
    duration: z.number().positive('Duration must be positive').optional(),
    provider: z.string().max(200, 'Provider name cannot exceed 200 characters').optional(),
    isOutsourced: z.boolean().default(false),
    partnerOfficeId: z.string().optional(),
    commissionPercentage: percentageSchema.optional(),
  })
  .refine(
    (data) => {
      // If outsourced, partner and commission are required
      if (data.isOutsourced) {
        return !!data.partnerOfficeId && data.commissionPercentage !== undefined;
      }
      return true;
    },
    {
      message: 'Partner office and commission percentage are required for outsourced services',
      path: ['partnerOfficeId'],
    }
  );

export type AddServiceInput = z.infer<typeof addServiceSchema>;

/**
 * Update service
 */
export const updateServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(200, 'Service name cannot exceed 200 characters')
    .optional(),
  category: serviceCategorySchema.optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  price: nonNegativeNumber.optional(),
  serviceDate: z.date().optional().nullable(),
  duration: z.number().positive('Duration must be positive').optional().nullable(),
  provider: z.string().max(200, 'Provider name cannot exceed 200 characters').optional(),
  isOutsourced: z.boolean().optional(),
  partnerOfficeId: z.string().optional().nullable(),
  commissionPercentage: percentageSchema.optional().nullable(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

/**
 * Reorder services
 */
export const reorderServicesSchema = z.object({
  packageId: requiredString,
  serviceIds: z.array(z.string()).min(1, 'At least one service ID is required'),
});

export type ReorderServicesInput = z.infer<typeof reorderServicesSchema>;

// ==========================================
// Filter Schemas
// ==========================================

/**
 * Package list filters
 */
export const packageFiltersSchema = z.object({
  status: packageStatusSchema.optional(),
  type: packageTypeSchema.optional(),
  startAfter: z.string().optional(), // Cursor for pagination
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export type PackageFiltersInput = z.infer<typeof packageFiltersSchema>;

// ==========================================
// Flight Details Schema
// ==========================================

export const flightDetailsSchema = z.object({
  airline: requiredString,
  flightNumber: requiredString,
  departure: z.object({
    airport: requiredString,
    city: requiredString,
    dateTime: z.date(),
  }),
  arrival: z.object({
    airport: requiredString,
    city: requiredString,
    dateTime: z.date(),
  }),
  class: z.enum(['economy', 'business', 'first']),
  baggage: z.string().optional(),
});

export type FlightDetailsInput = z.infer<typeof flightDetailsSchema>;

// ==========================================
// Hotel Details Schema
// ==========================================

export const hotelDetailsSchema = z.object({
  hotelName: requiredString,
  starRating: z.number().int().min(1).max(5),
  roomType: requiredString,
  checkIn: z.date(),
  checkOut: z.date(),
  nights: z.number().int().positive(),
  mealPlan: z.enum(['bb', 'hb', 'fb', 'ai', 'ro']),
  address: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type HotelDetailsInput = z.infer<typeof hotelDetailsSchema>;
