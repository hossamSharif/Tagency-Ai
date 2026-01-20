import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { DashboardClient } from '@/components/features/dashboard/dashboard-client';
import { listPartnersAction } from '@/app/actions/partners';
import { getCashBankAccountsAction } from '@/app/actions/partner-entries';
import { getFinancialOverviewAction } from '@/app/actions/accounting';

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

  // Fetch data for dashboard in parallel
  const [partnersResult, accountsResult, financialResult] = await Promise.all([
    listPartnersAction({ status: 'active' }),
    getCashBankAccountsAction(),
    getFinancialOverviewAction(),
  ]);

  const partners = partnersResult.success ? partnersResult.data || [] : [];
  const accounts = accountsResult.success ? accountsResult.data || [] : [];
  const financialOverview = financialResult.success ? financialResult.data : null;

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
      <DashboardClient
        partners={partners}
        accounts={accounts}
        financialOverview={financialOverview}
      />
    </div>
  );
}
