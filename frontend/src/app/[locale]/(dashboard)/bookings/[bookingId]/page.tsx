// Booking detail page - Server Component
// T123 [US2] Create booking detail page

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-role';
import { Button } from '@/components/ui/button';
import { BookingDetailClient } from '@/components/features/bookings/booking-detail-client';
import { getBookingAction } from '@/app/actions/bookings';
import { getCustomerAction } from '@/app/actions/customers';
import { Booking } from '@/types/models/booking';
import { Customer } from '@/types/models/customer';

interface BookingDetailPageProps {
  params: Promise<{ locale: string; bookingId: string }>;
}

export async function generateMetadata({ params }: BookingDetailPageProps) {
  const { locale, bookingId } = await params;
  const t = await getTranslations({ locale, namespace: 'bookings' });

  // Try to get booking for title
  const bookingResult = await getBookingAction(bookingId);
  const bookingNumber = bookingResult.success ? bookingResult.data.bookingNumber : bookingId;

  return {
    title: `${t('booking')} ${bookingNumber}`,
  };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { locale, bookingId } = await params;
  const t = await getTranslations({ locale, namespace: 'bookings' });

  // Require authentication
  await requireAuth(locale);

  // Fetch booking using server action
  const bookingResult = await getBookingAction(bookingId);

  if (!bookingResult.success) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{bookingResult.error || t('bookingNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/bookings`}>{t('backToList')}</Link>
        </Button>
      </div>
    );
  }

  if (!bookingResult.data) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{t('bookingNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/bookings`}>{t('backToList')}</Link>
        </Button>
      </div>
    );
  }

  const booking = bookingResult.data as Booking;

  // Fetch customer data
  let customer: Customer | null = null;
  if (booking.customerId) {
    const customerResult = await getCustomerAction(booking.customerId);
    if (customerResult.success && customerResult.data) {
      customer = customerResult.data;
    }
  }

  return (
    <BookingDetailClient
      booking={booking}
      customer={customer}
      locale={locale}
    />
  );
}
