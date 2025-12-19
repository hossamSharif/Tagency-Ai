import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRoles } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { PackageForm } from '@/components/forms/package-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Package } from '@/types/models/package';

interface EditPackagePageProps {
  params: Promise<{ locale: string; packageId: string }>;
}

async function getPackage(tenantId: string, packageId: string): Promise<Package | null> {
  const packageDoc = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('packages')
    .doc(packageId)
    .get();

  if (!packageDoc.exists) {
    return null;
  }

  return {
    id: packageDoc.id,
    ...packageDoc.data(),
  } as Package;
}

export async function generateMetadata({ params }: EditPackagePageProps) {
  const { locale, packageId } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });
  const user = await requireRoles(['owner', 'admin', 'staff'], locale);

  const pkg = await getPackage(user.tenantId, packageId);

  if (!pkg) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${t('edit')} - ${pkg.name}`,
  };
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { locale, packageId } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });
  const isArabic = locale === 'ar';

  // Require admin or staff role
  const user = await requireRoles(['owner', 'admin', 'staff'], locale);

  // Get package data
  const pkg = await getPackage(user.tenantId, packageId);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/packages/${packageId}`}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('edit')}</h1>
          <p className="text-muted-foreground">{pkg.name}</p>
        </div>
      </div>

      <PackageForm locale={locale} mode="edit" initialData={pkg as any} />
    </div>
  );
}
