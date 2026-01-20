import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/require-role';
import { listPartnersAction } from '@/app/actions/partners';
import { getCashBankAccountsAction } from '@/app/actions/partner-entries';
import { PartnerEntriesPageClient } from './partner-entries-page-client';

interface PartnerEntriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PartnerEntriesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partnerEntries' });

  return {
    title: t('title'),
  };
}

export default async function PartnerEntriesPage({ params }: PartnerEntriesPageProps) {
  const { locale } = await params;

  // Require admin role for partner entries
  await requireRole('admin', locale);

  // Fetch partners and accounts in parallel
  const [partnersResult, accountsResult] = await Promise.all([
    listPartnersAction({ status: 'active' }),
    getCashBankAccountsAction(),
  ]);

  const partners = partnersResult.success ? partnersResult.data : [];
  const accounts = accountsResult.success ? accountsResult.data : [];

  return (
    <PartnerEntriesPageClient
      locale={locale}
      partners={partners}
      accounts={accounts}
    />
  );
}
