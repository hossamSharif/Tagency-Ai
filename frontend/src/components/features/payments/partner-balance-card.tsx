'use client';

// T054 [P] [US4] Partner balance card component
// Displays partner payment balance with commission breakdown

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
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/hooks/use-tenant';

export interface PartnerBalanceData {
  balance: number;
  totalGross: number;
  totalCommission: number;
  totalPaid: number;
  invoiceCount: number;
  paymentCount: number;
  pendingCommissions: number;
  lastPaymentDate?: Date;
}

interface PartnerBalanceCardProps {
  data: PartnerBalanceData;
  currency?: string;
  locale?: 'ar' | 'en';
}

export function PartnerBalanceCard({
  data,
  currency,
  locale = 'ar',
}: PartnerBalanceCardProps) {
  const t = useTranslations('payments');
  const { tenant } = useTenant();
  const dateLocale = locale === 'ar' ? ar : enUS;
  // Use tenant's currency if currency prop is not provided
  const effectiveCurrency = currency || tenant?.currency || 'SAR';

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: effectiveCurrency,
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
          {t('partnerBalance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">{t('amountDue')}</p>
          <p
            className={`text-3xl font-bold ${
              data.balance > 0 ? 'text-orange-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(data.balance)}
          </p>
          {data.balance > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t('toPartner')}</p>
          )}
          {data.balance <= 0 && (
            <p className="text-xs text-green-600 mt-1">{t('allSettled')}</p>
          )}
        </div>

        {/* Commission Summary Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {t('totalGross')}
            </div>
            <p className="text-lg font-semibold">{formatCurrency(data.totalGross)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t('officeCommission')}
            </div>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(data.totalCommission)}
            </p>
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

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('netAmount')}
            </div>
            <p className="text-lg font-semibold text-orange-600">
              {formatCurrency(data.totalGross - data.totalCommission)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              {t('invoicesWithPartner')}
            </div>
            <span className="font-medium">{data.invoiceCount}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              {t('paymentsToPartner')}
            </div>
            <span className="font-medium">{data.paymentCount}</span>
          </div>

          {data.pendingCommissions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                {t('pendingCommissions')}
              </div>
              <span className="font-medium text-orange-600">
                {formatCurrency(data.pendingCommissions)}
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

        {/* Helpful Note */}
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>{t('partnerBalanceNote')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
