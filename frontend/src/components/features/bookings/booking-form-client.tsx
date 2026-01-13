'use client';

/**
 * Booking Form Client Component
 *
 * Client component for the booking creation form.
 * Receives initial data from server and handles client-side interactions.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookingForm } from '@/components/features/bookings/booking-form';
import { createBookingAction } from '@/app/actions/bookings';
import { CreateBookingInput } from '@/lib/validations/bookings';
import { Customer } from '@/types/models/customer';
import { Package } from '@/types/models/package';
import { toast } from 'sonner';

interface BookingFormClientProps {
  customers: Customer[];
  packages: Package[];
  locale: string;
  preselectedCustomerId?: string;
  preselectedPackageId?: string;
}

export function BookingFormClient({
  customers,
  packages,
  locale,
  preselectedCustomerId,
  preselectedPackageId,
}: BookingFormClientProps) {
  const t = useTranslations('bookings');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateBookingInput) => {
    setIsLoading(true);
    try {
      const result = await createBookingAction(data);

      if (!result.success) {
        toast.error(result.error || t('errors.createFailed'));
        return;
      }
      toast.success(t('bookingCreated'));
      router.push(`/${locale}/bookings/${result.data.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('createBooking')}</h1>
          <p className="text-muted-foreground">{t('createBookingDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <BookingForm
        customers={customers}
        packages={packages}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/bookings`)}
        isLoading={isLoading}
        preselectedCustomerId={preselectedCustomerId}
        preselectedPackageId={preselectedPackageId}
      />
    </div>
  );
}
