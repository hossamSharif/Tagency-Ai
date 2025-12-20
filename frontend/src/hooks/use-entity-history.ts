'use client';

/**
 * T284 [US12] Entity History Hook
 *
 * Provides audit history for a specific entity
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import {
  AuditLog,
  AuditEntityType,
  EntityHistoryEntry,
} from '@/types/models/audit-log';

interface UseEntityHistoryResult {
  history: EntityHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const HISTORY_LIMIT = 50;

export function useEntityHistory(
  entityType: AuditEntityType,
  entityId: string
): UseEntityHistoryResult {
  const { tenant } = useTenant();
  const [history, setHistory] = useState<EntityHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(() => {
    if (!tenant?.id || !entityId) {
      setIsLoading(false);
      return () => {};
    }

    setIsLoading(true);
    setError(null);

    const q = query(
      collection(db, `tenants/${tenant.id}/auditLogs`),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(HISTORY_LIMIT)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: EntityHistoryEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data() as AuditLog;
          return {
            id: doc.id,
            action: data.action,
            userEmail: data.userEmail,
            description: data.description,
            changes: data.changes,
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        });

        setHistory(entries);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching entity history:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [tenant?.id, entityType, entityId]);

  useEffect(() => {
    const unsubscribe = fetchHistory();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchHistory]);

  const refetch = useCallback(() => {
    setHistory([]);
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch,
  };
}
