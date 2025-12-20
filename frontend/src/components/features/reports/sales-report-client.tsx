'use client';

/**
 * T274 [US11] Sales Report Client Component
 *
 * Detailed sales report with filtering and data tables
 */

import { useSalesReport } from '@/hooks/use-sales-report';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { AlertCircle, RefreshCw, DollarSign, Receipt, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function SalesReportClient() {
  const { data, isLoading, error, refetch } = useSalesReport();
  const t = useTranslations('invoices');
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
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tReports('totalSales') || 'Total Sales'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data?.totalSales || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tReports('totalInvoiced') || 'Total Invoiced'}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data?.totalInvoiced || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tReports('totalCollected') || 'Collected'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={data?.totalCollected || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tReports('outstanding') || 'Outstanding'}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <CurrencyDisplay amount={data?.outstandingBalance || 0} currency={currency} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Package Type */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('salesByType') || 'Sales by Package Type'}</CardTitle>
          <CardDescription>
            {tReports('salesByTypeDescription') || 'Breakdown of sales by package category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.salesByPackageType && data.salesByPackageType.length > 0 ? (
            <div className="space-y-4">
              {data.salesByPackageType.map((item) => {
                const percentage = data.totalSales > 0
                  ? (item.amount / data.totalSales) * 100
                  : 0;

                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{item.type}</span>
                      <span>
                        <CurrencyDisplay amount={item.amount} currency={currency} />
                        {' '}({item.count} bookings)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No sales data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('topCustomers') || 'Top Customers'}</CardTitle>
          <CardDescription>
            {tReports('topCustomersDescription') || 'Customers with highest spending'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.topCustomers && data.topCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t('fields.customer') || 'Customer'}</TableHead>
                  <TableHead className="text-center">Bookings</TableHead>
                  <TableHead className="text-end">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustomers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-center">{customer.bookingsCount}</TableCell>
                    <TableCell className="text-end">
                      <CurrencyDisplay amount={customer.totalSpent} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No customer data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {tReports('recentInvoicesDescription') || 'Recent invoice activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.invoices && data.invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                  <TableHead className="text-end">Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      {format(invoice.issueDate, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-end">
                      <CurrencyDisplay amount={invoice.total} currency={currency} />
                    </TableCell>
                    <TableCell className="text-end">
                      <CurrencyDisplay amount={invoice.paidAmount} currency={currency} />
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status] || statusColors.draft}>
                        {t(`status.${invoice.status}`) || invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No invoices found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
