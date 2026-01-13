// Language inference from nationality/country code
// Used to auto-set preferred language when scanning passport

export const ARABIC_COUNTRIES = [
  'SA', 'AE', 'EG', 'SD', 'YE', 'JO', 'SY', 'IQ',
  'KW', 'QA', 'BH', 'OM', 'LB', 'MA', 'DZ', 'TN',
  'PS', 'MR', 'SO', 'DJ', 'KM',
] as const;

export const ENGLISH_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'SG',
] as const;

/**
 * Infer preferred language from nationality/country code
 * @param countryCode - 2-letter ISO country code (e.g., 'SA', 'US')
 * @returns 'ar' for Arabic countries, 'en' for English countries, defaults to 'ar'
 */
export function inferLanguageFromNationality(
  countryCode: string
): 'ar' | 'en' {
  const code = countryCode.toUpperCase();

  if (ARABIC_COUNTRIES.includes(code as any)) {
    return 'ar';
  }

  if (ENGLISH_COUNTRIES.includes(code as any)) {
    return 'en';
  }

  // Default to Arabic for travel agency in Middle East
  return 'ar';
}
