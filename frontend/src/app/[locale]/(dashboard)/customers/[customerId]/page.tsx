'use client';

// Customer detail page
// T120 [US2] Create customer detail page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Camera,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PassportPreview } from '@/components/features/passport-scanner/passport-preview';
import { PassportScanner } from '@/components/features/passport-scanner/passport-scanner';
import { PassportDataForm } from '@/components/features/passport-scanner/passport-data-form';
import { DocumentList } from '@/components/features/bookings/document-list';
import { BookingCard } from '@/components/features/bookings/booking-card';
import { useCustomer } from '@/hooks/use-customer';
import { useBookings } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { updateCustomerPassportAction, deleteCustomerAction } from '@/app/actions/customers';
import { PassportScanResult, PassportFormData } from '@/types/models/passport';
import { Timestamp } from 'firebase/firestore';
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

export default function CustomerDetailPage() {
  const t = useTranslations('customers');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const customerId = params.customerId as string;
  const dateLocale = locale === 'ar' ? ar : enUS;

  const { user } = useAuth();
  const { tenant } = useTenant();
  const { customer, loading, error } = useCustomer(customerId);
  const { bookings } = useBookings({ customerId });

  const [showScanner, setShowScanner] = useState(false);
  const [showPassportForm, setShowPassportForm] = useState(false);
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'dd MMMM yyyy', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const handleScanComplete = (result: PassportScanResult) => {
    setScanResult(result);
    setShowScanner(false);
    setShowPassportForm(true);
  };

  const handlePassportSubmit = async (data: PassportFormData) => {
    if (!tenant?.id || !user?.uid) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCustomerPassportAction(
        tenant.id,
        user.uid,
        customerId,
        {
          ...data,
          manuallyVerified: true,
        }
      );

      if (result.success) {
        toast.success(t('passportSaved'));
        setShowPassportForm(false);
        setScanResult(null);
      } else {
        toast.error(result.error || t('errors.passportFailed'));
      }
    } catch (error) {
      console.error('Error saving passport:', error);
      toast.error(t('errors.passportFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant?.id || !user?.uid) return;

    setIsLoading(true);
    try {
      const result = await deleteCustomerAction(tenant.id, user.uid, customerId);

      if (result.success) {
        toast.success(t('customerDeleted'));
        router.push(`/${locale}/customers`);
      } else {
        toast.error(result.error || t('errors.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error || t('customerNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/customers`}>{t('backToList')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/customers`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-muted-foreground">
              {t('since')} {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/customers/${customerId}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {t('edit')}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="me-2 h-4 w-4" />
                {t('delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('confirmDeleteDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">{t('details')}</TabsTrigger>
              <TabsTrigger value="passport">{t('passport')}</TabsTrigger>
              <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
              <TabsTrigger value="bookings">{t('bookings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customer.address.city}, {customer.address.country}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {customer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('notes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}

              {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="passport" className="space-y-4 mt-4">
              {showScanner ? (
                <div className="space-y-4">
                  <PassportScanner
                    onScanComplete={handleScanComplete}
                    onError={(error) => toast.error(error)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowScanner(false)}
                    className="w-full"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              ) : showPassportForm ? (
                <PassportDataForm
                  initialData={scanResult || undefined}
                  onSubmit={handlePassportSubmit}
                  onCancel={() => {
                    setShowPassportForm(false);
                    setScanResult(null);
                  }}
                  isLoading={isLoading}
                />
              ) : customer.passport ? (
                <div className="space-y-4">
                  <PassportPreview
                    passport={customer.passport}
                    locale={locale as 'ar' | 'en'}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                  >
                    <Camera className="me-2 h-4 w-4" />
                    {t('rescanPassport')}
                  </Button>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('noPassportData')}
                    </p>
                    <Button onClick={() => setShowScanner(true)}>
                      <Camera className="me-2 h-4 w-4" />
                      {t('scanPassport')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentList
                documents={customer.documents || []}
                locale={locale as 'ar' | 'en'}
              />
            </TabsContent>

            <TabsContent value="bookings" className="mt-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('noBookings')}
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/bookings/new?customerId=${customerId}`}>
                        {t('createBooking')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      locale={locale as 'ar' | 'en'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('accountBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${
                  customer.balance > 0
                    ? 'text-green-600'
                    : customer.balance < 0
                    ? 'text-destructive'
                    : ''
                }`}
              >
                {formatCurrency(customer.balance)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {customer.balance > 0
                  ? t('creditBalance')
                  : customer.balance < 0
                  ? t('owesBalance')
                  : t('zeroBalance')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('quickStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('totalBookings')}</span>
                <span className="font-medium">{bookings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents')}</span>
                <span className="font-medium">
                  {customer.documents?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
