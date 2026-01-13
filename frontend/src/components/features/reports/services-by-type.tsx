'use client';

/**
 * Services by Type Component
 * Displays distribution of active services by category
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceType } from '@/types/models/service-catalog';
import { cn } from '@/lib/utils';

interface ServicesByTypeProps {
  data: Record<ServiceType, number>;
  isLoading?: boolean;
}

const typeColors: Record<ServiceType, { bg: string; text: string }> = {
  visa: { bg: 'bg-green-500', text: 'text-green-700' },
  ticket: { bg: 'bg-blue-500', text: 'text-blue-700' },
  hotel: { bg: 'bg-purple-500', text: 'text-purple-700' },
  insurance: { bg: 'bg-orange-500', text: 'text-orange-700' },
  other: { bg: 'bg-gray-500', text: 'text-gray-700' },
};

export function ServicesByType({ data, isLoading }: ServicesByTypeProps) {
  const t = useTranslations('reports');
  const tServices = useTranslations('services');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const types: ServiceType[] = ['visa', 'ticket', 'hotel', 'insurance', 'other'];

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('servicesByType')}</CardTitle>
          <CardDescription>{t('servicesByTypeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No active services
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages and segments for visual representation
  const segments = types
    .map(type => ({
      type,
      count: data[type] || 0,
      percentage: total > 0 ? ((data[type] || 0) / total) * 100 : 0,
    }))
    .filter(s => s.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('servicesByType')}</CardTitle>
        <CardDescription>{t('servicesByTypeDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual bar representation */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
            {segments.map((segment) => (
              <div
                key={segment.type}
                className={cn(typeColors[segment.type].bg, 'transition-all duration-300')}
                style={{ width: `${segment.percentage}%` }}
                title={`${tServices(`types.${segment.type}`)}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Legend with counts */}
          <div className="grid grid-cols-2 gap-3">
            {types.map(type => {
              const count = data[type] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', typeColors[type].bg)} />
                    <span className="text-sm">{tServices(`types.${type}`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-medium">Total Services</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
