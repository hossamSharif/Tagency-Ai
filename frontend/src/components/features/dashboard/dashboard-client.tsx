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
  BookingsChart,
  TopPackagesTable,
  RecentActivityFeed,
} from '@/components/features/reports';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardClient() {
  const { data, isLoading, error, refetch } = useFinanceDashboard();

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
        totalBookings={data?.totalBookings || 0}
        totalCustomers={data?.totalCustomers || 0}
        totalPackages={data?.totalPackages || 0}
        pendingPayments={data?.pendingPayments || 0}
        pendingCommissions={data?.pendingCommissions || 0}
        currency={data?.currency || 'USD'}
        revenueChange={data?.revenueChange}
        bookingsChange={data?.bookingsChange}
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
        <BookingsChart
          data={data?.bookingsByStatus || { pending: 0, confirmed: 0, in_progress: 0, completed: 0, cancelled: 0 }}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopPackagesTable
          data={data?.topPackages || []}
          currency={data?.currency || 'USD'}
          isLoading={isLoading}
        />
        <RecentActivityFeed
          activities={data?.recentActivity || []}
          currency={data?.currency || 'USD'}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
