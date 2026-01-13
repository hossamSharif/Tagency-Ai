'use client';

/**
 * Create Partner Form Wrapper
 *
 * Client component for creating a new partner
 */

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { PartnerForm } from '@/components/features/partners/partner-form';
import { createPartnerAction } from '@/app/actions/partners';
import type { CreatePartnerInput, UpdatePartnerInput } from '@/lib/validations/partners';

interface CreatePartnerFormProps {
  locale: string;
}

export function CreatePartnerForm({ locale }: CreatePartnerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isArabic = locale === 'ar';
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreatePartnerInput | UpdatePartnerInput) => {
    setIsLoading(true);
    try {
      const result = await createPartnerAction(data as CreatePartnerInput);

      if (result.success) {
        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic
            ? 'تم إنشاء الشريك بنجاح'
            : 'Partner created successfully',
        });
        router.push(`/${locale}/partners/${result.data.partnerId}`);
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PartnerForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      locale={locale}
    />
  );
}
