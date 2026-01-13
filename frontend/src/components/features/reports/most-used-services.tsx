'use client';

/**
 * Most Used Services Component
 * Displays top 5 services by usage count with horizontal bar visualization
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ServiceType } from '@/types/models/service-catalog';
import { cn } from '@/lib/utils';

interface MostUsedServicesProps {
  data: {
    id: string;
    name: string;
    nameAr: string;
    type: ServiceType;
    usageCount: number;
  }[];
  locale?: 'en' | 'ar';
  isLoading?: boolean;
}

const typeColors: Record<ServiceType, { bg: string; text: string; border: string }> = {
  visa: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  ticket: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  hotel: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  insurance: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

export function MostUsedServices({ data, locale = 'en', isLoading }: MostUsedServicesProps) {
  const t = useTranslations('reports');
  const tServices = useTranslations('services');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('mostUsedServices')}</CardTitle>
          <CardDescription>{t('mostUsedServicesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {locale === 'ar' ? 'لا توجد خدمات مستخدمة' : 'No services used yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxUsage = Math.max(...data.map(s => s.usageCount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mostUsedServices')}</CardTitle>
        <CardDescription>{t('mostUsedServicesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((service, index) => {
            const percentage = (service.usageCount / maxUsage) * 100;
            const serviceName = locale === 'ar' ? service.nameAr : service.name;

            return (
              <div key={service.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium truncate" title={serviceName}>
                      {serviceName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs flex-shrink-0',
                        typeColors[service.type].bg,
                        typeColors[service.type].text,
                        typeColors[service.type].border
                      )}
                    >
                      {tServices(`types.${service.type}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold">{service.usageCount}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('servicesUsed')}
                    </span>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="h-2 w-full rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      typeColors[service.type].bg.replace('100', '500')
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
