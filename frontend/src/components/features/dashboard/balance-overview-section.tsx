'use client';

/**
 * Balance Overview Section Component
 *
 * Displays cash balance, bank balance, and profit overview
 * in a visually appealing card layout for the dashboard.
 */

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Banknote, Building2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinancialOverview {
  cashBalance: number;
  bankBalance: number;
  totalLiquidity: number;
  profit: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

interface BalanceOverviewSectionProps {
  data: FinancialOverview;
  currency?: string;
}

export function BalanceOverviewSection({
  data,
  currency = 'SAR',
}: BalanceOverviewSectionProps) {
  const t = useTranslations('dashboard');
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isArabic = locale === 'ar';

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale to ensure English numerals (0-9) instead of Arabic numerals
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isProfitable = data.profit.netIncome >= 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t('balanceOverview.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cash Balance Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-100 dark:from-green-950/30 dark:to-emerald-950/20 dark:border-green-900">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t('balanceOverview.cashBalance')}
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(data.cashBalance)}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  {currency}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-green-200/50 dark:border-green-800/50">
              <p className="text-xs text-green-600 dark:text-green-400">
                {t('balanceOverview.cashDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Balance Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50/50 border-blue-100 dark:from-blue-950/30 dark:to-sky-950/20 dark:border-blue-900">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {t('balanceOverview.bankBalance')}
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(data.bankBalance)}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  {currency}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {t('balanceOverview.bankDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profit/Loss Card */}
        <Card
          className={cn(
            'bg-gradient-to-br',
            isProfitable
              ? 'from-violet-50 to-purple-50/50 border-violet-100 dark:from-violet-950/30 dark:to-purple-950/20 dark:border-violet-900'
              : 'from-rose-50 to-red-50/50 border-rose-100 dark:from-rose-950/30 dark:to-red-950/20 dark:border-rose-900'
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isProfitable
                      ? 'text-violet-700 dark:text-violet-400'
                      : 'text-rose-700 dark:text-rose-400'
                  )}
                >
                  {isProfitable
                    ? t('balanceOverview.netProfit')
                    : t('balanceOverview.netLoss')}
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    isProfitable
                      ? 'text-violet-900 dark:text-violet-100'
                      : 'text-rose-900 dark:text-rose-100'
                  )}
                >
                  {formatCurrency(Math.abs(data.profit.netIncome))}
                </p>
                <p
                  className={cn(
                    'text-xs',
                    isProfitable
                      ? 'text-violet-600/70 dark:text-violet-400/70'
                      : 'text-rose-600/70 dark:text-rose-400/70'
                  )}
                >
                  {currency}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  isProfitable
                    ? 'bg-violet-100 dark:bg-violet-900/50'
                    : 'bg-rose-100 dark:bg-rose-900/50'
                )}
              >
                {isProfitable ? (
                  <TrendingUp
                    className={cn(
                      'h-6 w-6',
                      'text-violet-600 dark:text-violet-400'
                    )}
                  />
                ) : (
                  <TrendingDown
                    className={cn('h-6 w-6', 'text-rose-600 dark:text-rose-400')}
                  />
                )}
              </div>
            </div>
            <div
              className={cn(
                'mt-4 pt-3 border-t',
                isProfitable
                  ? 'border-violet-200/50 dark:border-violet-800/50'
                  : 'border-rose-200/50 dark:border-rose-800/50'
              )}
            >
              <div className="flex justify-between text-xs">
                <span
                  className={cn(
                    isProfitable
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {t('balanceOverview.revenue')}: {formatCurrency(data.profit.revenue)}
                </span>
                <span
                  className={cn(
                    isProfitable
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {t('balanceOverview.expenses')}: {formatCurrency(data.profit.expenses)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Liquidity Summary */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 dark:from-slate-900/50 dark:to-gray-900/30 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('balanceOverview.totalLiquidity')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {t('balanceOverview.totalLiquidityDescription')}
                </p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(data.totalLiquidity)}
              </p>
              <p className="text-xs text-slate-500">{currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default BalanceOverviewSection;
