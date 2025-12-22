'use client';

// T046 [P] [US3] Payment list component
// Displays a list of payments with filtering and sorting

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Payment, PaymentType, PaymentMethod, PaymentTransactionStatus } from '@/types/models/payment';
import { PaymentCard } from './payment-card';

interface PaymentListProps {
  payments: Payment[];
  onPaymentClick?: (payment: Payment) => void;
  showFilters?: boolean;
}

export function PaymentList({ payments, onPaymentClick, showFilters = true }: PaymentListProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PaymentType | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentTransactionStatus | 'all'>('all');

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = typeFilter === 'all' || payment.paymentType === typeFilter;

    // Method filter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesType && matchesMethod && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setMethodFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    searchQuery !== '' || typeFilter !== 'all' || methodFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('payments.filters')}</span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t('common.clearFilters')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('payments.searchPayments')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as PaymentType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder={t('payments.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="customer_receipt">{t('payments.types.customerReceipt')}</SelectItem>
                <SelectItem value="partner_payment">{t('payments.types.partnerPayment')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value as PaymentMethod | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder={t('payments.filterByMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                <SelectItem value="bank">{t('payments.methods.bank')}</SelectItem>
                <SelectItem value="stripe">{t('payments.methods.stripe')}</SelectItem>
                <SelectItem value="bank_transfer">{t('payments.methods.bankTransfer')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentTransactionStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder={t('payments.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="completed">{t('payments.status.completed')}</SelectItem>
                <SelectItem value="pending">{t('payments.status.pending')}</SelectItem>
                <SelectItem value="failed">{t('payments.status.failed')}</SelectItem>
                <SelectItem value="cancelled">{t('payments.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('payments.showingResults', {
            count: filteredPayments.length,
            total: payments.length,
          })}
        </p>
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">{t('payments.noPaymentsFound')}</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} onClick={() => onPaymentClick?.(payment)} />
          ))}
        </div>
      )}
    </div>
  );
}
