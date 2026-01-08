'use client';

/**
 * Customer Detail Client Component
 *
 * Client component for displaying and editing customer details.
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
  Edit,
  Trash,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Camera,
  DollarSign,
} from 'lucide-react';
import { useTenant } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PassportPreview } from '@/components/features/passport-scanner/passport-preview';
import { PassportScanner } from '@/components/features/passport-scanner/passport-scanner';
import { PassportDataForm } from '@/components/features/passport-scanner/passport-data-form';
import { DocumentList } from '@/components/features/bookings/document-list';
import { InvoiceCard } from '@/components/features/invoices/invoice-card';
import { updateCustomerPassportAction, deleteCustomerAction } from '@/app/actions/customers';
import { PassportScanResult, PassportFormData } from '@/types/models/passport';
import { Customer } from '@/types/models/customer';
import { Invoice } from '@/types/models/invoice';
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

interface CustomerDetailClientProps {
  customer: Customer;
  invoices: Invoice[];
  locale: string;
}

export function CustomerDetailClient({
  customer,
  invoices,
  locale,
}: CustomerDetailClientProps) {
  const t = useTranslations('customers');
  const router = useRouter();
  const dateLocale = locale === 'ar' ? ar : enUS;

  const [showScanner, setShowScanner] = useState(false);
  const [showPassportForm, setShowPassportForm] = useState(false);
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);
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
    // Always use 'en-US' locale for English numerals, use tenant's currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: tenant?.currency || 'SAR',
    }).format(amount);
  };

  const handleScanComplete = (result: PassportScanResult) => {
    setScanResult(result);
    setShowScanner(false);
    setShowPassportForm(true);
  };

  const handlePassportSubmit = async (data: PassportFormData) => {
    setIsLoading(true);
    try {
      const result = await updateCustomerPassportAction(customer.id, {
        ...data,
        manuallyVerified: true,
      });

      if (result.success) {
        toast.success(t('passportSaved'));
        setShowPassportForm(false);
        setScanResult(null);
        router.refresh();
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
    setIsLoading(true);
    try {
      const result = await deleteCustomerAction(customer.id);

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
            <Link href={`/${locale}/customers/${customer.id}/edit`}>
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
              <TabsTrigger value="passport">{t('passportTab')}</TabsTrigger>
              <TabsTrigger value="documents">{t('documentsTab')}</TabsTrigger>
              <TabsTrigger value="invoices">{t('invoices')}</TabsTrigger>
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

            <TabsContent value="invoices" className="mt-4">
              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('noInvoices')}
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/invoices/new?customerId=${customer.id}`}>
                        {t('createInvoice')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {invoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onView={() => router.push(`/${locale}/invoices/${invoice.id}`)}
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
                <span className="text-muted-foreground">{t('totalInvoices')}</span>
                <span className="font-medium">{invoices.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documentsTab')}</span>
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
