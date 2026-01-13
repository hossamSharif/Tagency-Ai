'use client';

// Payments list page
// T153 [US3] Create payments list page
// T058 [US4] Enhanced with partner payments section

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Search, Filter, CreditCard, CheckCircle, XCircle, Users, UserCheck, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentCard } from '@/components/features/payments/payment-card';
import { RecordPartnerPaymentDialog } from '@/components/features/payments/record-partner-payment-dialog';
import { usePayments } from '@/hooks/use-payments';
import { usePartners } from '@/hooks/use-partners';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import {
  approveBankTransferAction,
  rejectBankTransferAction,
  recordPartnerPaymentAction,
  getPaymentAccountsAction,
} from '@/app/actions/payments';
import { PaymentMethod, PaymentTransactionStatus, PaymentType, CreatePartnerPaymentInput } from '@/types/models/payment';
import { Account } from '@/types/models/account';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const params = useParams();
  const locale = (params.locale as 'ar' | 'en') || 'ar';

  const { tenant } = useTenant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'partner'>('customer');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentTransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');

  // Partner payment dialog state
  const [showPartnerPaymentDialog, setShowPartnerPaymentDialog] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');
  const [paymentAccounts, setPaymentAccounts] = useState<Account[]>([]);

  const { payments, loading, error } = usePayments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    method: methodFilter === 'all' ? undefined : methodFilter,
    search,
  });

  const { partners, loading: partnersLoading } = usePartners({});

  // Filter payments by type
  const customerPayments = payments.filter(p => p.paymentType === 'customer_receipt' || !p.paymentType);
  const partnerPayments = payments.filter(p => p.paymentType === 'partner_payment');

  // Fetch payment accounts on mount
  useEffect(() => {
    async function fetchPaymentAccounts() {
      if (!tenant?.id) return;

      try {
        const result = await getPaymentAccountsAction(tenant.id);

        if (result.success && result.data) {
          setPaymentAccounts(result.data as Account[]);
        } else if (!result.success) {
          console.error('Error fetching payment accounts:', result.error);
        }
      } catch (error) {
        console.error('Error fetching payment accounts:', error);
      }
    }

    fetchPaymentAccounts();
  }, [tenant?.id]);

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

  const handleRecordPartnerPayment = async (data: CreatePartnerPaymentInput) => {
    if (!tenant?.id || !user?.uid) return;

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
  };

  const openPartnerPaymentDialog = (partnerId: string, partnerName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedPartnerName(partnerName);
    setShowPartnerPaymentDialog(true);
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

      {/* Tabs for Customer and Partner Payments */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'customer' | 'partner')}>
        <TabsList>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('customerPayments')} ({customerPayments.length})
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {t('partnerPayments')} ({partnerPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Customer Payments Tab */}
        <TabsContent value="customer" className="space-y-6">
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
                <SelectItem value="cash">{t('methods.cash')}</SelectItem>
                <SelectItem value="bank_transfer">{t('methods.bankTransfer')}</SelectItem>
                <SelectItem value="stripe">{t('methods.stripe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment List */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : customerPayments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('noCustomerPayments')}</h3>
              <p className="text-muted-foreground">{t('noCustomerPaymentsDesc')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerPayments.map((payment) => (
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
        </TabsContent>

        {/* Partner Payments Tab */}
        <TabsContent value="partner" className="space-y-6">
          {/* Header with Record Payment Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t('partnerPayments')}</h2>
            <Select
              value={selectedPartnerId}
              onValueChange={(value) => {
                const partner = partners.find(p => p.id === value);
                if (partner) {
                  openPartnerPaymentDialog(partner.id, partner.name);
                }
              }}
            >
              <SelectTrigger className="w-[280px]">
                <Plus className="me-2 h-4 w-4" />
                <SelectValue placeholder={t('recordPartnerPayment')} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPartnerPayments')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>

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
                <SelectItem value="cash">{t('methods.cash')}</SelectItem>
                <SelectItem value="bank">{t('methods.bank')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partner Payment List */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : partnerPayments.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('noPartnerPayments')}</h3>
              <p className="text-muted-foreground">{t('noPartnerPaymentsDesc')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partnerPayments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Partner Payment Dialog */}
      {selectedPartnerId && selectedPartnerName && (
        <RecordPartnerPaymentDialog
          open={showPartnerPaymentDialog}
          onOpenChange={setShowPartnerPaymentDialog}
          partnerId={selectedPartnerId}
          partnerName={selectedPartnerName}
          currency={tenant?.currency || 'SAR'}
          accounts={paymentAccounts}
          onSubmit={handleRecordPartnerPayment}
          mode="invoice-based"
          locale={locale}
        />
      )}
    </div>
  );
}
