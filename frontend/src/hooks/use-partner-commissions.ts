'use client';

/**
 * Partner Commissions Hook
 *
 * React hook for fetching partner commission data from invoices
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useTenant } from './use-tenant';
import {
  subscribeToCollection,
  where,
  orderBy,
  limit as limitQuery,
  type QueryConstraint,
} from '@/lib/firebase/firestore';
import type { Invoice } from '@/types/models/invoice';

/**
 * Commission line item from an invoice
 */
export interface CommissionItem {
  invoiceId: string;
  invoiceNumber: string;
  serviceId: string;
  serviceName: string;
  serviceAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  invoiceDate: Date;
  invoiceStatus: string;
  settled: boolean;
  settlementId?: string;
  bookingId?: string;
}

export interface UsePartnerCommissionsOptions {
  partnerOfficeId: string;
  settled?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface UsePartnerCommissionsReturn {
  commissions: CommissionItem[];
  totalEarned: number;
  totalPending: number;
  totalSettled: number;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch partner commissions from invoices
 */
export function usePartnerCommissions(
  options: UsePartnerCommissionsOptions
): UsePartnerCommissionsReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { partnerOfficeId, settled, startDate, endDate, limit = 100 } = options;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id || !partnerOfficeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // We query invoices and filter by partner commissions client-side
    // since Firestore doesn't support querying array fields deeply
    const constraints: QueryConstraint[] = [];
    constraints.push(orderBy('issueDate', 'desc'));
    constraints.push(limitQuery(limit));

    // Subscribe to invoices
    const unsubscribe = subscribeToCollection<Invoice>(
      tenant.id,
      'invoices',
      constraints,
      (data) => {
        // Filter to invoices that have commissions for this partner
        const filtered = data.filter((invoice) =>
          invoice.commissionsByPartner?.some(
            (c) => c.partnerOfficeId === partnerOfficeId
          )
        );

        // Apply date filters
        let result = filtered;
        if (startDate) {
          result = result.filter((inv) => {
            const issueDate = inv.issueDate?.toDate?.() || new Date(inv.issueDate as unknown as string);
            return issueDate >= startDate;
          });
        }
        if (endDate) {
          result = result.filter((inv) => {
            const issueDate = inv.issueDate?.toDate?.() || new Date(inv.issueDate as unknown as string);
            return issueDate <= endDate;
          });
        }

        setInvoices(result);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, tenant?.id, partnerOfficeId, startDate, endDate, limit, refreshKey]);

  // Process invoices to extract commission items
  const { commissions, totalEarned, totalPending, totalSettled } = useMemo(() => {
    const items: CommissionItem[] = [];
    let earned = 0;
    let pending = 0;
    let settledTotal = 0;

    for (const invoice of invoices) {
      const partnerCommission = invoice.commissionsByPartner?.find(
        (c) => c.partnerOfficeId === partnerOfficeId
      );

      if (!partnerCommission) continue;

      // Find line items for this partner
      const partnerLineItems = invoice.lineItems?.filter(
        (li) => li.partnerOfficeId === partnerOfficeId
      ) || [];

      for (const lineItem of partnerLineItems) {
        const commissionAmount = lineItem.commissionAmount || 0;
        const isSettled = partnerCommission.status === 'settled';

        // Apply settled filter if specified
        if (settled !== undefined) {
          if (settled && !isSettled) continue;
          if (!settled && isSettled) continue;
        }

        items.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          serviceId: lineItem.serviceId,
          serviceName: lineItem.description,
          serviceAmount: lineItem.total,
          commissionPercentage: lineItem.commissionPercentage || 0,
          commissionAmount,
          invoiceDate: invoice.issueDate?.toDate?.() || new Date(),
          invoiceStatus: invoice.status,
          settled: isSettled,
          settlementId: partnerCommission.settlementId,
          bookingId: invoice.bookingId,
        });

        earned += commissionAmount;
        if (isSettled) {
          settledTotal += commissionAmount;
        } else {
          pending += commissionAmount;
        }
      }
    }

    // Sort by date descending
    items.sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());

    return {
      commissions: items,
      totalEarned: earned,
      totalPending: pending,
      totalSettled: settledTotal,
    };
  }, [invoices, partnerOfficeId, settled]);

  return {
    commissions,
    totalEarned,
    totalPending,
    totalSettled,
    loading,
    error,
    refresh,
  };
}
