'use client';

/**
 * T263 [US11] Finance Dashboard Hook
 *
 * Provides finance dashboard data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from './use-tenant';
import {
  getFinanceDashboardAction,
  FinanceDashboardData,
  DateRange,
} from '@/app/actions/reports';

interface UseFinanceDashboardResult {
  data: FinanceDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFinanceDashboard(dateRange?: DateRange): UseFinanceDashboardResult {
  const { tenant } = useTenant();
  const [data, setData] = useState<FinanceDashboardData | null>(null);
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
      const result = await getFinanceDashboardAction(tenant.id, dateRange);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
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
