'use client';

/**
 * Notification Hooks
 *
 * React hooks for notification data fetching and real-time subscriptions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useTenant } from './use-tenant';
import {
  subscribeToCollection,
  query,
  where,
  orderBy,
  limit as limitQuery,
  type QueryConstraint,
  type Unsubscribe,
} from '@/lib/firebase/firestore';
import { type Notification } from '@/types/models/notification';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
  deleteReadNotificationsAction,
} from '@/app/actions/notifications';

export interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to notifications
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { limit = 50, unreadOnly = false, enabled = true } = options;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Calculate unread count from loaded notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user || !tenant?.id || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
    ];

    if (unreadOnly) {
      constraints.push(where('read', '==', false));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limitQuery(limit));

    // Subscribe to notifications
    const unsubscribe = subscribeToCollection<Notification>(
      tenant.id,
      'notifications',
      constraints,
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      (err) => {
        console.error('Notifications subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, tenant?.id, limit, unreadOnly, enabled, refreshKey]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await markNotificationReadAction(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const result = await deleteNotificationAction(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Clear all read notifications
  const clearReadNotifications = useCallback(async () => {
    try {
      const result = await deleteReadNotificationsAction();
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      }
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      throw err;
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refresh,
  };
}
