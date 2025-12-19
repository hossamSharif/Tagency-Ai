import { getTranslations } from 'next-intl/server';
import { requireRoles } from '@/lib/auth/require-role';
import { PackageForm } from '@/components/forms/package-form';

interface NewPackagePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewPackagePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });

  return {
    title: t('create'),
  };
}

export default async function NewPackagePage({ params }: NewPackagePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });

  // Require admin or staff role
  await requireRoles(['owner', 'admin', 'staff'], locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('create')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'أنشئ باقة سفر جديدة مع الخدمات'
            : 'Create a new travel package with services'}
        </p>
      </div>

      <PackageForm locale={locale} mode="create" />
    </div>
  );
}
