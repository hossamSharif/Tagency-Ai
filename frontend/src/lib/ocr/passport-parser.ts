// Passport MRZ parsing logic
// T090 [US2] Implement passport data extraction logic (MRZ parsing)

import { MRZData, PassportScanResult, PassportFormData } from '@/types/models/passport';

// MRZ character to date conversion (YYMMDD -> YYYY-MM-DD)
function parseMRZDate(mrzDate: string): string | undefined {
  if (!mrzDate || mrzDate.length !== 6) return undefined;

  const year = parseInt(mrzDate.substring(0, 2), 10);
  const month = mrzDate.substring(2, 4);
  const day = mrzDate.substring(4, 6);

  // Determine century (00-29 = 2000s, 30-99 = 1900s)
  const fullYear = year <= 29 ? 2000 + year : 1900 + year;

  return `${fullYear}-${month}-${day}`;
}

// Clean MRZ name field (replace < with spaces, trim)
function cleanMRZName(name: string): string {
  return name
    .replace(/</g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Validate MRZ check digit
function validateCheckDigit(data: string, checkDigit: string): boolean {
  const weights = [7, 3, 1];
  const charValues: Record<string, number> = {
    '<': 0,
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
  };

  // Add letter values A-Z (10-35)
  for (let i = 0; i < 26; i++) {
    charValues[String.fromCharCode(65 + i)] = i + 10;
  }

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i].toUpperCase();
    const value = charValues[char] ?? 0;
    sum += value * weights[i % 3];
  }

  const expectedDigit = (sum % 10).toString();
  return expectedDigit === checkDigit;
}

/**
 * Parse MRZ lines from a passport
 * Standard TD3 passport has 2 lines of 44 characters each
 */
export function parseMRZ(lines: string[]): MRZData | null {
  // Find MRZ lines (44 characters, starting with P)
  const mrzLines = lines
    .map((line) => line.replace(/\s/g, '').toUpperCase())
    .filter((line) => line.length >= 42 && line.length <= 46);

  if (mrzLines.length < 2) {
    return null;
  }

  // Find the line starting with P (passport)
  const line1Index = mrzLines.findIndex((line) => line.startsWith('P'));
  if (line1Index === -1 || line1Index >= mrzLines.length - 1) {
    return null;
  }

  const line1 = mrzLines[line1Index].padEnd(44, '<').substring(0, 44);
  const line2 = mrzLines[line1Index + 1].padEnd(44, '<').substring(0, 44);

  try {
    // Line 1 format: P<COUNTRY<SURNAME<<GIVEN<NAMES<<<...
    const documentType = line1.substring(0, 1);
    const issuingCountry = line1.substring(2, 5).replace(/</g, '');

    // Parse names (position 5-43)
    const namesSection = line1.substring(5, 44);
    const namesSplit = namesSection.split('<<');
    const lastName = cleanMRZName(namesSplit[0] || '');
    const firstName = cleanMRZName(namesSplit.slice(1).join(' '));

    // Line 2 format: PASSPORT#<CHECK<NATIONALITY<DOB<CHECK<SEX<EXPIRY<CHECK<PERSONAL#<CHECK<COMPOSITE
    const passportNumber = line2.substring(0, 9).replace(/</g, '');
    const passportCheck = line2.substring(9, 10);
    const nationality = line2.substring(10, 13).replace(/</g, '');
    const dateOfBirth = line2.substring(13, 19);
    const dobCheck = line2.substring(19, 20);
    const gender = line2.substring(20, 21) as 'M' | 'F' | '<';
    const expiryDate = line2.substring(21, 27);
    const expiryCheck = line2.substring(27, 28);
    const personalNumber = line2.substring(28, 42).replace(/</g, '') || undefined;
    const compositeCheck = line2.substring(43, 44);

    // Validate check digits
    const checkDigits = {
      passportNumber: validateCheckDigit(line2.substring(0, 9), passportCheck),
      dateOfBirth: validateCheckDigit(dateOfBirth, dobCheck),
      expiryDate: validateCheckDigit(expiryDate, expiryCheck),
      composite: validateCheckDigit(
        line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43),
        compositeCheck
      ),
    };

    return {
      documentType,
      issuingCountry,
      lastName,
      firstName,
      passportNumber,
      nationality,
      dateOfBirth,
      gender,
      expiryDate,
      personalNumber,
      checkDigits,
    };
  } catch {
    return null;
  }
}

/**
 * Extract passport data from OCR text
 * Attempts MRZ parsing first, then falls back to field extraction
 */
export function extractPassportData(
  ocrText: string,
  ocrLines: string[],
  confidence: number,
  processingTime: number
): PassportScanResult {
  const startTime = Date.now();
  const warnings: string[] = [];

  // Try MRZ parsing first
  const mrzData = parseMRZ(ocrLines);
  const mrzDetected = mrzData !== null;

  if (mrzData) {
    // Validate check digits
    if (mrzData.checkDigits) {
      if (!mrzData.checkDigits.passportNumber) {
        warnings.push('Passport number check digit validation failed');
      }
      if (!mrzData.checkDigits.dateOfBirth) {
        warnings.push('Date of birth check digit validation failed');
      }
      if (!mrzData.checkDigits.expiryDate) {
        warnings.push('Expiry date check digit validation failed');
      }
    }

    const fullName = `${mrzData.firstName} ${mrzData.lastName}`.trim();

    return {
      rawText: ocrText,
      overallConfidence: confidence,
      mrzData,
      mrzDetected: true,
      extractedData: {
        passportNumber: mrzData.passportNumber,
        fullName,
        firstName: mrzData.firstName,
        lastName: mrzData.lastName,
        dateOfBirth: parseMRZDate(mrzData.dateOfBirth),
        expiryDate: parseMRZDate(mrzData.expiryDate),
        nationality: mrzData.nationality,
        gender: mrzData.gender === '<' ? undefined : mrzData.gender,
        issuingCountry: mrzData.issuingCountry,
      },
      fieldConfidence: {
        passportNumber: confidence * (mrzData.checkDigits?.passportNumber ? 1 : 0.7),
        fullName: confidence * 0.9,
        dateOfBirth: confidence * (mrzData.checkDigits?.dateOfBirth ? 1 : 0.7),
        expiryDate: confidence * (mrzData.checkDigits?.expiryDate ? 1 : 0.7),
        nationality: confidence * 0.95,
        gender: confidence * 0.95,
      },
      processingTime: processingTime + (Date.now() - startTime),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // Fallback: Try to extract fields from VIZ (Visual Inspection Zone)
  warnings.push('MRZ not detected, attempting field extraction from text');
  const extractedData = extractFieldsFromText(ocrText);

  return {
    rawText: ocrText,
    overallConfidence: confidence * 0.6, // Lower confidence for non-MRZ extraction
    mrzDetected: false,
    extractedData,
    fieldConfidence: {
      passportNumber: extractedData.passportNumber ? 0.5 : 0,
      fullName: extractedData.fullName ? 0.5 : 0,
      dateOfBirth: extractedData.dateOfBirth ? 0.4 : 0,
      expiryDate: extractedData.expiryDate ? 0.4 : 0,
    },
    processingTime: processingTime + (Date.now() - startTime),
    warnings,
  };
}

/**
 * Extract passport fields from plain text (fallback when MRZ not detected)
 */
function extractFieldsFromText(text: string): PassportScanResult['extractedData'] {
  const result: PassportScanResult['extractedData'] = {};
  const lines = text.split('\n').map((l) => l.trim());

  // Passport number pattern (alphanumeric, 6-9 characters)
  const passportMatch = text.match(/\b([A-Z]{1,2}[0-9]{6,8}|[0-9]{8,9})\b/i);
  if (passportMatch) {
    result.passportNumber = passportMatch[1].toUpperCase();
  }

  // Date patterns (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g;
  const dates = text.match(datePattern) || [];

  if (dates.length >= 1) {
    result.dateOfBirth = normalizeDate(dates[0]);
  }
  if (dates.length >= 2) {
    result.expiryDate = normalizeDate(dates[1]);
  }

  // Gender
  const genderMatch = text.match(/\b(MALE|FEMALE|M|F)\b/i);
  if (genderMatch) {
    const g = genderMatch[1].toUpperCase();
    result.gender = (g === 'MALE' || g === 'M') ? 'M' : 'F';
  }

  // Nationality patterns (3-letter country codes)
  const nationalityMatch = text.match(/\b(NATIONALITY|NAT)[:\s]*([A-Z]{3})\b/i);
  if (nationalityMatch) {
    result.nationality = nationalityMatch[2];
  }

  return result;
}

/**
 * Normalize date string to ISO format (YYYY-MM-DD)
 */
function normalizeDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Try different date formats
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length !== 3) return undefined;

  let year: number, month: number, day: number;

  if (parts[0].length === 4) {
    // YYYY-MM-DD format
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (parts[2].length === 4) {
    // DD-MM-YYYY format
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    // DD-MM-YY format
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    const shortYear = parseInt(parts[2], 10);
    year = shortYear > 50 ? 1900 + shortYear : 2000 + shortYear;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  if (month < 1 || month > 12) return undefined;
  if (day < 1 || day > 31) return undefined;

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Convert passport form data to database format
 */
export function formDataToPassportData(formData: PassportFormData): {
  passportNumber: string;
  fullName: string;
  dateOfBirth: Date;
  expiryDate: Date;
  nationality: string;
  gender: 'M' | 'F';
  issuingCountry: string;
  manuallyVerified: boolean;
} {
  return {
    passportNumber: formData.passportNumber.toUpperCase(),
    fullName: formData.fullName,
    dateOfBirth: new Date(formData.dateOfBirth),
    expiryDate: new Date(formData.expiryDate),
    nationality: formData.nationality.toUpperCase(),
    gender: formData.gender,
    issuingCountry: formData.issuingCountry.toUpperCase(),
    manuallyVerified: true,
  };
}

/**
 * Validate passport form data
 */
export function validatePassportData(data: PassportFormData): string[] {
  const errors: string[] = [];

  if (!data.passportNumber || data.passportNumber.length < 6) {
    errors.push('Invalid passport number');
  }

  if (!data.fullName || data.fullName.length < 2) {
    errors.push('Full name is required');
  }

  const dob = new Date(data.dateOfBirth);
  if (isNaN(dob.getTime())) {
    errors.push('Invalid date of birth');
  } else if (dob > new Date()) {
    errors.push('Date of birth cannot be in the future');
  }

  const expiry = new Date(data.expiryDate);
  if (isNaN(expiry.getTime())) {
    errors.push('Invalid expiry date');
  } else if (expiry < new Date()) {
    errors.push('Passport has expired');
  }

  if (!data.nationality || data.nationality.length !== 3) {
    errors.push('Invalid nationality (must be 3-letter country code)');
  }

  if (!data.issuingCountry || data.issuingCountry.length !== 3) {
    errors.push('Invalid issuing country (must be 3-letter country code)');
  }

  return errors;
}
