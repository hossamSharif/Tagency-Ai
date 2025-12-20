'use client';

/**
 * T264 [US11] Sales Report Hook
 *
 * Provides sales report data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from './use-tenant';
import {
  getSalesReportAction,
  SalesReportData,
  DateRange,
} from '@/app/actions/reports';

interface UseSalesReportResult {
  data: SalesReportData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSalesReport(dateRange?: DateRange): UseSalesReportResult {
  const { tenant } = useTenant();
  const [data, setData] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenant?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSalesReportAction(tenant.id, dateRange);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales report');
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
