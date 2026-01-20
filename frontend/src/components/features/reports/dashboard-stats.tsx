'use client';

/**
 * T266 [US11] Dashboard Stats Component
 *
 * Displays key metrics cards for the dashboard
 */

import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Briefcase,
  Clock,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { cn } from '@/lib/utils';
import { CurrencyCode } from '@/types/models/tenant';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
  currency?: CurrencyCode;
  periodLabel?: string;
}

function StatCard({ title, value, change, icon, isCurrency, currency, periodLabel }: StatCardProps) {
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isCurrency && currency ? (
            <CurrencyDisplay amount={Number(value)} currency={currency} />
          ) : (
            value
          )}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositiveChange && (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{change}%</span>
              </>
            )}
            {isNegativeChange && (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{change}%</span>
              </>
            )}
            {!isPositiveChange && !isNegativeChange && (
              <span className="text-muted-foreground">0%</span>
            )}
            <span className="text-muted-foreground ms-1">{periodLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  activeServices: number;
  pendingPayments: number;
  pendingCommissions: number;
  currency: CurrencyCode;
  revenueChange?: number;
  invoicesChange?: number;
  customersChange?: number;
  isLoading?: boolean;
}

export function DashboardStats({
  totalRevenue,
  totalInvoices,
  totalCustomers,
  activeServices,
  pendingPayments,
  pendingCommissions,
  currency,
  revenueChange,
  invoicesChange,
  customersChange,
  isLoading,
}: DashboardStatsProps) {
  const t = useTranslations('reports');

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const periodLabel = t('vsLastPeriod') || 'vs last period';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('totalRevenue') || 'Total Revenue'}
        value={totalRevenue}
        change={revenueChange}
        icon={<DollarSign className="h-4 w-4" />}
        isCurrency
        currency={currency}
        periodLabel={periodLabel}
      />
      <StatCard
        title={t('totalInvoices') || 'Total Invoices'}
        value={totalInvoices}
        change={invoicesChange}
        icon={<FileText className="h-4 w-4" />}
        periodLabel={periodLabel}
      />
      <StatCard
        title={t('pendingPayments') || 'Pending Payments'}
        value={pendingPayments}
        icon={<Clock className="h-4 w-4" />}
        isCurrency
        currency={currency}
      />
      <StatCard
        title={t('pendingCommissions') || 'Pending Commissions'}
        value={pendingCommissions}
        icon={<Wallet className="h-4 w-4" />}
        isCurrency
        currency={currency}
      />
    </div>
  );
}
