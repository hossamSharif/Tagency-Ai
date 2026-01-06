'use client';

// Payment detail page
// T154 [US3] Create payment detail page

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Banknote,
  Building2,
  Calendar,
  FileText,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PaymentStatusBadge } from '@/components/features/payments/payment-status-badge';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { Payment, PaymentMethod } from '@/types/models/payment';
import { Timestamp } from 'firebase/firestore';
import {
  approveBankTransferAction,
  rejectBankTransferAction,
  getPaymentAction,
} from '@/app/actions/payments';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  stripe: <CreditCard className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
  bank: <Building2 className="h-5 w-5" />,
  bank_transfer: <Building2 className="h-5 w-5" />,
};

export default function PaymentDetailPage() {
  const t = useTranslations('payments');
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as 'ar' | 'en') || 'ar';
  const paymentId = params.paymentId as string;
  const dateLocale = locale === 'ar' ? ar : enUS;

  const { tenant } = useTenant();
  const { user } = useAuth();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayment() {
      if (!tenant?.id) return;

      setLoading(true);
      const result = await getPaymentAction(tenant.id, paymentId);

      if (!result.success) {
        setError(result.error || 'Payment not found');
        setLoading(false);
        return;
      }
      setPayment(result.data);
      setLoading(false);
    }

    loadPayment();
  }, [tenant?.id, paymentId]);

  const formatDate = (timestamp: Timestamp | string) => {
    // Handle both Timestamp objects and ISO date strings
    const date = typeof timestamp === 'string'
      ? new Date(timestamp)
      : timestamp.toDate();
    return format(date, 'dd MMMM yyyy HH:mm', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    if (!payment) return '';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: payment.currency,
    }).format(amount);
  };

  const handleApprove = async () => {
    if (!tenant?.id || !user?.uid || !payment) return;

    const result = await approveBankTransferAction(tenant.id, user.uid, {
      paymentId: payment.id,
    });

    if (result.success) {
      toast.success(t('paymentApproved'));
      // Refresh payment data
      const refreshResult = await getPaymentAction(tenant.id, payment.id);
      if (refreshResult.success && refreshResult.data) {
        setPayment(refreshResult.data);
      }
    } else {
      toast.error(result.error || t('approvalError'));
    }
  };

  const handleReject = async () => {
    if (!tenant?.id || !user?.uid || !payment) return;

    const reason = prompt(t('rejectionReason'));
    if (!reason) return;

    const result = await rejectBankTransferAction(tenant.id, user.uid, {
      paymentId: payment.id,
      rejectionReason: reason,
    });

    if (result.success) {
      toast.success(t('paymentRejected'));
      // Refresh payment data
      const refreshResult = await getPaymentAction(tenant.id, payment.id);
      if (refreshResult.success && refreshResult.data) {
        setPayment(refreshResult.data);
      }
    } else {
      toast.error(result.error || t('rejectionError'));
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('paymentNotFound')}</p>
          <Button asChild variant="outline">
            <Link href={`/${locale}/payments`}>{t('backToPayments')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPendingBankTransfer =
    payment.method === 'bank_transfer' && payment.status === 'pending';

  return (
    <div className="container py-8 space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/payments`}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('backToPayments')}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-muted rounded-lg">
              {methodIcons[payment.method]}
            </span>
            <div>
              <h1 className="text-2xl font-bold font-mono">{payment.paymentNumber}</h1>
              <p className="text-muted-foreground">{t(`method.${payment.method}`)}</p>
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>
        </div>

        {isPendingBankTransfer && (
          <div className="flex gap-2">
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="me-2 h-4 w-4" />
              {t('approve')}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="me-2 h-4 w-4" />
              {t('reject')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('paymentDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('amount')}</p>
              <p className="text-3xl font-bold">{formatCurrency(payment.amount)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('paymentDate')}:</span>
                <span>{formatDate(payment.paymentDate)}</span>
              </div>

              {payment.processedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">{t('processedAt')}:</span>
                  <span>{formatDate(payment.processedAt)}</span>
                </div>
              )}

              <Separator />

              {payment.invoiceId && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('invoice')}:</span>
                  <Link
                    href={`/${locale}/invoices/${payment.invoiceId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {payment.invoiceId.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {payment.customerId && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('customer.customer')}:</span>
                  <Link
                    href={`/${locale}/customers/${payment.customerId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {payment.customerId.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer Details */}
        {payment.bankTransfer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('bankTransferDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('transactionRef')}</p>
                  <p className="font-mono">{payment.bankTransfer.transactionReference}</p>
                </div>

                {payment.bankTransfer.bankName && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bankName')}</p>
                    <p>{payment.bankTransfer.bankName}</p>
                  </div>
                )}

                {payment.bankTransfer.proofDocumentUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('proofDocument')}</p>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={payment.bankTransfer.proofDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="me-2 h-4 w-4" />
                        {t('viewProof')}
                      </a>
                    </Button>
                  </div>
                )}

                {payment.bankTransfer.reviewedBy && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('reviewedBy')}</p>
                      <p>{payment.bankTransfer.reviewedBy}</p>
                    </div>
                    {payment.bankTransfer.reviewedAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('reviewedAt')}</p>
                        <p>{formatDate(payment.bankTransfer.reviewedAt)}</p>
                      </div>
                    )}
                  </>
                )}

                {payment.bankTransfer.rejectionReason && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">
                      {t('rejectionReason')}
                    </p>
                    <p className="text-sm">{payment.bankTransfer.rejectionReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stripe Details */}
        {payment.method === 'stripe' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('stripeDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.stripePaymentIntentId && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('paymentIntent')}</p>
                  <p className="font-mono text-sm">{payment.stripePaymentIntentId}</p>
                </div>
              )}
              {payment.stripeChargeId && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('chargeId')}</p>
                  <p className="font-mono text-sm">{payment.stripeChargeId}</p>
                </div>
              )}
              {payment.stripeCheckoutSessionId && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('checkoutSession')}</p>
                  <p className="font-mono text-sm">{payment.stripeCheckoutSessionId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {payment.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('notes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{payment.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <span>{t('createdBy')}: </span>
              <span className="text-foreground">{payment.createdBy}</span>
            </div>
            <div>
              <span>{t('createdAt')}: </span>
              <span className="text-foreground">{formatDate(payment.createdAt)}</span>
            </div>
            <div>
              <span>{t('updatedAt')}: </span>
              <span className="text-foreground">{formatDate(payment.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
