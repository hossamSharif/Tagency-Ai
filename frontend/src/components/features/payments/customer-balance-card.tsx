'use client';

// CustomerBalanceCard component
// T150 [US3] Create CustomerBalanceCard component

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerBalanceData } from '@/hooks/use-customer-balance';

interface CustomerBalanceCardProps {
  data: CustomerBalanceData;
  currency?: string;
  locale?: 'ar' | 'en';
}

export function CustomerBalanceCard({
  data,
  currency = 'USD',
  locale = 'ar',
}: CustomerBalanceCardProps) {
  const t = useTranslations('payments');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('accountBalance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">{t('currentBalance')}</p>
          <p
            className={`text-3xl font-bold ${
              data.balance > 0 ? 'text-destructive' : 'text-green-600'
            }`}
          >
            {formatCurrency(data.balance)}
          </p>
          {data.balance > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t('amountOwed')}</p>
          )}
          {data.balance <= 0 && (
            <p className="text-xs text-green-600 mt-1">{t('allPaid')}</p>
          )}
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {t('totalInvoiced')}
            </div>
            <p className="text-lg font-semibold">{formatCurrency(data.totalInvoiced)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              {t('totalPaid')}
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(data.totalPaid)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              {t('invoices')}
            </div>
            <span className="font-medium">{data.invoiceCount}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              {t('payments')}
            </div>
            <span className="font-medium">{data.paymentCount}</span>
          </div>

          {data.pendingPayments > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                {t('pendingPayments')}
              </div>
              <span className="font-medium text-yellow-600">
                {formatCurrency(data.pendingPayments)}
              </span>
            </div>
          )}

          {data.overdueAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t('overdue')}
              </div>
              <span className="font-medium text-destructive">
                {formatCurrency(data.overdueAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Last Payment */}
        {data.lastPaymentDate && (
          <div className="pt-4 border-t text-sm text-muted-foreground">
            {t('lastPayment')}: {formatDate(data.lastPaymentDate)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
