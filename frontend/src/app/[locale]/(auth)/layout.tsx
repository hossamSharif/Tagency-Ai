import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

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
  const isArabic = locale === 'ar';

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="py-4 px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">
              {isArabic ? 'و' : 'T'}
            </span>
          </div>
          <span className="text-xl font-bold text-foreground">
            {isArabic ? 'وكالة السفر' : 'Travel Agency'}
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
          {isArabic ? 'وكالة السفر. جميع الحقوق محفوظة.' : 'Travel Agency. All rights reserved.'}
        </p>
      </footer>
    </div>
  );
}
