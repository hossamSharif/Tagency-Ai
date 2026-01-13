import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency value with proper locale and currency
 * Always uses English numerals (0-9) regardless of locale
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., 'SAR', 'USD')
 * @param locale - Locale for formatting (always uses 'en-US' to ensure English numerals)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'SAR',
  locale: string = 'en-US'
): string {
  try {
    // Always use 'en-US' locale to ensure English numerals (0-9) instead of Arabic numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}
