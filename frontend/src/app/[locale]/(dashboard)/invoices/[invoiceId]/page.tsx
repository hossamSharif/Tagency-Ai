'use client';

// Invoice detail page
// T152 [US3] Create invoice detail page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvoiceDetail } from '@/components/features/invoices/invoice-detail';
import { PaymentForm } from '@/components/features/payments/payment-form';
import { PaymentCard } from '@/components/features/payments/payment-card';
import { useInvoice } from '@/hooks/use-invoice';
import { usePayments } from '@/hooks/use-payments';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { issueInvoiceAction, cancelInvoiceAction } from '@/app/actions/invoices';
import {
  createPaymentAction,
  uploadBankTransferProofAction,
  createStripeCheckoutAction,
  approveBankTransferAction,
  rejectBankTransferAction,
} from '@/app/actions/payments';
import { CreateCashPaymentInput, CreateBankTransferPaymentInput } from '@/lib/validations/payments';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const t = useTranslations('invoices');
  const tPayments = useTranslations('payments');
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as 'ar' | 'en') || 'ar';
  const invoiceId = params.invoiceId as string;

  const { tenant } = useTenant();
  const { user } = useAuth();
  const { invoice, loading: invoiceLoading, error: invoiceError } = useInvoice(invoiceId);
  const { payments, loading: paymentsLoading } = usePayments({ invoiceId });

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleDownloadPDF = async () => {
    if (!tenant?.id || !invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: {
          'x-tenant-id': tenant.id,
        },
      });

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
    } catch (error) {
      toast.error(t('pdfDownloadError'));
    }
  };

  const handleIssue = async () => {
    if (!tenant?.id || !user?.uid || !invoice) return;

    const result = await issueInvoiceAction(tenant.id, user.uid, invoice.id);

    if (result.success) {
      toast.success(t('invoiceIssued'));
    } else {
      toast.error(result.error || t('issueError'));
    }
  };

  const handleCancel = async () => {
    if (!tenant?.id || !user?.uid || !invoice) return;

    const reason = prompt(t('cancelReason'));
    if (!reason) return;

    const result = await cancelInvoiceAction(tenant.id, user.uid, invoice.id, reason);

    if (result.success) {
      toast.success(t('invoiceCancelled'));
      router.push(`/${locale}/invoices`);
    } else {
      toast.error(result.error || t('cancelError'));
    }
  };

  const handleCashPayment = async (data: CreateCashPaymentInput) => {
    if (!tenant?.id || !user?.uid) return;

    const result = await createPaymentAction(tenant.id, user.uid, data);

    if (result.success) {
      toast.success(tPayments('paymentRecorded'));
      setShowPaymentForm(false);
    } else {
      toast.error(result.error || tPayments('paymentError'));
    }
  };

  const handleBankTransfer = async (data: CreateBankTransferPaymentInput) => {
    if (!tenant?.id || !user?.uid) return;

    const result = await uploadBankTransferProofAction(tenant.id, user.uid, data);

    if (result.success) {
      toast.success(tPayments('bankTransferSubmitted'));
      setShowPaymentForm(false);
    } else {
      toast.error(result.error || tPayments('paymentError'));
    }
  };

  const handleStripeCheckout = async (amount: number) => {
    if (!tenant?.id || !user?.uid || !invoice) return;

    const successUrl = `${window.location.origin}/${locale}/invoices/${invoice.id}?payment=success`;
    const cancelUrl = `${window.location.origin}/${locale}/invoices/${invoice.id}?payment=cancelled`;

    const result = await createStripeCheckoutAction(
      tenant.id,
      user.uid,
      invoice.id,
      amount,
      successUrl,
      cancelUrl
    );

    if (result.success && result.data) {
      window.location.href = result.data.checkoutUrl;
    } else {
      toast.error(result.error || tPayments('stripeError'));
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const result = await approveBankTransferAction(tenant.id, user.uid, { paymentId });

    if (result.success) {
      toast.success(tPayments('paymentApproved'));
    } else {
      toast.error(result.error || tPayments('approvalError'));
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const reason = prompt(tPayments('rejectionReason'));
    if (!reason) return;

    const result = await rejectBankTransferAction(tenant.id, user.uid, {
      paymentId,
      rejectionReason: reason,
    });

    if (result.success) {
      toast.success(tPayments('paymentRejected'));
    } else {
      toast.error(result.error || tPayments('rejectionError'));
    }
  };

  if (invoiceLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('invoiceNotFound')}</p>
          <Button asChild variant="outline">
            <Link href={`/${locale}/invoices`}>{t('backToInvoices')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/invoices`}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('backToInvoices')}
        </Link>
      </Button>

      {/* Invoice Detail */}
      <InvoiceDetail
        invoice={invoice}
        locale={locale}
        onDownloadPDF={handleDownloadPDF}
        onIssue={handleIssue}
        onCancel={handleCancel}
        onAddPayment={() => setShowPaymentForm(true)}
      />

      {/* Payments Section */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{tPayments('payments')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                locale={locale}
                onApprove={() => handleApprovePayment(payment.id)}
                onReject={() => handleRejectPayment(payment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tPayments('addPayment')}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            invoice={invoice}
            onCashPayment={handleCashPayment}
            onBankTransfer={handleBankTransfer}
            onStripeCheckout={handleStripeCheckout}
            onCancel={() => setShowPaymentForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
