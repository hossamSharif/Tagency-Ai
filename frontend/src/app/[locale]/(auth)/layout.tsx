import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic';

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('loginTitle'),
  };
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params;

  // Enable static rendering for this page
  setRequestLocale(locale);

  const isArabic = locale === 'ar';

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="py-4 px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Agency AI"
            width={40}
            height={40}
            className="flex-shrink-0"
            priority
          />
          <span className="text-xl font-bold text-foreground">
            Agency AI
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border p-8">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()}{' '}
Agency AI. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </p>
      </footer>
    </div>
  );
}
