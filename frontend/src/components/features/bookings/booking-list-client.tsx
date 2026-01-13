'use client';

/**
 * Booking List Client Component
 *
 * Client component for the bookings list page.
 * Receives initial data from server and handles client-side filtering.
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus, Search, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingCard } from '@/components/features/bookings/booking-card';
import { Booking, BookingStatus, PaymentStatus } from '@/types/models/booking';

interface BookingListClientProps {
  bookings: Booking[];
  locale: string;
}

export function BookingListClient({ bookings: initialBookings, locale }: BookingListClientProps) {
  const t = useTranslations('bookings');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all');

  // Filter bookings client-side
  const filteredBookings = useMemo(() => {
    return initialBookings.filter((booking) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          booking.bookingNumber.toLowerCase().includes(searchLower) ||
          booking.travelers.some(
            (t) =>
              t.firstName.toLowerCase().includes(searchLower) ||
              t.lastName.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (status !== 'all' && booking.status !== status) {
        return false;
      }

      // Payment status filter
      if (paymentStatus !== 'all' && booking.paymentStatus !== paymentStatus) {
        return false;
      }

      return true;
    });
  }, [initialBookings, search, status, paymentStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: filteredBookings.length })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/bookings/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t('createBooking')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as BookingStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="me-2 h-4 w-4" />
            <SelectValue placeholder={t('statusFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
            <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
            <SelectItem value="completed">{t('status.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={paymentStatus}
          onValueChange={(value) => setPaymentStatus(value as PaymentStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('paymentFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allPayments')}</SelectItem>
            <SelectItem value="unpaid">{t('paymentStatus.unpaid')}</SelectItem>
            <SelectItem value="partial">{t('paymentStatus.partial')}</SelectItem>
            <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t('noBookings')}</h3>
          <p className="text-muted-foreground max-w-sm mb-4">{t('noBookingsDescription')}</p>
          <Button asChild>
            <Link href={`/${locale}/bookings/new`}>
              <Plus className="me-2 h-4 w-4" />
              {t('createFirstBooking')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              locale={locale as 'ar' | 'en'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
