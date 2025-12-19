import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LoginForm } from '@/components/forms/login-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('loginTitle'),
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <LoginForm locale={locale} />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        {t('dontHaveAccount')}{' '}
        <Link
          href={`/${locale}/signup`}
          className="text-primary hover:underline font-medium"
        >
          {t('signup')}
        </Link>
      </p>
    </div>
  );
}
