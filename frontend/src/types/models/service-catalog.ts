// ServiceCatalogItem type definition per data-model.md
// T001 [P] Create ServiceCatalogItem type

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

export type ServiceType = 'visa' | 'ticket' | 'hotel' | 'insurance' | 'other';
export type ProviderType = 'office' | 'partner';

/**
 * Service Catalog Item - Predefined services at workspace level
 * Collection: `tenants/{tenantId}/serviceCatalog/{serviceId}`
 */
export interface ServiceCatalogItem {
  // Identity
  id: string;

  // Basic Info
  name: string;
  nameAr: string;
  description?: string;

  // Pricing
  price: number;
  currency: CurrencyCode;

  // Classification
  type: ServiceType;

  // Provider
  providerType: ProviderType;
  defaultPartnerId?: string;
  defaultPartnerName?: string;
  commissionPercentage?: number;

  // Status
  isActive: boolean;
  usageCount: number;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input for creating a new service catalog item
 */
export type CreateServiceCatalogItemInput = Omit<
  ServiceCatalogItem,
  'id' | 'isActive' | 'usageCount' | 'createdAt' | 'updatedAt'
>;

/**
 * Input for updating a service catalog item
 */
export type UpdateServiceCatalogItemInput = Partial<
  Omit<ServiceCatalogItem, 'id' | 'usageCount' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;
