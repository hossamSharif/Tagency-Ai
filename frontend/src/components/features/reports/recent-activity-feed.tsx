'use client';

/**
 * T271 [US11] Recent Activity Feed Component
 *
 * Displays recent activity (bookings, payments, invoices)
 */

import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CreditCard, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { CurrencyCode } from '@/types/models/tenant';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'invoice';
  description: string;
  amount?: number;
  createdAt: Date;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  currency: CurrencyCode;
  isLoading?: boolean;
}

const activityIcons = {
  booking: Calendar,
  payment: CreditCard,
  invoice: FileText,
};

const activityColors = {
  booking: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  payment: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  invoice: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
};

export function RecentActivityFeed({ activities, currency, isLoading }: RecentActivityFeedProps) {
  const t = useTranslations('reports');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentActivity') || 'Recent Activity'}</CardTitle>
        <CardDescription>
          {t('recentActivityDescription') || 'Latest bookings, payments, and invoices'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {t('noActivity') || 'No recent activity'}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      activityColors[activity.type]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {activity.amount !== undefined && (
                    <div className="text-sm font-medium">
                      <CurrencyDisplay amount={activity.amount} currency={currency} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
