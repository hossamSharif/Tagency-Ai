'use client';

/**
 * T268 [US11] Bookings Chart Component
 *
 * Displays bookings by status as a donut/pie visualization
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types/models/booking';
import { cn } from '@/lib/utils';

interface BookingsChartProps {
  data: Record<BookingStatus, number>;
  isLoading?: boolean;
}

const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-500', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-blue-500', text: 'text-blue-700' },
  in_progress: { bg: 'bg-purple-500', text: 'text-purple-700' },
  completed: { bg: 'bg-green-500', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-500', text: 'text-red-700' },
};

export function BookingsChart({ data, isLoading }: BookingsChartProps) {
  const t = useTranslations('bookings');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const statuses: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  // Calculate percentages and segments for visual representation
  const segments = statuses
    .map(status => ({
      status,
      count: data[status] || 0,
      percentage: total > 0 ? ((data[status] || 0) / total) * 100 : 0,
    }))
    .filter(s => s.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title') || 'Bookings'}</CardTitle>
        <CardDescription>
          {t('byStatus') || 'Distribution by status'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual bar representation */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
            {segments.map((segment, index) => (
              <div
                key={segment.status}
                className={cn(statusColors[segment.status].bg, 'transition-all duration-300')}
                style={{ width: `${segment.percentage}%` }}
                title={`${t(`status.${segment.status}`) || segment.status}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Legend with counts */}
          <div className="grid grid-cols-2 gap-3">
            {statuses.map(status => {
              const count = data[status] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', statusColors[status].bg)} />
                    <span className="text-sm">
                      {t(`status.${status === 'in_progress' ? 'inProgress' : status}`) || status}
                    </span>
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
            <span className="text-sm font-medium">{t('total') || 'Total'}</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
