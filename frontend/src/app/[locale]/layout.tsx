import { Noto_Kufi_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, getDirection, type Locale } from '@/i18n';
import { Providers } from '@/components/providers';
import '../globals.css';

// Force dynamic rendering for all locale routes (required for authentication)
export const dynamic = 'force-dynamic';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic', 'latin'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return {
    title: {
      template: '%s | Agency AI',
      default: 'Agency AI',
    },
    description: locale === 'ar'
      ? 'منصة إدارة وكالات السفر بتقنية الذكاء الاصطناعي - باقات الحج والعمرة وشهر العسل'
      : 'AI-powered travel agency management platform - Hajj, Umrah, and honeymoon packages',
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Enable locale for this request
  setRequestLocale(locale);

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get direction for the locale
  const dir = getDirection(locale as Locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${notoKufiArabic.variable} font-arabic antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
