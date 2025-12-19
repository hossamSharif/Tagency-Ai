import { Timestamp } from 'firebase/firestore';

/**
 * Supported currency codes
 */
export type CurrencyCode = 'USD' | 'SAR' | 'EUR' | 'SDG' | 'AED' | 'EGP' | 'GBP';

/**
 * Tenant/Office status
 */
export type TenantStatus = 'active' | 'suspended' | 'trial';

/**
 * Theme preference
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Supported languages
 */
export type Language = 'ar' | 'en';

/**
 * Physical address
 */
export interface Address {
  street?: string;
  city: string;
  country: string;
  postalCode?: string;
}

/**
 * Tenant entity - represents a travel agency/office
 * Collection: `tenants/{tenantId}`
 */
export interface Tenant {
  /** Firestore document ID */
  id: string;
  /** Office/agency name */
  name: string;
  /** URL-friendly identifier */
  slug: string;

  /** Primary contact email */
  email: string;
  /** Contact phone */
  phone?: string;
  /** Physical address */
  address?: Address;

  /** Default currency for this tenant */
  currency: CurrencyCode;
  /** IANA timezone (e.g., 'Asia/Riyadh') */
  timezone: string;
  /** Default language */
  language: Language;

  /** Theme preference */
  theme: ThemePreference;

  /** Tenant status */
  status: TenantStatus;

  /** When the tenant was created */
  createdAt: Timestamp;
  /** When the tenant was last updated */
  updatedAt: Timestamp;
}

/**
 * Tenant creation input (without auto-generated fields)
 */
export type TenantCreateInput = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Tenant update input (partial, excluding immutable fields)
 */
export type TenantUpdateInput = Partial<Omit<Tenant, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>;

/**
 * Tenant settings that can be modified by users
 */
export interface TenantSettings {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  currency: CurrencyCode;
  timezone: string;
  language: Language;
  theme: ThemePreference;
}

/**
 * Default values for new tenants
 */
export const DEFAULT_TENANT_VALUES: Partial<Tenant> = {
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  theme: 'light',
  status: 'trial',
};

/**
 * Available currencies with display info
 */
export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; nameAr: string }> = {
  USD: { symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  EUR: { symbol: '€', name: 'Euro', nameAr: 'يورو' },
  SDG: { symbol: 'ج.س', name: 'Sudanese Pound', nameAr: 'جنيه سوداني' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  EGP: { symbol: 'ج.م', name: 'Egyptian Pound', nameAr: 'جنيه مصري' },
  GBP: { symbol: '£', name: 'British Pound', nameAr: 'جنيه إسترليني' },
};
