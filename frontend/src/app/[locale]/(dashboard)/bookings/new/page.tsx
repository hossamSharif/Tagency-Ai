// Booking create page - Server Component
// T122 [US2] Create booking create page

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { BookingFormClient } from '@/components/features/bookings/booking-form-client';
import { listCustomersAction } from '@/app/actions/customers';
import { listPackagesAction } from '@/app/actions/packages';
import { Customer } from '@/types/models/customer';
import { Package } from '@/types/models/package';

interface NewBookingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ customerId?: string; packageId?: string }>;
}

export async function generateMetadata({ params }: NewBookingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bookings' });

  return {
    title: t('createBooking'),
  };
}

export default async function NewBookingPage({ params, searchParams }: NewBookingPageProps) {
  const { locale } = await params;
  const { customerId, packageId } = await searchParams;

  // Require authentication
  await requireAuth(locale);

  // Fetch customers and active packages using server actions
  const [customersResult, packagesResult] = await Promise.all([
    listCustomersAction(),
    listPackagesAction({ status: 'active' }),
  ]);

  const customers = (customersResult.success && customersResult.data
    ? customersResult.data
    : []) as Customer[];

  const packages = (packagesResult.success && packagesResult.data
    ? packagesResult.data
    : []) as unknown as Package[];

  return (
    <BookingFormClient
      customers={customers}
      packages={packages}
      locale={locale}
      preselectedCustomerId={customerId}
      preselectedPackageId={packageId}
    />
  );
}
