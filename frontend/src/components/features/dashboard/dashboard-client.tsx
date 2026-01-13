'use client';

/**
 * T272 [US11] Dashboard Client Component
 *
 * Main dashboard layout with stats, charts, and activity feed
 */

import { useFinanceDashboard } from '@/hooks/use-finance-dashboard';
import {
  DashboardStats,
  RevenueChart,
  MostUsedServices,
  ServiceRevenueBreakdown,
  ServicesByType,
  RecentActivityFeed,
} from '@/components/features/reports';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardClient() {
  const { data, isLoading, error, refetch } = useFinanceDashboard();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <DashboardStats
        totalRevenue={data?.totalRevenue || 0}
        totalInvoices={data?.totalInvoices || 0}
        totalCustomers={data?.totalCustomers || 0}
        activeServices={data?.activeServices || 0}
        pendingPayments={data?.pendingPayments || 0}
        pendingCommissions={data?.pendingCommissions || 0}
        currency={data?.currency || 'USD'}
        revenueChange={data?.revenueChange}
        invoicesChange={data?.invoicesChange}
        customersChange={data?.customersChange}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart
          data={data?.revenueByMonth || []}
          currency={data?.currency || 'USD'}
          isLoading={isLoading}
        />
        <ServiceRevenueBreakdown
          data={data?.serviceRevenueByType || []}
          currency={data?.currency || 'USD'}
          isLoading={isLoading}
        />
      </div>

      {/* Service Analytics & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <MostUsedServices
            data={data?.mostUsedServices || []}
            locale={locale as 'en' | 'ar'}
            isLoading={isLoading}
          />
          <ServicesByType
            data={data?.servicesByType || { visa: 0, ticket: 0, hotel: 0, insurance: 0, other: 0 }}
            isLoading={isLoading}
          />
        </div>
        <RecentActivityFeed
          activities={data?.recentActivity || []}
          currency={data?.currency || 'USD'}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
