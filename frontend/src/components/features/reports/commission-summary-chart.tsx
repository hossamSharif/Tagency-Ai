'use client';

/**
 * T269 [US11] Commission Summary Chart Component
 *
 * Displays commission summary by partner
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { CurrencyCode } from '@/types/models/tenant';

interface CommissionByPartner {
  partnerId: string;
  partnerName: string;
  totalAmount: number;
  pendingAmount: number;
  settledAmount: number;
  servicesCount: number;
}

interface CommissionSummaryChartProps {
  data: CommissionByPartner[];
  totalCommissions: number;
  pendingCommissions: number;
  settledCommissions: number;
  currency: CurrencyCode;
  isLoading?: boolean;
}

export function CommissionSummaryChart({
  data,
  totalCommissions,
  pendingCommissions,
  settledCommissions,
  currency,
  isLoading,
}: CommissionSummaryChartProps) {
  const t = useTranslations('partners.commissions');

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

  const settledPercentage = totalCommissions > 0
    ? (settledCommissions / totalCommissions) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title') || 'Commissions'}</CardTitle>
        <CardDescription>
          {t('partnerBreakdown') || 'Commission breakdown by partner'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">
                {t('total') || 'Total'}
              </div>
              <div className="text-lg font-bold">
                <CurrencyDisplay amount={totalCommissions} currency={currency} />
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10">
              <div className="text-xs text-muted-foreground mb-1">
                {t('pending') || 'Pending'}
              </div>
              <div className="text-lg font-bold text-yellow-600">
                <CurrencyDisplay amount={pendingCommissions} currency={currency} />
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-xs text-muted-foreground mb-1">
                {t('settled') || 'Settled'}
              </div>
              <div className="text-lg font-bold text-green-600">
                <CurrencyDisplay amount={settledCommissions} currency={currency} />
              </div>
            </div>
          </div>

          {/* Settlement progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Settlement Progress</span>
              <span className="font-medium">{settledPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={settledPercentage} className="h-2" />
          </div>

          {/* By partner */}
          {data.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">By Partner</h4>
              <div className="space-y-2">
                {data.slice(0, 5).map(partner => {
                  const partnerPercentage = totalCommissions > 0
                    ? (partner.totalAmount / totalCommissions) * 100
                    : 0;

                  return (
                    <div key={partner.partnerId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate max-w-[60%]">{partner.partnerName}</span>
                        <span className="font-medium">
                          <CurrencyDisplay amount={partner.totalAmount} currency={currency} />
                        </span>
                      </div>
                      <Progress value={partnerPercentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
              {data.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  + {data.length - 5} more partners
                </p>
              )}
            </div>
          )}

          {data.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No commission data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
