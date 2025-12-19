import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { SignupForm } from '@/components/forms/signup-form';

interface SignupPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SignupPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('signupTitle'),
  };
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('signupTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('startFreeTrial')}</p>
      </div>

      <SignupForm locale={locale} />

      <p className="text-center text-sm text-muted-foreground">
        {t('alreadyHaveAccount')}{' '}
        <Link
          href={`/${locale}/login`}
          className="text-primary hover:underline font-medium"
        >
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
