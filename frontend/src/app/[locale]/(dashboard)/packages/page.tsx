// Packages list page - Server Component
// Uses server-side data fetching with Admin SDK (bypasses Firestore security rules)

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { PackageListClient } from '@/components/features/packages/package-list-client';
import { listPackagesAction } from '@/app/actions/packages';
import { Package } from '@/types/models/package';

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

  // Require authentication
  await requireAuth(locale);

  // Fetch packages using server action (uses Admin SDK - bypasses security rules)
  const packagesResult = await listPackagesAction();

  const packages = (packagesResult.success && packagesResult.data
    ? packagesResult.data
    : []) as unknown as Package[];

  return <PackageListClient packages={packages} locale={locale} />;
}
