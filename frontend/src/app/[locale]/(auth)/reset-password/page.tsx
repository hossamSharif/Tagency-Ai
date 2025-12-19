import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('resetTitle'),
  };
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('resetTitle')}</h1>
      </div>

      <ResetPasswordForm locale={locale} />

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={`/${locale}/login`}
          className="text-primary hover:underline font-medium"
        >
          {locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
        </Link>
      </p>
    </div>
  );
}
