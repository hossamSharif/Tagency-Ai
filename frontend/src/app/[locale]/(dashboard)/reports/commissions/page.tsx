import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-role';
import { CommissionsReportClient } from '@/components/features/reports/commissions-report-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CommissionsReportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CommissionsReportPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  return {
    title: t('commissions'),
  };
}

export default async function CommissionsReportPage({ params }: CommissionsReportPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  // Require authentication
  await requireAuth(locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/reports`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('commissions')}</h1>
          <p className="text-muted-foreground">
            {locale === 'ar'
              ? 'تحليل العمولات والتسويات مع الشركاء'
              : 'Commission and settlement analysis with partners'}
          </p>
        </div>
      </div>

      {/* Commissions Report Content */}
      <CommissionsReportClient />
    </div>
  );
}
