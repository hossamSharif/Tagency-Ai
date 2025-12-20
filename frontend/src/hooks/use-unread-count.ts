'use client';

/**
 * Unread Notification Count Hook
 *
 * Lightweight hook specifically for tracking unread notification count
 * Used in the header notification bell component
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { useTenant } from './use-tenant';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface UseUnreadCountReturn {
  count: number;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to unread notification count only
 * More efficient than loading all notifications for just the count
 */
export function useUnreadCount(): UseUnreadCountReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      setCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    // Query for unread notifications for the current user
    const notificationsRef = collection(db, 'tenants', tenant.id, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    // Subscribe to snapshot changes
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error('Unread count subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, tenant?.id]);

  return {
    count,
    loading,
    error,
  };
}

/**
 * Hook to get unread count with polling instead of real-time subscription
 * Useful if real-time updates cause too much overhead
 */
export function useUnreadCountPolling(intervalMs = 30000): UseUnreadCountReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const { getUnreadCountAction } = await import('@/app/actions/notifications');
        const result = await getUnreadCountAction();
        if (result.success) {
          setCount(result.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching unread count:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchCount();

    // Set up polling
    intervalRef.current = setInterval(fetchCount, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, tenant?.id, intervalMs]);

  return {
    count,
    loading,
    error,
  };
}
