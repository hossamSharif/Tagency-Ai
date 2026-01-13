// Service detail/edit page
// T022 [US2] Create service detail/edit page

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceCatalogItem } from '@/app/actions/services-catalog';
import { ServiceForm } from '@/components/features/services/service-form';

interface ServiceDetailPageProps {
  params: Promise<{ locale: string; serviceId: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: 'services' });
  return {
    title: t('editService'),
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const resolvedParams = await params;
  const { locale, serviceId } = resolvedParams;
  const typedLocale = locale as 'ar' | 'en';
  const t = await getTranslations({ locale, namespace: 'services' });

  // Fetch service
  const result = await getServiceCatalogItem(serviceId);

  if (!result.success || !result.data) {
    notFound();
  }

  const service = result.data;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Back Button */}
      <Link href={`/${locale}/services`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
          {t('backToList')}
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{t('editService')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar' ? service.nameAr : service.name}
        </p>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm service={service} locale={typedLocale} />
        </CardContent>
      </Card>
    </div>
  );
}
