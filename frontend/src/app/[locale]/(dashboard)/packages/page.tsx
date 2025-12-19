import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-role';
import { PackageList } from '@/components/features/packages/package-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PackagesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PackagesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });

  return {
    title: t('title'),
  };
}

export default async function PackagesPage({ params }: PackagesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });

  // Require authentication
  await requireAuth(locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {locale === 'ar'
              ? 'إدارة باقات السفر والخدمات'
              : 'Manage your travel packages and services'}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/packages/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t('create')}
          </Link>
        </Button>
      </div>

      {/* Package List */}
      <PackageList
        locale={locale}
        onCreateNew={() => {
          // This is handled by the Link above in SSR
        }}
      />
    </div>
  );
}
