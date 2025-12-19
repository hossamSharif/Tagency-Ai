import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { PackageDetails } from '@/components/features/packages/package-details';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import type { PackageWithServices, Service } from '@/types/models/package';

interface PackageDetailPageProps {
  params: Promise<{ locale: string; packageId: string }>;
}

async function getPackage(tenantId: string, packageId: string): Promise<PackageWithServices | null> {
  const packageRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('packages')
    .doc(packageId);

  const packageDoc = await packageRef.get();

  if (!packageDoc.exists) {
    return null;
  }

  const packageData = packageDoc.data()!;

  // Get services
  const servicesSnapshot = await packageRef
    .collection('services')
    .orderBy('displayOrder', 'asc')
    .get();

  const services = servicesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Service[];

  return {
    id: packageDoc.id,
    ...packageData,
    services,
  } as PackageWithServices;
}

export async function generateMetadata({ params }: PackageDetailPageProps) {
  const { locale, packageId } = await params;
  const user = await requireAuth(locale);

  const pkg = await getPackage(user.tenantId, packageId);

  if (!pkg) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: pkg.name,
  };
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { locale, packageId } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });
  const isArabic = locale === 'ar';

  // Require authentication
  const user = await requireAuth(locale);

  // Get package data
  const pkg = await getPackage(user.tenantId, packageId);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/packages`}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{pkg.name}</h1>
            <p className="text-muted-foreground">
              {isArabic ? 'تفاصيل الباقة' : 'Package Details'}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/packages/${packageId}/edit`}>
            <Edit className="me-2 h-4 w-4" />
            {t('edit')}
          </Link>
        </Button>
      </div>

      {/* Package Details */}
      <PackageDetails package={pkg} locale={locale} />
    </div>
  );
}
