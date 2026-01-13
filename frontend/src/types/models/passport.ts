// PassportData type definition per data-model.md
// T088 [US2] Create PassportData type definition

// Re-export from customer.ts for standalone usage
export { PassportData, DocumentType, CustomerDocument } from './customer';

// OCR-specific types for passport scanning
export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export interface MRZData {
  documentType: string; // P for passport
  issuingCountry: string;
  lastName: string;
  firstName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string; // YYMMDD format
  gender: 'M' | 'F' | '<';
  expiryDate: string; // YYMMDD format
  personalNumber?: string;
  checkDigits?: {
    passportNumber: boolean;
    dateOfBirth: boolean;
    expiryDate: boolean;
    composite: boolean;
  };
}

export interface PassportScanResult {
  // Raw OCR result
  rawText: string;
  overallConfidence: number;

  // Parsed MRZ data (if MRZ detected)
  mrzData?: MRZData;
  mrzDetected: boolean;

  // Extracted fields (from MRZ or VIZ)
  extractedData: {
    passportNumber?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string; // ISO format YYYY-MM-DD
    expiryDate?: string; // ISO format YYYY-MM-DD
    nationality?: string;
    gender?: 'M' | 'F'; // OCR extracts 'M'/'F' from MRZ
    issuingCountry?: string;
  };

  // Field-level confidence scores
  fieldConfidence: {
    passportNumber?: number;
    fullName?: number;
    dateOfBirth?: number;
    expiryDate?: number;
    nationality?: number;
    gender?: number;
  };

  // Processing metadata
  processingTime: number; // milliseconds
  imageQuality?: 'low' | 'medium' | 'high';
  warnings?: string[];

  // Captured image file for automatic upload
  capturedImage?: File;
}

// Form data for manual passport entry
export interface PassportFormData {
  passportNumber: string;
  fullName: string;
  dateOfBirth: string; // ISO format
  expiryDate: string; // ISO format
  nationality: string;
  gender: 'male' | 'female';
  issuingCountry: string;
  manuallyVerified?: boolean;
}
