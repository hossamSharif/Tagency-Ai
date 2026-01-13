// New service page
// T023 [US2] Create new service page

import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceForm } from '@/components/features/services/service-form';

interface NewServicePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewServicePageProps) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: 'services' });
  return {
    title: t('newService'),
  };
}

export default async function NewServicePage({ params }: NewServicePageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as 'ar' | 'en';
  const t = await getTranslations({ locale, namespace: 'services' });

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
        <h1 className="text-3xl font-bold">{t('newService')}</h1>
        <p className="text-muted-foreground">{t('newServiceDescription')}</p>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
