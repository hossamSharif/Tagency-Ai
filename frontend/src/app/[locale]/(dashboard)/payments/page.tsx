'use client';

// Payments list page
// T153 [US3] Create payments list page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Search, Filter, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentCard } from '@/components/features/payments/payment-card';
import { usePayments } from '@/hooks/use-payments';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import {
  approveBankTransferAction,
  rejectBankTransferAction,
} from '@/app/actions/payments';
import { PaymentMethod, PaymentTransactionStatus } from '@/types/models/payment';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const params = useParams();
  const locale = (params.locale as 'ar' | 'en') || 'ar';

  const { tenant } = useTenant();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentTransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');

  const { payments, loading, error } = usePayments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    method: methodFilter === 'all' ? undefined : methodFilter,
    search,
  });

  const handleApprove = async (paymentId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const result = await approveBankTransferAction(tenant.id, user.uid, { paymentId });

    if (result.success) {
      toast.success(t('paymentApproved'));
    } else {
      toast.error(result.error || t('approvalError'));
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const reason = prompt(t('rejectionReason'));
    if (!reason) return;

    const result = await rejectBankTransferAction(tenant.id, user.uid, {
      paymentId,
      rejectionReason: reason,
    });

    if (result.success) {
      toast.success(t('paymentRejected'));
    } else {
      toast.error(result.error || t('rejectionError'));
    }
  };

  // Count pending bank transfers
  const pendingBankTransfers = payments.filter(
    (p) => p.method === 'bank_transfer' && p.status === 'pending'
  ).length;

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>{t('loadError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {pendingBankTransfers > 0 && (
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <span className="font-medium">{pendingBankTransfers}</span>
            <span>{t('pendingApproval')}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PaymentTransactionStatus | 'all')}
        >
          <SelectTrigger className="w-full md:w-48">
            <Filter className="me-2 h-4 w-4" />
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="completed">{t('status.completed')}</SelectItem>
            <SelectItem value="failed">{t('status.failed')}</SelectItem>
            <SelectItem value="refunded">{t('status.refunded')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={methodFilter}
          onValueChange={(value) => setMethodFilter(value as PaymentMethod | 'all')}
        >
          <SelectTrigger className="w-full md:w-48">
            <CreditCard className="me-2 h-4 w-4" />
            <SelectValue placeholder={t('filterByMethod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allMethods')}</SelectItem>
            <SelectItem value="cash">{t('method.cash')}</SelectItem>
            <SelectItem value="bank_transfer">{t('method.bank_transfer')}</SelectItem>
            <SelectItem value="stripe">{t('method.stripe')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Bank Transfers Quick Actions */}
      {statusFilter === 'pending' && pendingBankTransfers > 0 && (
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground">
            {t('quickActions')}:
          </span>
        </div>
      )}

      {/* Payment List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noPayments')}</h3>
          <p className="text-muted-foreground">{t('noPaymentsDesc')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              locale={locale}
              onApprove={() => handleApprove(payment.id)}
              onReject={() => handleReject(payment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
