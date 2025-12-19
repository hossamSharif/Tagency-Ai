import { getTranslations } from 'next-intl/server';
import { requireRole, getSessionUser } from '@/lib/auth/require-role';
import { PartnerDashboard } from './partner-dashboard';

interface PartnerDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PartnerDashboardPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'لوحة تحكم الشريك' : 'Partner Dashboard',
  };
}

export default async function PartnerDashboardPage({ params }: PartnerDashboardPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  // This page is only accessible to partner role users
  const user = await getSessionUser();
  if (!user || user.role !== 'partner') {
    // Redirect to main dashboard if not a partner
    const { redirect } = await import('next/navigation');
    redirect(`/${locale}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isArabic ? 'لوحة تحكم الشريك' : 'Partner Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? 'عرض العمولات والتسويات الخاصة بك'
            : 'View your commissions and settlements'}
        </p>
      </div>

      {/* Dashboard Content */}
      <PartnerDashboard locale={locale} />
    </div>
  );
}
