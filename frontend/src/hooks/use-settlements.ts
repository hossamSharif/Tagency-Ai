'use client';

/**
 * Settlement Hooks
 *
 * React hooks for commission settlement data fetching and real-time subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useTenant } from './use-tenant';
import {
  subscribeToCollection,
  subscribeToDocument,
  where,
  orderBy,
  limit as limitQuery,
  type QueryConstraint,
} from '@/lib/firebase/firestore';
import { type CommissionSettlement } from '@/types/models/partner-office';

export interface UseSettlementsOptions {
  partnerOfficeId?: string;
  status?: CommissionSettlement['status'];
  limit?: number;
  orderByField?: 'createdAt' | 'periodEnd' | 'amount';
  orderDirection?: 'asc' | 'desc';
}

export interface UseSettlementsReturn {
  settlements: (CommissionSettlement & { settlementNumber?: string })[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to settlements list
 */
export function useSettlements(options: UseSettlementsOptions = {}): UseSettlementsReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [settlements, setSettlements] = useState<(CommissionSettlement & { settlementNumber?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    partnerOfficeId,
    status,
    limit = 50,
    orderByField = 'createdAt',
    orderDirection = 'desc',
  } = options;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query constraints
    const constraints: QueryConstraint[] = [];

    if (partnerOfficeId) {
      constraints.push(where('partnerOfficeId', '==', partnerOfficeId));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy(orderByField, orderDirection));
    constraints.push(limitQuery(limit));

    // Subscribe to settlements collection
    const unsubscribe = subscribeToCollection<CommissionSettlement & { settlementNumber?: string }>(
      tenant.id,
      'settlements',
      constraints,
      (data) => {
        setSettlements(data);
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
  }, [user, tenant?.id, partnerOfficeId, status, limit, orderByField, orderDirection, refreshKey]);

  return { settlements, loading, error, refresh };
}

export interface UseSettlementReturn {
  settlement: (CommissionSettlement & { settlementNumber?: string }) | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to a single settlement
 */
export function useSettlement(settlementId: string | null): UseSettlementReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [settlement, setSettlement] = useState<(CommissionSettlement & { settlementNumber?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id || !settlementId) {
      setLoading(false);
      setSettlement(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to settlement document
    const unsubscribe = subscribeToDocument<CommissionSettlement & { settlementNumber?: string }>(
      tenant.id,
      'settlements',
      settlementId,
      (data) => {
        setSettlement(data);
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
  }, [user, tenant?.id, settlementId, refreshKey]);

  return { settlement, loading, error, refresh };
}

export interface UseSettlementStatsReturn {
  totalSettlements: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  disputedCount: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  loading: boolean;
}

/**
 * Hook to get settlement statistics
 */
export function useSettlementStats(partnerOfficeId?: string): UseSettlementStatsReturn {
  const { settlements, loading } = useSettlements({
    partnerOfficeId,
    limit: 1000,
  });

  const stats = settlements.reduce(
    (acc, settlement) => {
      acc.total++;
      if (settlement.status === 'pending') {
        acc.pending++;
        acc.pendingAmount += settlement.amount;
      }
      if (settlement.status === 'approved') {
        acc.approved++;
        acc.pendingAmount += settlement.amount;
      }
      if (settlement.status === 'paid') {
        acc.paid++;
        acc.paidAmount += settlement.amount;
      }
      if (settlement.status === 'disputed') {
        acc.disputed++;
        acc.pendingAmount += settlement.amount;
      }
      return acc;
    },
    { total: 0, pending: 0, approved: 0, paid: 0, disputed: 0, pendingAmount: 0, paidAmount: 0 }
  );

  return {
    totalSettlements: stats.total,
    pendingCount: stats.pending,
    approvedCount: stats.approved,
    paidCount: stats.paid,
    disputedCount: stats.disputed,
    totalPendingAmount: stats.pendingAmount,
    totalPaidAmount: stats.paidAmount,
    loading,
  };
}

/**
 * Hook for partner users to get their own settlements
 */
export function useMySettlements(): UseSettlementsReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [partnerOfficeId, setPartnerOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      return;
    }

    // Get user's partner office ID from their profile
    const fetchPartnerOfficeId = async () => {
      try {
        const { getDocument } = await import('@/lib/firebase/firestore');
        const userData = await getDocument(tenant.id, 'users', user.uid);
        if (userData?.partnerOfficeId) {
          setPartnerOfficeId(userData.partnerOfficeId);
        }
      } catch (err) {
        console.error('Failed to fetch partner office ID:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerOfficeId();
  }, [user, tenant?.id]);

  const settlementsResult = useSettlements({
    partnerOfficeId: partnerOfficeId || undefined,
    limit: 100,
  });

  // If still loading partner ID, show loading state
  if (loading || !partnerOfficeId) {
    return {
      settlements: [],
      loading: loading || settlementsResult.loading,
      error: settlementsResult.error,
      refresh: settlementsResult.refresh,
    };
  }

  return settlementsResult;
}
