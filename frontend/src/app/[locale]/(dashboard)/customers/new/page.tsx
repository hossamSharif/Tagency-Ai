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
import { createCustomerAction, uploadCustomerDocumentAction } from '@/app/actions/customers';
import { CreateCustomerInput } from '@/lib/validations/customers';
import { uploadCustomerDocument } from '@/lib/firebase/storage';
import { getIdTokenResult } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const t = useTranslations('customers');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCustomerInput, passportImage?: File) => {
    setIsLoading(true);
    try {
      // Phase 1: Create customer
      const result = await createCustomerAction(data);

      if (!result.success) {
        toast.error(result.error || t('errors.createFailed'));
        return;
      }

      const customerId = result.data.id;

      // Phase 2: Upload passport image if available
      if (passportImage) {
        try {
          // Get tenant ID from Firebase Auth
          const idTokenResult = await getIdTokenResult();
          const tenantId = idTokenResult?.claims?.tenantId as string;

          if (!tenantId) {
            throw new Error('No tenant ID found');
          }

          // Upload to Firebase Storage
          const documentUrl = await uploadCustomerDocument(
            tenantId,
            customerId,
            passportImage,
            'passport'
          );

          // Add document reference to customer
          await uploadCustomerDocumentAction(
            customerId,
            'passport',
            passportImage.name,
            documentUrl
          );

          toast.success(t('customerCreatedWithPassport'));
        } catch (uploadError) {
          console.error('Error uploading passport:', uploadError);
          toast.warning(t('customerCreatedButImageFailed'));
        }
      } else {
        toast.success(t('customerCreated'));
      }

      router.push(`/${locale}/customers/${customerId}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(t('errors.createFailed'));
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

      {/* Customer Form with integrated passport scanner */}
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/customers`)}
        isLoading={isLoading}
      />
    </div>
  );
}
