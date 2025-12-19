'use client';

/**
 * Partner Hooks
 *
 * React hooks for partner office data fetching and real-time subscriptions
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
import {
  type PartnerOffice,
  type PartnerOfficeStatus,
} from '@/types/models/partner-office';

export interface UsePartnersOptions {
  status?: PartnerOfficeStatus;
  search?: string;
  limit?: number;
  orderByField?: 'createdAt' | 'name' | 'code';
  orderDirection?: 'asc' | 'desc';
}

export interface UsePartnersReturn {
  partners: PartnerOffice[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to partners list
 */
export function usePartners(options: UsePartnersOptions = {}): UsePartnersReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [partners, setPartners] = useState<PartnerOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    status,
    search,
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

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy(orderByField, orderDirection));
    constraints.push(limitQuery(limit));

    // Subscribe to partners collection
    const unsubscribe = subscribeToCollection<PartnerOffice>(
      tenant.id,
      'partnerOffices',
      constraints,
      (data) => {
        // Client-side search filtering
        let filtered = data;
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = data.filter(
            (p) =>
              p.name.toLowerCase().includes(searchLower) ||
              p.code.toLowerCase().includes(searchLower) ||
              p.email.toLowerCase().includes(searchLower)
          );
        }
        setPartners(filtered);
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
  }, [user, tenant?.id, status, search, limit, orderByField, orderDirection, refreshKey]);

  return { partners, loading, error, refresh };
}

export interface UsePartnerReturn {
  partner: PartnerOffice | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to a single partner
 */
export function usePartner(partnerId: string | null): UsePartnerReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [partner, setPartner] = useState<PartnerOffice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id || !partnerId) {
      setLoading(false);
      setPartner(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to partner document
    const unsubscribe = subscribeToDocument<PartnerOffice>(
      tenant.id,
      'partnerOffices',
      partnerId,
      (data) => {
        setPartner(data);
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
  }, [user, tenant?.id, partnerId, refreshKey]);

  return { partner, loading, error, refresh };
}

export interface UsePartnerStatsReturn {
  totalPartners: number;
  activePartners: number;
  pendingPartners: number;
  totalPendingCommissions: number;
  loading: boolean;
}

/**
 * Hook to get partner statistics
 */
export function usePartnerStats(): UsePartnerStatsReturn {
  const { partners, loading } = usePartners({ limit: 1000 });

  const stats = partners.reduce(
    (acc, partner) => {
      acc.total++;
      if (partner.status === 'active') acc.active++;
      if (partner.status === 'pending') acc.pending++;
      acc.pendingCommissions += partner.pendingCommissions || 0;
      return acc;
    },
    { total: 0, active: 0, pending: 0, pendingCommissions: 0 }
  );

  return {
    totalPartners: stats.total,
    activePartners: stats.active,
    pendingPartners: stats.pending,
    totalPendingCommissions: stats.pendingCommissions,
    loading,
  };
}
