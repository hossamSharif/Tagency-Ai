'use client';

// Booking create page
// T122 [US2] Create booking create page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookingForm } from '@/components/features/bookings/booking-form';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useCustomers } from '@/hooks/use-customers';
import { usePackages } from '@/hooks/use-packages';
import { createBookingAction } from '@/app/actions/bookings';
import { CreateBookingInput } from '@/lib/validations/bookings';
import { toast } from 'sonner';

export default function NewBookingPage() {
  const t = useTranslations('bookings');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const preselectedCustomerId = searchParams.get('customerId') || undefined;
  const preselectedPackageId = searchParams.get('packageId') || undefined;

  const { user } = useAuth();
  const { tenant } = useTenant();
  const { customers, loading: customersLoading } = useCustomers();
  const { packages, loading: packagesLoading } = usePackages();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateBookingInput) => {
    if (!tenant?.id || !user?.uid) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await createBookingAction(tenant.id, user.uid, data);

      if (result.success && result.data) {
        toast.success(t('bookingCreated'));
        router.push(`/${locale}/bookings/${result.data.id}`);
      } else {
        toast.error(result.error || t('errors.createFailed'));
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (customersLoading || packagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
