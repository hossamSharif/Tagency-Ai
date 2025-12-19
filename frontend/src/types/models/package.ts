import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

/**
 * Package types
 */
export type PackageType = 'hajj' | 'umrah' | 'honeymoon' | 'custom';

/**
 * Package status
 */
export type PackageStatus = 'draft' | 'active' | 'completed' | 'cancelled';

/**
 * Document types required for a package
 */
export type DocumentType = 'passport' | 'visa' | 'photo' | 'vaccination' | 'other';

/**
 * Package entity - represents a tourism package
 * Collection: `tenants/{tenantId}/packages/{packageId}`
 */
export interface Package {
  /** Firestore document ID */
  id: string;
  /** Package name */
  name: string;
  /** URL-friendly identifier */
  slug: string;

  /** Package type */
  type: PackageType;

  /** Package description (rich text) */
  description: string;
  /** Key selling points */
  highlights?: string[];

  /** Trip start date */
  startDate: Timestamp;
  /** Trip end date */
  endDate: Timestamp;
  /** Duration in days */
  duration: number;

  /** Base price before services */
  basePrice: number;
  /** Total price (calculated from services) */
  totalPrice: number;
  /** Currency (inherited from tenant) */
  currency: CurrencyCode;

  /** Cover image URL (Firebase Storage) */
  coverImage?: string;
  /** Additional images */
  gallery?: string[];

  /** Documents required from customers */
  requiredDocuments: DocumentType[];

  /** Package status */
  status: PackageStatus;
  /** When the package was published */
  publishedAt?: Timestamp;

  /** Maximum number of bookings */
  maxCapacity?: number;
  /** Current number of bookings */
  currentBookings: number;

  /** User who created this package */
  createdBy: string;
  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * Package creation input
 */
export type PackageCreateInput = Omit<
  Package,
  'id' | 'slug' | 'totalPrice' | 'currentBookings' | 'publishedAt' | 'createdAt' | 'updatedAt'
>;

/**
 * Package update input
 */
export type PackageUpdateInput = Partial<
  Omit<Package, 'id' | 'slug' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;

/**
 * Package with services included
 */
export interface PackageWithServices extends Package {
  services: Service[];
}

/**
 * Service within a package - imported separately to avoid circular dependency
 */
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: 'flight' | 'hotel' | 'visa' | 'transport' | 'guide' | 'meal' | 'other';
  price: number;
  currency: CurrencyCode;
  serviceDate?: Timestamp;
  duration?: number;
  isOutsourced: boolean;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  commissionPercentage?: number;
  provider?: string;
  details?: Record<string, unknown>;
  displayOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Package type display info
 */
export const PACKAGE_TYPE_INFO: Record<
  PackageType,
  { label: string; labelAr: string; icon: string }
> = {
  hajj: { label: 'Hajj', labelAr: 'حج', icon: 'kaaba' },
  umrah: { label: 'Umrah', labelAr: 'عمرة', icon: 'mosque' },
  honeymoon: { label: 'Honeymoon', labelAr: 'شهر العسل', icon: 'heart' },
  custom: { label: 'Custom', labelAr: 'مخصص', icon: 'package' },
};

/**
 * Package status display info
 */
export const PACKAGE_STATUS_INFO: Record<
  PackageStatus,
  { label: string; labelAr: string; color: string }
> = {
  draft: { label: 'Draft', labelAr: 'مسودة', color: 'gray' },
  active: { label: 'Active', labelAr: 'نشط', color: 'green' },
  completed: { label: 'Completed', labelAr: 'مكتمل', color: 'blue' },
  cancelled: { label: 'Cancelled', labelAr: 'ملغى', color: 'red' },
};

/**
 * Document type display info
 */
export const DOCUMENT_TYPE_INFO: Record<
  DocumentType,
  { label: string; labelAr: string }
> = {
  passport: { label: 'Passport', labelAr: 'جواز السفر' },
  visa: { label: 'Visa', labelAr: 'التأشيرة' },
  photo: { label: 'Photo', labelAr: 'صورة شخصية' },
  vaccination: { label: 'Vaccination Certificate', labelAr: 'شهادة التطعيم' },
  other: { label: 'Other', labelAr: 'أخرى' },
};

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [], // No transitions from completed
  cancelled: [], // No transitions from cancelled
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: PackageStatus,
  newStatus: PackageStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Calculate package duration in days
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
}

/**
 * Check if package has available capacity
 */
export function hasAvailableCapacity(pkg: Package): boolean {
  if (!pkg.maxCapacity) return true;
  return pkg.currentBookings < pkg.maxCapacity;
}

/**
 * Get remaining capacity
 */
export function getRemainingCapacity(pkg: Package): number | null {
  if (!pkg.maxCapacity) return null;
  return Math.max(0, pkg.maxCapacity - pkg.currentBookings);
}
