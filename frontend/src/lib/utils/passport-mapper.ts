// Passport data mapping utilities
// Maps OCR-extracted passport data to customer form fields

import { Timestamp } from 'firebase/firestore';
import { PassportScanResult } from '@/types/models/passport';
import { CreateCustomerInput } from '@/lib/validations/customers';
import { inferLanguageFromNationality } from './language-inference';

/**
 * Map 3-letter ISO codes (passport MRZ) to 2-letter ISO codes (customer nationality)
 * Comprehensive mapping for common countries
 */
const COUNTRY_CODE_MAP_3_TO_2: Record<string, string> = {
  // Middle East
  'SAU': 'SA', 'ARE': 'AE', 'EGY': 'EG', 'SDN': 'SD',
  'YEM': 'YE', 'JOR': 'JO', 'SYR': 'SY', 'IRQ': 'IQ',
  'KWT': 'KW', 'QAT': 'QA', 'BHR': 'BH', 'OMN': 'OM',
  'LBN': 'LB', 'MAR': 'MA', 'DZA': 'DZ', 'TUN': 'TN',
  'PSE': 'PS', 'MRT': 'MR', 'SOM': 'SO', 'DJI': 'DJ', 'COM': 'KM',
  // South Asia
  'PAK': 'PK', 'IND': 'IN', 'BGD': 'BD', 'LKA': 'LK', 'NPL': 'NP',
  'AFG': 'AF', 'MDV': 'MV', 'BTN': 'BT',
  // Southeast Asia
  'IDN': 'ID', 'MYS': 'MY', 'THA': 'TH', 'PHL': 'PH', 'VNM': 'VN',
  'SGP': 'SG', 'MMR': 'MM', 'KHM': 'KH', 'LAO': 'LA', 'BRN': 'BN',
  // Europe
  'GBR': 'GB', 'FRA': 'FR', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES',
  'NLD': 'NL', 'BEL': 'BE', 'CHE': 'CH', 'AUT': 'AT', 'SWE': 'SE',
  'NOR': 'NO', 'DNK': 'DK', 'FIN': 'FI', 'POL': 'PL', 'GRC': 'GR',
  'PRT': 'PT', 'IRL': 'IE', 'CZE': 'CZ', 'HUN': 'HU', 'ROU': 'RO',
  // Americas
  'USA': 'US', 'CAN': 'CA', 'MEX': 'MX', 'BRA': 'BR', 'ARG': 'AR',
  'CHL': 'CL', 'COL': 'CO', 'PER': 'PE', 'VEN': 'VE', 'ECU': 'EC',
  // Africa
  'ZAF': 'ZA', 'NGA': 'NG', 'KEN': 'KE', 'ETH': 'ET', 'GHA': 'GH',
  'UGA': 'UG', 'TZA': 'TZ', 'ZWE': 'ZW', 'MOZ': 'MZ', 'ZMB': 'ZM',
  // East Asia
  'CHN': 'CN', 'JPN': 'JP', 'KOR': 'KR', 'TWN': 'TW', 'HKG': 'HK',
  'MAC': 'MO', 'MNG': 'MN',
  // Oceania
  'AUS': 'AU', 'NZL': 'NZ', 'FJI': 'FJ', 'PNG': 'PG',
};

/**
 * Convert 3-letter country code to 2-letter code
 * @param code3 - 3-letter ISO code (e.g., 'SAU')
 * @returns 2-letter ISO code (e.g., 'SA') or original if not found
 */
export function convertCountryCode3to2(code3: string): string {
  const normalized = code3.toUpperCase();
  return COUNTRY_CODE_MAP_3_TO_2[normalized] || code3;
}

/**
 * Convert 2-letter country code to 3-letter code (reverse lookup)
 * @param code2 - 2-letter ISO code (e.g., 'SA')
 * @returns 3-letter ISO code (e.g., 'SAU') or original if not found
 */
export function convertCountryCode2to3(code2: string): string {
  const normalized = code2.toUpperCase();
  const entry = Object.entries(COUNTRY_CODE_MAP_3_TO_2).find(
    ([_, val]) => val === normalized
  );
  return entry ? entry[0] : code2;
}

/**
 * Split full name into first and last name
 * Handles various name formats
 * @param fullName - Full name string (e.g., "John Michael Doe")
 * @returns Object with firstName and lastName
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const cleaned = fullName.trim();

  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleaned.split(/\s+/);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Last part is surname, rest is first name(s)
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');

  return { firstName, lastName };
}

/**
 * Convert passport date string to ISO format for form fields
 * @param dateStr - Date string from passport (YYYY-MM-DD or other format)
 * @returns ISO date string (YYYY-MM-DD) or empty string if invalid
 */
export function convertPassportDateToISO(dateStr: string | undefined): string {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Main mapping function: Convert passport scan result to customer form data
 * @param scanResult - OCR scan result from passport
 * @returns Partial customer form data with auto-filled fields
 */
export function mapPassportToCustomer(
  scanResult: PassportScanResult
): Partial<CreateCustomerInput> {
  const { extractedData } = scanResult;

  // Name extraction (prefer firstName/lastName, fallback to fullName split)
  let firstName = extractedData.firstName || '';
  let lastName = extractedData.lastName || '';

  if (!firstName && !lastName && extractedData.fullName) {
    const nameParts = splitFullName(extractedData.fullName);
    firstName = nameParts.firstName;
    lastName = nameParts.lastName;
  }

  // Nationality conversion: 3-letter (SAU) → 2-letter (SA)
  const nationality3Letter = extractedData.nationality || '';
  const nationality = convertCountryCode3to2(nationality3Letter);

  // Language inference from nationality
  const preferredLanguage = inferLanguageFromNationality(nationality);

  // Build passport object for storage
  const passport = {
    passportNumber: extractedData.passportNumber || '',
    fullName: extractedData.fullName || `${firstName} ${lastName}`.trim(),
    dateOfBirth: extractedData.dateOfBirth || '',
    expiryDate: extractedData.expiryDate || '',
    nationality: nationality3Letter, // Store original 3-letter code
    gender: (extractedData.gender || 'M') as 'M' | 'F',
    issuingCountry: extractedData.issuingCountry || '',
    extractionConfidence: scanResult.overallConfidence,
    manuallyVerified: false,
  };

  return {
    firstName,
    lastName,
    nationality, // 2-letter code for form
    preferredLanguage,
    passport,
  };
}
