'use client';

/**
 * Commission Summary Component
 *
 * Displays a summary of commission data for a partner
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerCommissions } from '@/hooks/use-partner-commissions';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface CommissionSummaryProps {
  partnerOfficeId: string;
  currency: string;
  locale?: string;
}

export function CommissionSummary({
  partnerOfficeId,
  currency,
  locale = 'en',
}: CommissionSummaryProps) {
  const isArabic = locale === 'ar';

  const { totalEarned, totalPending, totalSettled, loading } =
    usePartnerCommissions({
      partnerOfficeId,
      limit: 1000,
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: isArabic ? 'إجمالي العمولات المكتسبة' : 'Total Commissions Earned',
      value: totalEarned,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: isArabic ? 'العمولات قيد الانتظار' : 'Pending Commissions',
      value: totalPending,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: isArabic ? 'العمولات المسددة' : 'Settled Commissions',
      value: totalSettled,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stat.value)}</div>
              {index === 0 && totalEarned > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {totalSettled > totalPending ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        {Math.round((totalSettled / totalEarned) * 100)}%{' '}
                        {isArabic ? 'مسدد' : 'settled'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-amber-600" />
                      <span className="text-amber-600">
                        {Math.round((totalPending / totalEarned) * 100)}%{' '}
                        {isArabic ? 'قيد الانتظار' : 'pending'}
                      </span>
                    </>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
