'use client';

// Customer create page
// T119 [US2] Create customer create page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/features/customers/customer-form';
import { PassportScanner } from '@/components/features/passport-scanner/passport-scanner';
import { PassportDataForm } from '@/components/features/passport-scanner/passport-data-form';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { createCustomerAction, updateCustomerPassportAction } from '@/app/actions/customers';
import { CreateCustomerInput } from '@/lib/validations/customers';
import { PassportScanResult, PassportFormData } from '@/types/models/passport';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const t = useTranslations('customers');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);
  const [showPassportForm, setShowPassportForm] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCustomerInput) => {
    if (!tenant?.id || !user?.uid) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCustomerAction(tenant.id, user.uid, data);

      if (!result.success) {
        toast.error(result.error || t('errors.createFailed'));
        return;
      }
      toast.success(t('customerCreated'));
      setCreatedCustomerId(result.data.id);

      // If we have passport data from scan, save it
      if (scanResult && showPassportForm) {
        setShowPassportForm(true);
      } else {
        router.push(`/${locale}/customers/${result.data.id}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanComplete = (result: PassportScanResult) => {
    setScanResult(result);
    setShowScanner(false);
    setShowPassportForm(true);
  };

  const handlePassportSubmit = async (data: PassportFormData) => {
    if (!tenant?.id || !user?.uid || !createdCustomerId) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCustomerPassportAction(
        tenant.id,
        user.uid,
        createdCustomerId,
        {
          ...data,
          manuallyVerified: true,
        }
      );

      if (result.success) {
        toast.success(t('passportSaved'));
        router.push(`/${locale}/customers/${createdCustomerId}`);
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/customers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('createCustomer')}</h1>
          <p className="text-muted-foreground">{t('createCustomerDescription')}</p>
        </div>
      </div>

      {/* Passport Scanner Option */}
      {!createdCustomerId && !showScanner && !showPassportForm && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            {t('scanPassportFirst')}
          </Button>
        </div>
      )}

      {/* Content */}
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
            {t('skipScanner')}
          </Button>
        </div>
      ) : showPassportForm && !createdCustomerId ? (
        <div className="space-y-4">
          <PassportDataForm
            initialData={scanResult || undefined}
            onSubmit={async (data) => {
              // Pre-fill customer form with passport data and continue
              setScanResult({
                ...scanResult!,
                extractedData: {
                  ...scanResult?.extractedData,
                  ...data,
                },
              });
              setShowPassportForm(false);
            }}
            onCancel={() => {
              setScanResult(null);
              setShowPassportForm(false);
            }}
          />
        </div>
      ) : createdCustomerId && showPassportForm ? (
        <PassportDataForm
          initialData={scanResult || undefined}
          onSubmit={handlePassportSubmit}
          onCancel={() => {
            router.push(`/${locale}/customers/${createdCustomerId}`);
          }}
          isLoading={isLoading}
        />
      ) : (
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${locale}/customers`)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
