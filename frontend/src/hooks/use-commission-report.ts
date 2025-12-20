'use client';

/**
 * T265 [US11] Commission Report Hook
 *
 * Provides commission report data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from './use-tenant';
import {
  getCommissionReportAction,
  CommissionReportData,
  DateRange,
} from '@/app/actions/reports';

interface UseCommissionReportResult {
  data: CommissionReportData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCommissionReport(dateRange?: DateRange): UseCommissionReportResult {
  const { tenant } = useTenant();
  const [data, setData] = useState<CommissionReportData | null>(null);
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
      const result = await getCommissionReportAction(tenant.id, dateRange);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commission report');
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
