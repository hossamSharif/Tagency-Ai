import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-role';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, DollarSign, Users, Handshake } from 'lucide-react';

interface ReportsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ReportsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  return {
    title: t('title'),
  };
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  // Require authentication
  await requireAuth(locale);

  const reports = [
    {
      title: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      description: locale === 'ar' ? 'نظرة عامة على أداء العمل' : 'Business performance overview',
      href: `/${locale}`,
      icon: BarChart3,
    },
    {
      title: t('sales'),
      description: locale === 'ar' ? 'تقرير المبيعات والإيرادات' : 'Sales and revenue report',
      href: `/${locale}/reports/sales`,
      icon: DollarSign,
    },
    {
      title: t('commissions'),
      description: locale === 'ar' ? 'تقرير العمولات والتسويات' : 'Commissions and settlements report',
      href: `/${locale}/reports/commissions`,
      icon: Handshake,
    },
    {
      title: locale === 'ar' ? 'نشاط العملاء' : 'Customer Activity',
      description: locale === 'ar' ? 'تحليل سلوك العملاء' : 'Customer behavior analysis',
      href: `/${locale}/reports/customers`,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'الوصول إلى التقارير والتحليلات التفصيلية'
            : 'Access detailed reports and analytics'}
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.href} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <report.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={report.href}>
                  {locale === 'ar' ? 'عرض التقرير' : 'View Report'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
