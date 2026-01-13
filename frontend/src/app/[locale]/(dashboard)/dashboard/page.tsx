import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { DashboardClient } from '@/components/features/dashboard/dashboard-client';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  return {
    title: t('dashboard'),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  // Require authentication
  await requireAuth(locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'نظرة عامة على أداء عملك'
            : 'Overview of your business performance'}
        </p>
      </div>

      {/* Dashboard Content (Client Component) */}
      <DashboardClient />
    </div>
  );
}
