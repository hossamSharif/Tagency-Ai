// New Service Invoice Page - Server Component
// T041 [US1] Create new invoice page

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { NewInvoiceClient } from './new-invoice-client';
import { listCustomersAction } from '@/app/actions/customers';
import { getServiceCatalogItems } from '@/app/actions/services-catalog';
import { listPartnersAction } from '@/app/actions/partners';

interface NewInvoicePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewInvoicePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'invoices' });

  return {
    title: t('createInvoice'),
  };
}

export default async function NewInvoicePage({ params }: NewInvoicePageProps) {
  const { locale } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch required data for invoice form
  const [customersResult, servicesResult, partnersResult] = await Promise.all([
    listCustomersAction({ limit: 500 }),
    getServiceCatalogItems({ activeOnly: true }),
    listPartnersAction({ status: 'active', limit: 200 }),
  ]);

  const customers = customersResult.success && customersResult.data ? customersResult.data : [];
  const services = servicesResult.success && servicesResult.data ? servicesResult.data : [];
  const partners = partnersResult.success && partnersResult.data ? partnersResult.data : [];

  return (
    <NewInvoiceClient
      customers={customers}
      services={services}
      partners={partners}
      locale={locale}
    />
  );
}
