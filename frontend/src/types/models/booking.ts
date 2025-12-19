// Booking type definition per data-model.md
// T087 [US2] Create Booking type definition

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';
import { PackageType, ServiceCategory } from './package';
import { PassportData, DocumentType } from './customer';

export interface ServiceSnapshot {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  isOutsourced: boolean;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  commissionPercentage?: number;
}

export interface PackageSnapshot {
  name: string;
  type: PackageType;
  services: ServiceSnapshot[];
  totalPrice: number;
}

export interface Traveler {
  firstName: string;
  lastName: string;
  passport?: PassportData;
  isPrimary: boolean; // Primary contact
}

export type RequiredDocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface RequiredDocument {
  type: DocumentType;
  status: RequiredDocumentStatus;
  documentId?: string; // Reference to uploaded doc
  rejectionReason?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type BookingSource = 'web' | 'walk-in' | 'phone';

export interface Booking {
  // Identity
  id: string;
  bookingNumber: string; // Human-readable (e.g., "BK-2024-0001")

  // References
  customerId: string;
  packageId: string;
  packageSnapshot: PackageSnapshot; // Frozen copy at booking time

  // Travelers
  travelers: Traveler[]; // Can book for multiple people

  // Status
  status: BookingStatus;
  paymentStatus: PaymentStatus;

  // Dates
  bookingDate: Timestamp;
  travelDate: Timestamp; // Package start for this booking

  // Financial
  totalAmount: number;
  paidAmount: number;
  balance: number; // totalAmount - paidAmount
  currency: CurrencyCode;

  // Invoice
  invoiceId?: string;

  // Documents
  requiredDocuments: RequiredDocument[];

  // Metadata
  notes?: string;
  source?: BookingSource;
  createdBy: string; // User who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating new bookings
export type CreateBookingInput = Omit<
  Booking,
  'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'balance' | 'paymentStatus' | 'invoiceId'
>;

// Helper type for updating bookings
export type UpdateBookingInput = Partial<Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'customerId' | 'packageId' | 'packageSnapshot'>>;
