'use client';

/**
 * Booking Detail Client Component
 *
 * Client component for the booking detail page.
 * Receives initial data from server and handles client-side interactions.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Package,
} from 'lucide-react';
import { useTenant } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/features/bookings/booking-status-badge';
import { TravelerForm } from '@/components/features/bookings/traveler-form';
import { DocumentList } from '@/components/features/bookings/document-list';
import { DocumentUploader } from '@/components/features/bookings/document-uploader';
import {
  updateBookingStatusAction,
  updateTravelerPassportAction,
  cancelBookingAction,
} from '@/app/actions/bookings';
import { Booking, Traveler } from '@/types/models/booking';
import { Customer } from '@/types/models/customer';
import { PassportFormData } from '@/types/models/passport';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BookingDetailClientProps {
  booking: Booking;
  customer: Customer | null;
  locale: string;
}

export function BookingDetailClient({
  booking: initialBooking,
  customer,
  locale,
}: BookingDetailClientProps) {
  const t = useTranslations('bookings');
  const router = useRouter();
  const dateLocale = locale === 'ar' ? ar : enUS;

  const [booking, setBooking] = useState(initialBooking);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (timestamp: string | { toDate?: () => Date } | Date) => {
    try {
      let date: Date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else {
        return 'N/A';
      }
      return format(date, 'dd MMMM yyyy', { locale: dateLocale });
    } catch {
      return 'N/A';
    }
  };

  const { tenant } = useTenant();
  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals, use booking or tenant currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: booking?.currency || tenant?.currency || 'SAR',
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: 'confirmed' | 'in_progress' | 'completed') => {
    setIsLoading(true);
    try {
      const result = await updateBookingStatusAction(booking.id, { status: newStatus });

      if (result.success) {
        setBooking((prev) => ({ ...prev, status: newStatus }));
        toast.success(t('statusUpdated'));
        router.refresh();
      } else {
        toast.error(result.error || t('errors.statusFailed'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('errors.statusFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const result = await cancelBookingAction(booking.id);

      if (result.success) {
        setBooking((prev) => ({ ...prev, status: 'cancelled' }));
        toast.success(t('bookingCancelled'));
        router.refresh();
      } else {
        toast.error(result.error || t('errors.cancelFailed'));
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('errors.cancelFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTravelerUpdate = (index: number, data: Partial<Traveler>) => {
    console.log('Update traveler:', index, data);
  };

  const handlePassportScan = async (index: number, passport: PassportFormData) => {
    try {
      const result = await updateTravelerPassportAction(booking.id, index, passport);

      if (result.success) {
        toast.success(t('passportSaved'));
        router.refresh();
      } else {
        toast.error(result.error || t('errors.passportFailed'));
      }
    } catch (error) {
      console.error('Error saving passport:', error);
      toast.error(t('errors.passportFailed'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/bookings`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{booking.bookingNumber}</h1>
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
            <p className="text-muted-foreground">
              {t('createdOn')} {formatDate(booking.createdAt as unknown as string)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <Button onClick={() => handleStatusChange('confirmed')} disabled={isLoading}>
              <CheckCircle className="me-2 h-4 w-4" />
              {t('confirm')}
            </Button>
          )}
          {booking.status === 'confirmed' && (
            <Button onClick={() => handleStatusChange('in_progress')} disabled={isLoading}>
              <Clock className="me-2 h-4 w-4" />
              {t('startTrip')}
            </Button>
          )}
          {booking.status === 'in_progress' && (
            <Button onClick={() => handleStatusChange('completed')} disabled={isLoading}>
              <CheckCircle className="me-2 h-4 w-4" />
              {t('complete')}
            </Button>
          )}
          {['pending', 'confirmed'].includes(booking.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                  <XCircle className="me-2 h-4 w-4" />
                  {t('cancel')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmCancel')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('confirmCancelDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('back')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    {t('cancelBooking')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="travelers">
            <TabsList>
              <TabsTrigger value="travelers">{t('travelersTitle')}</TabsTrigger>
              <TabsTrigger value="package">{t('package')}</TabsTrigger>
              <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
            </TabsList>

            <TabsContent value="travelers" className="space-y-4 mt-4">
              {booking.travelers.map((traveler, index) => (
                <TravelerForm
                  key={index}
                  traveler={traveler}
                  index={index}
                  onUpdate={handleTravelerUpdate}
                  onPassportScan={handlePassportScan}
                  locale={locale as 'ar' | 'en'}
                  isLoading={isLoading}
                />
              ))}
            </TabsContent>

            <TabsContent value="package" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {booking.packageSnapshot.name}
                  </CardTitle>
                  <Badge variant="outline">{t(`types.${booking.packageSnapshot.type}`)}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('includedServices')}</h4>
                    {booking.packageSnapshot.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {t(`serviceCategories.${service.category}`)}
                          </Badge>
                          <span>{service.name}</span>
                          {service.isOutsourced && (
                            <Badge variant="secondary" className="text-xs">
                              {t('outsourced')}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium">{formatCurrency(service.price)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between font-bold">
                      <span>{t('pricePerPerson')}</span>
                      <span>{formatCurrency(booking.packageSnapshot.totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <DocumentList
                documents={[]}
                requiredDocuments={booking.requiredDocuments}
                locale={locale as 'ar' | 'en'}
              />
              <DocumentUploader
                onUpload={async (file, type) => {
                  console.log('Upload:', file, type);
                  return 'url';
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('customer')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {customer.phone}
                </p>
                <Button variant="link" asChild className="px-0 mt-2">
                  <Link href={`/${locale}/customers/${customer.id}`}>
                    {t('viewCustomer')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Travel Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('travelDate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatDate(booking.travelDate as unknown as string)}</p>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('financialSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('totalAmount')}</span>
                <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paidAmount')}</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(booking.paidAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">{t('balance')}</span>
                <span
                  className={`font-bold ${
                    booking.balance > 0 ? 'text-destructive' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(booking.balance)}
                </span>
              </div>

              {!booking.invoiceId && booking.status !== 'cancelled' && (
                <Button className="w-full mt-4" asChild>
                  <Link href={`/${locale}/invoices/new?bookingId=${booking.id}`}>
                    <FileText className="me-2 h-4 w-4" />
                    {t('generateInvoice')}
                  </Link>
                </Button>
              )}

              {booking.invoiceId && (
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/${locale}/invoices/${booking.invoiceId}`}>
                    <FileText className="me-2 h-4 w-4" />
                    {t('viewInvoice')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
