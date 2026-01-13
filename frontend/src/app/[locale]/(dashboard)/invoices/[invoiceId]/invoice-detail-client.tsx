'use client';

/**
 * Invoice Detail Client Component
 * T042 [US1] Enhance invoice detail page - Client interactivity
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { InvoiceDetail } from '@/components/features/invoices/invoice-detail';
import { Invoice } from '@/types/models/invoice';
import { Account } from '@/types/models/account';
import {
  issueServiceInvoice,
  cancelServiceInvoice,
  updateServiceInvoice,
} from '@/app/actions/invoices';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CancelInvoiceDialog } from '@/components/features/invoices/cancel-invoice-dialog';
import { VersionConflictDialog } from '@/components/ui/version-conflict-dialog';
import { RecordPaymentDialog } from '@/components/features/payments/record-payment-dialog';
import { RecordPartnerPaymentDialog } from '@/components/features/payments/record-partner-payment-dialog';
import { CreateCustomerPaymentInput, CreateCashPaymentInput, CreatePartnerPaymentInput } from '@/types/models/payment';
import { createCustomerPayment, recordPartnerPaymentAction } from '@/app/actions/payments';

interface InvoiceDetailClientProps {
  invoice: Invoice;
  paymentAccounts: Account[];
  locale: string;
}

export function InvoiceDetailClient({ invoice: initialInvoice, paymentAccounts, locale }: InvoiceDetailClientProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showVersionConflict, setShowVersionConflict] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPartnerPaymentDialog, setShowPartnerPaymentDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<{
    partnerId: string;
    partnerName: string;
    commissionAmount: number;
    commissionPercentage: number;
    grossAmount: number;
  } | null>(null);

  function handleEdit() {
    router.push(`/${locale}/invoices/${invoice.id}/edit`);
  }

  function handleIssue() {
    // Prevent duplicate calls while processing
    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await issueServiceInvoice(invoice.id);

        if (result.success && result.data) {
          setInvoice(result.data);
          toast({
            title: t('invoices.issueSuccess'),
            description: t('invoices.issueSuccessDescription', {
              invoiceNumber: result.data.invoiceNumber,
            }),
          });
          // router.refresh() removed - local state update is sufficient
        } else {
          toast({
            title: t('common.error'),
            description: !result.success ? result.error : t('invoices.issueError'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error issuing invoice:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.issueError'),
          variant: 'destructive',
        });
      }
    });
  }

  async function handleCancel(invoiceId: string, version: number, reason: string) {
    try {
      const result = await cancelServiceInvoice(invoiceId, version, reason);

      if (result.success && result.data) {
        setInvoice(result.data);
        toast({
          title: t('invoices.cancelSuccess'),
          description: t('invoices.cancelSuccessDescription'),
        });
        router.refresh();
        return { success: true };
      } else {
        // T090 [P] Check for version conflict
        const errorMessage = !result.success ? result.error : t('invoices.cancelError');
        if (errorMessage.includes('modified by another user') || errorMessage.includes('VERSION_CONFLICT')) {
          setShowVersionConflict(true);
          return { success: false, message: errorMessage };
        }

        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      const message = error instanceof Error ? error.message : t('invoices.cancelError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
      return { success: false, message };
    }
  }

  async function handleDownload() {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('invoices.downloadSuccess'),
        description: t('invoices.downloadSuccessDescription'),
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: t('common.error'),
        description: t('invoices.downloadError'),
        variant: 'destructive',
      });
    }
  }

  function handleRecordPayment() {
    setShowPaymentDialog(true);
  }

  async function handlePaymentSubmit(data: CreateCustomerPaymentInput) {
    try {
      // Convert to CreateCashPaymentInput - invoiceId is guaranteed to exist
      // since we're on the invoice detail page
      if (!data.invoiceId) {
        throw new Error('Invoice ID is required');
      }

      const cashPaymentInput: any = {
        invoiceId: data.invoiceId,
        amount: data.amount,
        notes: data.notes,
        // Include additional fields that the payment action expects
        customerId: data.customerId,
        currency: data.currency,
        method: data.method || 'cash',
        accountId: data.accountId,
        accountName: data.accountName,
        transactionReference: data.transactionReference,
      };

      const result = await createCustomerPayment(cashPaymentInput);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Refresh to get updated invoice
      router.refresh();
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  }

  function handleRecordPartnerPayment(commission: any) {
    // Handle both new (partnerId/amount) and legacy (partnerOfficeId/totalAmount) field names
    const partnerId = commission.partnerId || commission.partnerOfficeId;
    const partnerName = commission.partnerName || commission.partnerOfficeName;
    const commissionAmount = commission.amount ?? commission.totalAmount ?? 0;

    // Calculate gross amount from invoice line items for this partner
    // Check both partnerId and partnerOfficeId in line items for compatibility
    const grossAmount = invoice.lineItems
      .filter((item) => item.partnerOfficeId === partnerId || item.partnerId === partnerId)
      .reduce((sum, item) => sum + item.total, 0);

    const commissionPercentage = grossAmount > 0 ? (commissionAmount / grossAmount) * 100 : 0;

    setSelectedPartner({
      partnerId,
      partnerName,
      commissionAmount,
      commissionPercentage,
      grossAmount,
    });

    setShowPartnerPaymentDialog(true);
  }

  async function handlePartnerPaymentSubmit(data: CreatePartnerPaymentInput) {
    if (!tenant?.id || !user?.uid) return;

    try {
      // Extract only the fields that the action expects
      const paymentData = {
        partnerId: data.partnerId,
        partnerName: data.partnerName,
        invoiceIds: data.invoiceIds,
        grossAmount: data.grossAmount,
        commissionAmount: data.commissionAmount,
        netAmount: data.netAmount,
        method: data.method as 'cash' | 'bank',
        accountId: data.accountId,
        accountName: data.accountName,
        transactionReference: data.transactionReference,
        notes: data.notes,
      };

      const result = await recordPartnerPaymentAction(tenant.id, user.uid, paymentData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to record partner payment');
      }

      // Refresh to get updated invoice with commission status
      router.refresh();
    } catch (error) {
      console.error('Error submitting partner payment:', error);
      throw error;
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/${locale}/invoices`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('invoices.invoiceDetails')}</h1>
            <p className="text-muted-foreground">{t('invoices.viewInvoiceDescription')}</p>
          </div>
        </div>

        {/* Invoice Detail */}
        <InvoiceDetail
          invoice={invoice}
          onEdit={['draft', 'issued', 'partial', 'paid'].includes(invoice.status) ? handleEdit : undefined}
          onIssue={invoice.status === 'draft' ? handleIssue : undefined}
          onCancel={
            invoice.status !== 'cancelled' && invoice.status !== 'paid'
              ? () => setShowCancelDialog(true)
              : undefined
          }
          onDownload={invoice.status !== 'draft' ? handleDownload : undefined}
          onRecordPayment={(invoice.status === 'issued' || invoice.status === 'partial') && invoice.balance > 0 ? handleRecordPayment : undefined}
          onRecordPartnerPayment={invoice.status !== 'draft' && invoice.status !== 'cancelled' ? handleRecordPartnerPayment : undefined}
          isPending={isPending}
        />
      </div>

      {/* T080 [US9] Cancel Invoice Dialog */}
      <CancelInvoiceDialog
        invoice={invoice}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onCancel={handleCancel}
      />

      {/* T090 [P] Version Conflict Dialog */}
      <VersionConflictDialog
        open={showVersionConflict}
        onReload={() => router.refresh()}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoiceId={invoice.id}
        customerId={invoice.customerId}
        customerName={invoice.customerName}
        maxAmount={invoice.balance}
        currency={invoice.currency}
        accounts={paymentAccounts}
        onSubmit={handlePaymentSubmit}
      />

      {/* Record Partner Payment Dialog */}
      {selectedPartner && (
        <RecordPartnerPaymentDialog
          open={showPartnerPaymentDialog}
          onOpenChange={setShowPartnerPaymentDialog}
          partnerId={selectedPartner.partnerId}
          partnerName={selectedPartner.partnerName}
          invoiceIds={[invoice.id]}
          invoiceNumber={invoice.invoiceNumber}
          defaultGrossAmount={selectedPartner.grossAmount}
          defaultCommissionPercentage={selectedPartner.commissionPercentage}
          currency={invoice.currency}
          accounts={paymentAccounts}
          onSubmit={handlePartnerPaymentSubmit}
          mode="single-invoice"
          locale={locale}
        />
      )}
    </>
  );
}
