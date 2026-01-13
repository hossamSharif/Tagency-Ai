// Service Catalog validation schemas
// T007 [P] Create Zod schema for service catalog

import { z } from 'zod';

// Base service catalog item schema (without refinements for .partial() support)
const serviceCatalogItemBaseSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Name must be less than 100 characters'),
  nameAr: z.string().min(1, 'Arabic name is required').max(100, 'Arabic name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.enum(['USD', 'SAR', 'EUR', 'SDG', 'AED', 'EGP', 'GBP']),
  type: z.enum(['visa', 'ticket', 'hotel', 'insurance', 'other']),
  providerType: z.enum(['office', 'partner']),
  defaultPartnerId: z.string().optional(),
  defaultPartnerName: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
});

// Service catalog item schema with refinements
export const serviceCatalogItemSchema = serviceCatalogItemBaseSchema.refine(
  (data) => {
    // If provider is partner, commission percentage is required
    if (data.providerType === 'partner' && !data.commissionPercentage) {
      return false;
    }
    return true;
  },
  {
    message: 'Commission percentage is required for partner-provided services',
    path: ['commissionPercentage'],
  }
);

// Update service catalog item schema (uses base schema for .partial() support)
export const updateServiceCatalogItemSchema = serviceCatalogItemBaseSchema.partial();

// Search services schema
export const searchServicesSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['visa', 'ticket', 'hotel', 'insurance', 'other']).optional(),
  providerType: z.enum(['office', 'partner']).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Quick-add service schema (minimal fields for invoice form)
export const quickAddServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  type: z.enum(['visa', 'ticket', 'hotel', 'insurance', 'other']),
  providerType: z.enum(['office', 'partner']),
  commissionPercentage: z.number().min(0).max(100).optional(),
});

// Type exports
export type ServiceCatalogItemInput = z.infer<typeof serviceCatalogItemSchema>;
export type UpdateServiceCatalogItemInput = z.infer<typeof updateServiceCatalogItemSchema>;
export type SearchServicesInput = z.infer<typeof searchServicesSchema>;
export type QuickAddServiceInput = z.infer<typeof quickAddServiceSchema>;
