'use client';

// BookingCard component
// T113 [US2] Create BookingCard component

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  Eye,
  Pencil,
  FileText,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookingStatusBadge } from './booking-status-badge';
import { Booking } from '@/types/models/booking';
import { Timestamp } from 'firebase/firestore';

interface BookingCardProps {
  booking: Booking;
  locale?: 'ar' | 'en';
  onGenerateInvoice?: () => void;
  onCancel?: () => void;
}

export function BookingCard({
  booking,
  locale = 'ar',
  onGenerateInvoice,
  onCancel,
}: BookingCardProps) {
  const t = useTranslations('bookings');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: booking.currency,
    }).format(amount);
  };

  const primaryTraveler = booking.travelers.find((t) => t.isPrimary) || booking.travelers[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg font-mono">
              {booking.bookingNumber}
            </CardTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.packageSnapshot.name}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/bookings/${booking.id}`}>
                <Eye className="me-2 h-4 w-4" />
                {t('view')}
              </Link>
            </DropdownMenuItem>
            {booking.status === 'pending' && (
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/bookings/${booking.id}/edit`}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('edit')}
                </Link>
              </DropdownMenuItem>
            )}
            {onGenerateInvoice && !booking.invoiceId && booking.status !== 'cancelled' && (
              <DropdownMenuItem onClick={onGenerateInvoice}>
                <FileText className="me-2 h-4 w-4" />
                {t('generateInvoice')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onCancel && ['pending', 'confirmed'].includes(booking.status) && (
              <DropdownMenuItem
                onClick={onCancel}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="me-2 h-4 w-4" />
                {t('cancel')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {primaryTraveler.firstName} {primaryTraveler.lastName}
            {booking.travelers.length > 1 && (
              <span className="text-muted-foreground">
                {' '}+{booking.travelers.length - 1} {t('others')}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(booking.travelDate)}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">{t('paid')}: </span>
              <span className="font-medium">{formatCurrency(booking.paidAmount)}</span>
              <span className="text-muted-foreground"> / </span>
              <span>{formatCurrency(booking.totalAmount)}</span>
            </div>
          </div>

          <div className="text-end">
            {booking.balance > 0 && (
              <p className="text-sm font-medium text-destructive">
                {t('balance')}: {formatCurrency(booking.balance)}
              </p>
            )}
            {booking.paymentStatus === 'paid' && (
              <p className="text-sm font-medium text-green-600">
                {t('fullyPaid')}
              </p>
            )}
          </div>
        </div>

        {booking.source && (
          <div className="text-xs text-muted-foreground">
            {t('source')}: {t(booking.source)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
