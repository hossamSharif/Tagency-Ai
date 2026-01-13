'use client';

/**
 * Service Revenue Breakdown Component
 * Displays revenue contribution by service type with horizontal bar visualization
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceType } from '@/types/models/service-catalog';
import { CurrencyCode } from '@/types/models/invoice';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { cn } from '@/lib/utils';

interface ServiceRevenueBreakdownProps {
  data: {
    type: ServiceType;
    revenue: number;
    count: number;
  }[];
  currency: CurrencyCode;
  isLoading?: boolean;
}

const typeColors: Record<ServiceType, string> = {
  visa: 'bg-green-500',
  ticket: 'bg-blue-500',
  hotel: 'bg-purple-500',
  insurance: 'bg-orange-500',
  other: 'bg-gray-500',
};

export function ServiceRevenueBreakdown({ data, currency, isLoading }: ServiceRevenueBreakdownProps) {
  const t = useTranslations('reports');
  const tServices = useTranslations('services');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  if (totalRevenue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('serviceRevenue')}</CardTitle>
          <CardDescription>{t('serviceRevenueDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No revenue data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  // Calculate percentages
  const segments = sortedData.map(item => ({
    ...item,
    percentage: (item.revenue / totalRevenue) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('serviceRevenue')}</CardTitle>
        <CardDescription>{t('serviceRevenueDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual bar representation */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
            {segments.map((segment) => (
              <div
                key={segment.type}
                className={cn(typeColors[segment.type], 'transition-all duration-300')}
                style={{ width: `${segment.percentage}%` }}
                title={`${tServices(`types.${segment.type}`)}: ${segment.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Legend with revenue amounts */}
          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded-full', typeColors[segment.type])} />
                  <span className="text-sm">{tServices(`types.${segment.type}`)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({segment.count} {segment.count === 1 ? 'invoice' : 'invoices'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyDisplay amount={segment.revenue} currency={currency} />
                  <span className="text-xs text-muted-foreground">
                    ({segment.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-medium">Total Revenue</span>
            <CurrencyDisplay
              amount={totalRevenue}
              currency={currency}
              className="text-lg font-bold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
