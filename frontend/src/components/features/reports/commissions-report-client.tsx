'use client';

/**
 * T275 [US11] Commissions Report Client Component
 *
 * Detailed commissions report with partner breakdown
 */

import { useCommissionReport } from '@/hooks/use-commission-report';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, RefreshCw, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  disputed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function CommissionsReportClient() {
  const { data, isLoading, error, refetch } = useCommissionReport();
  const t = useTranslations('partners');
  const tReports = useTranslations('reports');

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="me-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = data?.currency || 'USD';
  const settledPercentage = data?.totalCommissions
    ? (data.settledCommissions / data.totalCommissions) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('commissions.total') || 'Total Commissions'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data?.totalCommissions || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('commissions.pending') || 'Pending'}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              <CurrencyDisplay amount={data?.pendingCommissions || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('commissions.settled') || 'Settled'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={data?.settledCommissions || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('settlementProgress') || 'Settlement Progress'}</CardTitle>
          <CardDescription>
            {tReports('settlementProgressDescription') || 'Overall commission settlement status'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {tReports('settled') || 'Settled'}: <CurrencyDisplay amount={data?.settledCommissions || 0} currency={currency} />
              </span>
              <span className="font-medium">{settledPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={settledPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions by Partner */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('commissionsByPartner') || 'Commissions by Partner'}</CardTitle>
          <CardDescription>
            {tReports('commissionsByPartnerDescription') || 'Commission breakdown by partner office'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.commissionsByPartner && data.commissionsByPartner.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tReports('tableHeaders.partner') || t('partner')}</TableHead>
                  <TableHead className="text-center">{tReports('tableHeaders.services') || 'Services'}</TableHead>
                  <TableHead className="text-end">{tReports('tableHeaders.total') || 'Total'}</TableHead>
                  <TableHead className="text-end">{tReports('tableHeaders.pending') || 'Pending'}</TableHead>
                  <TableHead className="text-end">{tReports('tableHeaders.settled') || 'Settled'}</TableHead>
                  <TableHead>{tReports('tableHeaders.progress') || 'Progress'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.commissionsByPartner.map((partner) => {
                  const partnerProgress = partner.totalAmount > 0
                    ? (partner.settledAmount / partner.totalAmount) * 100
                    : 0;

                  return (
                    <TableRow key={partner.partnerId}>
                      <TableCell className="font-medium">{partner.partnerName}</TableCell>
                      <TableCell className="text-center">{partner.servicesCount}</TableCell>
                      <TableCell className="text-end">
                        <CurrencyDisplay amount={partner.totalAmount} currency={currency} />
                      </TableCell>
                      <TableCell className="text-end text-yellow-600">
                        <CurrencyDisplay amount={partner.pendingAmount} currency={currency} />
                      </TableCell>
                      <TableCell className="text-end text-green-600">
                        <CurrencyDisplay amount={partner.settledAmount} currency={currency} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={partnerProgress} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">
                            {partnerProgress.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No partner commission data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('commissionsTrend') || 'Commissions Trend'}</CardTitle>
          <CardDescription>
            {tReports('commissionsTrendDescription') || 'Monthly commission totals and settlements'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.commissionsByMonth && data.commissionsByMonth.length > 0 ? (
            <div className="space-y-3">
              {data.commissionsByMonth.slice(-6).map((month) => {
                const monthProgress = month.total > 0
                  ? (month.settled / month.total) * 100
                  : 0;
                const [year, monthNum] = month.month.split('-');
                const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                const monthLabel = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

                return (
                  <div key={month.month} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{monthLabel}</span>
                      <span>
                        <CurrencyDisplay amount={month.settled} currency={currency} />
                        {' / '}
                        <CurrencyDisplay amount={month.total} currency={currency} />
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${monthProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settlements.title')}</CardTitle>
          <CardDescription>
            {tReports('recentSettlementsDescription') || 'Recent settlement activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentSettlements && data.recentSettlements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tReports('tableHeaders.settlementNumber') || 'Settlement #'}</TableHead>
                  <TableHead>{tReports('tableHeaders.partner') || 'Partner'}</TableHead>
                  <TableHead>{tReports('tableHeaders.date') || 'Date'}</TableHead>
                  <TableHead className="text-end">{tReports('tableHeaders.amount') || 'Amount'}</TableHead>
                  <TableHead>{tReports('tableHeaders.status') || 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-mono text-sm">
                      {settlement.settlementNumber}
                    </TableCell>
                    <TableCell>{settlement.partnerName}</TableCell>
                    <TableCell>
                      {format(settlement.createdAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      <CurrencyDisplay amount={settlement.amount} currency={currency} />
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[settlement.status] || statusColors.pending}>
                        {t(`settlements.status.${settlement.status}`) || settlement.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No settlements found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
