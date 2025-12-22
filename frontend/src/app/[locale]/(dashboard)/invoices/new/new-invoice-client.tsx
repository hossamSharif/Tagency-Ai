'use client';

/**
 * New Invoice Client Component
 * T041 [US1] Create new invoice page - Client interactivity
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { InvoiceForm } from '@/components/features/invoices/invoice-form';
import { createServiceInvoice } from '@/app/actions/invoices';
import { Customer } from '@/types/models/customer';
import { ServiceCatalogItem } from '@/types/models/service-catalog';
import { PartnerOffice } from '@/types/models/partner-office';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NewInvoiceClientProps {
  customers: Customer[];
  services: ServiceCatalogItem[];
  partners: PartnerOffice[];
  locale: string;
}

export function NewInvoiceClient({
  customers,
  services,
  partners,
  locale,
}: NewInvoiceClientProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(data: any) {
    startTransition(async () => {
      try {
        const result = await createServiceInvoice(data);

        if (result.success && result.data) {
          toast({
            title: t('invoices.createSuccess'),
            description: t('invoices.createSuccessDescription', {
              invoiceNumber: result.data.invoiceNumber,
            }),
          });

          // Redirect to invoice detail page
          router.push(`/${locale}/invoices/${result.data.id}`);
        } else {
          toast({
            title: t('common.error'),
            description: result.error || t('invoices.createError'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error creating invoice:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.createError'),
          variant: 'destructive',
        });
      }
    });
  }

  function handleCancel() {
    router.push(`/${locale}/invoices`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/${locale}/invoices`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('invoices.createInvoice')}</h1>
          <p className="text-muted-foreground">{t('invoices.createInvoiceDescription')}</p>
        </div>
      </div>

      {/* Error States */}
      {customers.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t('invoices.noCustomersWarning')}
          </p>
        </div>
      )}

      {services.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t('invoices.noServicesWarning')}
          </p>
        </div>
      )}

      {/* Invoice Form */}
      <InvoiceForm
        customers={customers}
        services={services}
        partners={partners}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isPending={isPending}
        mode="create"
      />
    </div>
  );
}
