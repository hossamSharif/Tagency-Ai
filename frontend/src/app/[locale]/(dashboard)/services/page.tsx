// Services list page
// T021 [US2] Create services list page

import { getTranslations } from 'next-intl/server';
import { getServiceCatalogItems } from '@/app/actions/services-catalog';
import { ServiceListClient } from '@/components/features/services/service-list-client';

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: 'services' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as 'ar' | 'en';
  const t = await getTranslations({ locale, namespace: 'services' });

  // Fetch all services
  const result = await getServiceCatalogItems({ activeOnly: false });
  const services = result.success && result.data ? result.data : [];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Service List */}
      <ServiceListClient services={services} locale={locale} />
    </div>
  );
}
