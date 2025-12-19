import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/require-role';
import { SettlementsManager } from './settlements-manager';

interface SettlementsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettlementsPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'التسويات' : 'Settlements',
  };
}

export default async function SettlementsPage({ params }: SettlementsPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  // Require admin role
  await requireRole('admin', locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isArabic ? 'إدارة التسويات' : 'Settlement Management'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? 'عرض وإدارة تسويات العمولات للشركاء'
            : 'View and manage partner commission settlements'}
        </p>
      </div>

      {/* Settlements Manager */}
      <SettlementsManager locale={locale} />
    </div>
  );
}
