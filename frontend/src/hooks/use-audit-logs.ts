'use client';

/**
 * T283 [US12] Audit Logs Hook
 *
 * Provides audit log data with filtering and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  QueryConstraint,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import {
  AuditLog,
  AuditLogFilters,
  AuditAction,
  AuditEntityType,
} from '@/types/models/audit-log';

interface UseAuditLogsResult {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

const PAGE_SIZE = 25;

export function useAuditLogs(filters?: AuditLogFilters): UseAuditLogsResult {
  const { tenant } = useTenant();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const buildQuery = useCallback(() => {
    if (!tenant?.id) return null;

    const constraints: QueryConstraint[] = [];

    // Add filter constraints
    if (filters?.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }

    if (filters?.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }

    if (filters?.action) {
      constraints.push(where('action', '==', filters.action));
    }

    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters?.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Always order by timestamp descending
    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(PAGE_SIZE));

    return query(
      collection(db, `tenants/${tenant.id}/auditLogs`),
      ...constraints
    );
  }, [tenant?.id, filters]);

  const fetchLogs = useCallback(() => {
    const q = buildQuery();
    if (!q) {
      setIsLoading(false);
      return () => {};
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: AuditLog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as AuditLog));

        setLogs(fetchedLogs);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching audit logs:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [buildQuery]);

  useEffect(() => {
    const unsubscribe = fetchLogs();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    if (!tenant?.id || !lastDoc || !hasMore || isLoading) return;

    setIsLoading(true);

    const constraints: QueryConstraint[] = [];

    if (filters?.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }

    if (filters?.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }

    if (filters?.action) {
      constraints.push(where('action', '==', filters.action));
    }

    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters?.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(startAfter(lastDoc));
    constraints.push(limit(PAGE_SIZE));

    const q = query(
      collection(db, `tenants/${tenant.id}/auditLogs`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newLogs: AuditLog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as AuditLog));

        setLogs((prev) => [...prev, ...newLogs]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setIsLoading(false);
        unsubscribe();
      },
      (err) => {
        console.error('Error loading more audit logs:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
  }, [tenant?.id, lastDoc, hasMore, isLoading, filters]);

  const refetch = useCallback(() => {
    setLogs([]);
    setLastDoc(null);
    setHasMore(true);
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
