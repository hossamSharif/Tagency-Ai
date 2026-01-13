// Customers list page - Server Component
// T118 [US2] Create customers list page

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { CustomerListClient } from '@/components/features/customers/customer-list-client';
import { listCustomersAction } from '@/app/actions/customers';

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CustomersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'customers' });

  return {
    title: t('title'),
  };
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { locale } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch initial customers using server action
  const result = await listCustomersAction();
  const customers = result.success && result.data ? result.data : [];

  return <CustomerListClient initialCustomers={customers} locale={locale} />;
}
