// Customer type definition per data-model.md
// T086 [US2] Create Customer type definition

import { Timestamp } from 'firebase/firestore';

export interface Address {
  street?: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface PassportData {
  passportNumber: string;
  fullName: string; // As on passport
  dateOfBirth: Timestamp;
  expiryDate: Timestamp;
  nationality: string;
  gender: 'M' | 'F';
  issuingCountry: string;

  // OCR metadata
  extractedAt?: Timestamp;
  extractionConfidence?: number; // 0-100
  manuallyVerified: boolean;
}

export type DocumentType = 'passport' | 'visa' | 'photo' | 'vaccination' | 'other';

export interface CustomerDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string; // Storage URL
  uploadedAt: Timestamp;
}

export interface Customer {
  // Identity
  id: string;
  userId?: string; // If registered user

  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Nationality
  nationality: string; // Country code
  nationalId?: string; // Optional local ID

  // Passport (extracted from scan or manual)
  passport?: PassportData;

  // Address
  address?: Address;

  // Communication
  preferredLanguage?: 'ar' | 'en';

  // Financial
  balance: number; // Positive = credit, Negative = owes

  // Documents
  documents?: CustomerDocument[];

  // Metadata
  notes?: string; // Admin notes
  tags?: string[]; // For categorization
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating new customers
export type CreateCustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance' | 'documents'>;

// Helper type for updating customers
export type UpdateCustomerInput = Partial<Omit<Customer, 'id' | 'createdAt'>>;
