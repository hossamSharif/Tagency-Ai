// Bookings list page - Server Component
// T121 [US2] Create bookings list page

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { BookingListClient } from '@/components/features/bookings/booking-list-client';
import { listBookingsAction } from '@/app/actions/bookings';
import { Booking } from '@/types/models/booking';

interface BookingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BookingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bookings' });

  return {
    title: t('title'),
  };
}

export default async function BookingsPage({ params }: BookingsPageProps) {
  const { locale } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch bookings using server action
  const bookingsResult = await listBookingsAction();

  const bookings = (bookingsResult.success && bookingsResult.data
    ? bookingsResult.data
    : []) as Booking[];

  return <BookingListClient bookings={bookings} locale={locale} />;
}
