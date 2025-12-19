import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

/**
 * Internationalization middleware
 * Handles locale detection and routing
 */
export default createMiddleware({
  // Supported locales
  locales,

  // Default locale (Arabic)
  defaultLocale,

  // Always show locale prefix in URL
  localePrefix: 'always',

  // Locale detection settings
  localeDetection: true,
});

/**
 * Matcher configuration
 * Matches all paths except:
 * - API routes (/api/*)
 * - Next.js internals (/_next/*)
 * - Vercel internals (/_vercel/*)
 * - Static files (files with extensions like .jpg, .png, etc.)
 */
export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /static (static files)
    // - Files with extensions (e.g., favicon.ico)
    '/((?!api|_next|_vercel|static|.*\\..*).*)',

    // Always run for the root path
    '/',
  ],
};
