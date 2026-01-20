'use client';

/**
 * Partner Balance Display Component
 *
 * Displays the current balance for a selected partner
 */

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface PartnerBalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
  locale: string;
  currency?: string;
}

export function PartnerBalanceDisplay({
  balance,
  isLoading,
  locale,
  currency = 'SAR',
}: PartnerBalanceDisplayProps) {
  const t = useTranslations('partnerEntries');
  const isArabic = locale === 'ar';

  // Format currency
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);
    return `${currency} ${formatted}`;
  };

  // Determine balance type
  // Negative balance on liability account means we owe them (credit balance)
  // Positive balance means they prepaid us (debit balance)
  const isCredit = balance < 0;
  const displayBalance = Math.abs(balance);
  const balanceType = isCredit
    ? (isArabic ? 'دائن' : 'Credit')
    : (isArabic ? 'مدين' : 'Debit');

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-6 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isCredit
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
          : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isCredit
              ? 'bg-green-100 dark:bg-green-900/50'
              : 'bg-orange-100 dark:bg-orange-900/50'
          )}
        >
          {isCredit ? (
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{t('currentBalance')}</p>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-xl font-bold',
                isCredit
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-orange-700 dark:text-orange-400'
              )}
            >
              {formatCurrency(displayBalance)}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                isCredit
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-orange-600 dark:text-orange-500'
              )}
            >
              ({balanceType})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerBalanceDisplay;
