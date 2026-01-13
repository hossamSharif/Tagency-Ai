'use client';

/**
 * Edit Invoice Client Component
 * Supports editing invoices at any status with accounting adjustments
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { InvoiceForm } from '@/components/features/invoices/invoice-form';
import { editIssuedInvoice, updateServiceInvoice } from '@/app/actions/invoices';
import { Customer } from '@/types/models/customer';
import { ServiceCatalogItem } from '@/types/models/service-catalog';
import { PartnerOffice } from '@/types/models/partner-office';
import { Invoice } from '@/types/models/invoice';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VersionConflictDialog } from '@/components/ui/version-conflict-dialog';
import { OverpaymentDialog } from '@/components/features/invoices/overpayment-dialog';

interface EditInvoiceClientProps {
  invoice: Invoice;
  customers: Customer[];
  services: ServiceCatalogItem[];
  partners: PartnerOffice[];
  locale: string;
}

export function EditInvoiceClient({
  invoice,
  customers,
  services,
  partners,
  locale,
}: EditInvoiceClientProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVersionConflict, setShowVersionConflict] = useState(false);
  const [showOverpaymentDialog, setShowOverpaymentDialog] = useState(false);
  const [overpaymentAmount, setOverpaymentAmount] = useState(0);

  // Get status-specific warning message
  function getWarningMessage(): { type: 'warning' | 'info'; title: string; description: string } | null {
    switch (invoice.status) {
      case 'issued':
        return {
          type: 'warning',
          title: t('invoices.editIssuedWarningTitle'),
          description: t('invoices.editIssuedWarning'),
        };
      case 'partial':
        return {
          type: 'warning',
          title: t('invoices.editPartialWarningTitle'),
          description: t('invoices.editPartialWarning', { paidAmount: invoice.paidAmount || 0 }),
        };
      case 'paid':
        return {
          type: 'warning',
          title: t('invoices.editPaidWarningTitle'),
          description: t('invoices.editPaidWarning'),
        };
      default:
        return null;
    }
  }

  async function handleSubmit(data: any) {
    startTransition(async () => {
      try {
        // For draft invoices, use the simple update function
        if (invoice.status === 'draft') {
          const result = await updateServiceInvoice(invoice.id, data);

          if (result.success && result.data) {
            toast({
              title: t('invoices.updateSuccess'),
              description: t('invoices.updateSuccessDescription'),
            });
            router.push(`/${locale}/invoices/${result.data.id}`);
          } else {
            const errorMessage = !result.success ? result.error : t('invoices.updateError');

            // Check for version conflict
            if (errorMessage.includes('modified by another user') || errorMessage.includes('VERSION_CONFLICT')) {
              setShowVersionConflict(true);
              return;
            }

            toast({
              title: t('common.error'),
              description: errorMessage,
              variant: 'destructive',
            });
          }
          return;
        }

        // For issued/partial/paid invoices, use editIssuedInvoice with accounting adjustments
        const editData = {
          lineItems: data.lineItems.map((item: any, index: number) => ({
            ...item,
            id: item.id || `line-${Date.now()}-${index}`,
            displayOrder: index,
          })),
          discount: data.discount || 0,
          discountPercentage: data.discountPercentage,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          notes: data.notes,
          attachments: data.attachments,
          version: invoice.version || 1,
        };

        const result = await editIssuedInvoice(invoice.id, editData);

        if (result.success && result.data) {
          // Check if there's overpayment info (paid invoice with reduced total)
          if (result.data.overpaymentInfo && result.data.overpaymentInfo.amount > 0) {
            setOverpaymentAmount(result.data.overpaymentInfo.amount);
            setShowOverpaymentDialog(true);
            return;
          }

          toast({
            title: t('invoices.updateSuccess'),
            description: t('invoices.adjustmentCreated'),
          });
          router.push(`/${locale}/invoices/${result.data.id}`);
        } else {
          const errorMessage = !result.success ? result.error : t('invoices.updateError');

          // Check for version conflict
          if (errorMessage.includes('modified by another user') || errorMessage.includes('VERSION_CONFLICT')) {
            setShowVersionConflict(true);
            return;
          }

          // Check for partial invoice validation
          if (errorMessage.includes('below paid amount') || errorMessage.includes('CANNOT_REDUCE_BELOW_PAID')) {
            toast({
              title: t('common.error'),
              description: t('invoices.cannotReduceBelowPaid'),
              variant: 'destructive',
            });
            return;
          }

          toast({
            title: t('common.error'),
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error updating invoice:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.updateError'),
          variant: 'destructive',
        });
      }
    });
  }

  function handleCancel() {
    router.push(`/${locale}/invoices/${invoice.id}`);
  }

  function handleOverpaymentComplete() {
    setShowOverpaymentDialog(false);
    router.push(`/${locale}/invoices/${invoice.id}`);
  }

  const warning = getWarningMessage();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/${locale}/invoices/${invoice.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('invoices.editInvoice')}</h1>
            <p className="text-muted-foreground">
              {t('invoices.editInvoiceDescription', { invoiceNumber: invoice.invoiceNumber })}
            </p>
          </div>
        </div>

        {/* Status-specific Warning */}
        {warning && (
          <Alert variant={warning.type === 'warning' ? 'destructive' : 'default'}>
            {warning.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertTitle>{warning.title}</AlertTitle>
            <AlertDescription>{warning.description}</AlertDescription>
          </Alert>
        )}

        {/* Paid Amount Display for partial/paid invoices */}
        {(invoice.status === 'partial' || invoice.status === 'paid') && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('invoices.paymentInfo')}</AlertTitle>
            <AlertDescription>
              {t('invoices.paidAmountDisplay', {
                paidAmount: invoice.paidAmount || 0,
                currency: invoice.currency || 'SAR'
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Invoice Form */}
        <InvoiceForm
          invoice={invoice}
          customers={customers}
          services={services}
          partners={partners}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isPending={isPending}
          mode="edit"
          status={invoice.status}
          paidAmount={invoice.paidAmount}
        />
      </div>

      {/* Version Conflict Dialog */}
      <VersionConflictDialog
        open={showVersionConflict}
        onReload={() => router.refresh()}
      />

      {/* Overpayment Dialog */}
      <OverpaymentDialog
        open={showOverpaymentDialog}
        onOpenChange={setShowOverpaymentDialog}
        invoiceId={invoice.id}
        customerId={invoice.customerId}
        customerName={invoice.customerName}
        overpaymentAmount={overpaymentAmount}
        currency={invoice.currency || 'SAR'}
        onComplete={handleOverpaymentComplete}
      />
    </>
  );
}
