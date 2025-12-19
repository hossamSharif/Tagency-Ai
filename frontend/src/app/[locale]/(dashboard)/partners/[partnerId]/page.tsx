import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/require-role';
import { PartnerDetails } from './partner-details';

interface PartnerPageProps {
  params: Promise<{ locale: string; partnerId: string }>;
}

export async function generateMetadata({ params }: PartnerPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'تفاصيل الشريك' : 'Partner Details',
  };
}

export default async function PartnerPage({ params }: PartnerPageProps) {
  const { locale, partnerId } = await params;

  // Require admin role
  await requireRole('admin', locale);

  return <PartnerDetails partnerId={partnerId} locale={locale} />;
}
