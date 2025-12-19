import { Noto_Kufi_Arabic, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, getDirection, type Locale } from '@/i18n';
import { Providers } from '@/components/providers';
import '../globals.css';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: {
      template: isArabic ? '%s | وكالة السفر' : '%s | Travel Agency',
      default: isArabic ? 'وكالة السفر' : 'Travel Agency',
    },
    description: isArabic
      ? 'منصة إدارة وكالات السفر - باقات الحج والعمرة وشهر العسل'
      : 'Travel agency management platform - Hajj, Umrah, and honeymoon packages',
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get direction for the locale
  const dir = getDirection(locale as Locale);
  const isArabic = locale === 'ar';

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${notoKufiArabic.variable} ${inter.variable} ${
          isArabic ? 'font-arabic' : 'font-sans'
        } antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
