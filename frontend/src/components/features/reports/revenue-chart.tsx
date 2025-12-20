'use client';

/**
 * T267 [US11] Revenue Chart Component
 *
 * Displays revenue trends over time
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyCode } from '@/types/models/tenant';

interface RevenueDataPoint {
  month: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency: CurrencyCode;
  isLoading?: boolean;
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenueChart({ data, currency, isLoading }: RevenueChartProps) {
  const t = useTranslations('reports');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('revenueOverTime') || 'Revenue Over Time'}</CardTitle>
        <CardDescription>
          {t('revenueDescription') || 'Monthly revenue and bookings trend'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple bar chart */}
          <div className="flex items-end gap-2 h-48">
            {data.map((point, index) => {
              const height = (point.revenue / maxRevenue) * 100;
              return (
                <div
                  key={point.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(point.revenue, currency)}
                  </div>
                  <div
                    className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${formatMonth(point.month)}: ${formatCurrency(point.revenue, currency)}`}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formatMonth(point.month)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-primary rounded" />
              <span className="text-muted-foreground">{t('revenue') || 'Revenue'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
