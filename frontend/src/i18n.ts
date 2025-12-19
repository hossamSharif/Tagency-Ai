import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

/**
 * Supported locales
 */
export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

/**
 * Default locale (Arabic first)
 */
export const defaultLocale: Locale = 'ar';

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get the direction for a locale
 */
export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Locale display names
 */
export const localeNames: Record<Locale, { native: string; english: string }> = {
  ar: { native: 'العربية', english: 'Arabic' },
  en: { native: 'English', english: 'English' },
};

/**
 * next-intl configuration
 */
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Riyadh',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        medium: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'SAR',
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
      },
    },
  };
});
