'use server';

/**
 * Notification Server Actions
 *
 * Server actions for creating, reading, and managing notifications.
 */

import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import {
  Notification,
  NotificationCreateInput,
  NotificationPreferences,
  NotificationType,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/models/notification';
import { sendNotificationEmail } from '@/lib/email/send-email';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get authenticated user context from session
 */
async function getAuthContext(): Promise<{
  userId: string;
  tenantId: string;
  email: string;
  role: string;
} | null> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return null;
    }

    return {
      userId: user.uid,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Get user's notification preferences
 */
async function getUserNotificationPreferences(
  tenantId: string,
  userId: string
): Promise<NotificationPreferences> {
  const userDoc = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('users')
    .doc(userId)
    .get();

  if (!userDoc.exists) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const userData = userDoc.data();
  return userData?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Get user data for notifications
 */
async function getUserData(
  tenantId: string,
  userId: string
): Promise<{ email: string; displayName: string; language: 'ar' | 'en' } | null> {
  const userDoc = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('users')
    .doc(userId)
    .get();

  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data()!;
  return {
    email: data.email,
    displayName: data.displayName,
    language: data.language || 'ar',
  };
}

// ==========================================
// Notification Creation Actions
// ==========================================

/**
 * Create a new notification
 */
export async function createNotificationAction(
  input: NotificationCreateInput
): Promise<ActionResult<{ notificationId: string }>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId } = auth;
    const { userId, type, title, body, data, actionUrl, priority = 'normal', sendEmail = true } = input;

    // Create the notification document
    const notificationData = {
      userId,
      type,
      title,
      body,
      data: data || {},
      actionUrl: actionUrl || null,
      priority,
      read: false,
      readAt: null,
      emailSent: false,
      emailSentAt: null,
      createdAt: FieldValue.serverTimestamp(),
    };

    const notificationRef = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .add(notificationData);

    // Send email if requested and user has email notifications enabled
    if (sendEmail) {
      const userData = await getUserData(tenantId, userId);
      const preferences = await getUserNotificationPreferences(tenantId, userId);

      if (
        userData &&
        preferences.emailEnabled &&
        preferences.emailTypes[type as keyof typeof preferences.emailTypes]
      ) {
        try {
          await sendNotificationEmail(
            userData.email,
            userData.displayName,
            type,
            {
              recipientName: userData.displayName,
              actionUrl,
              ...data,
            },
            userData.language,
            tenantId
          );

          // Update notification to mark email as sent
          await notificationRef.update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Don't fail the action if email fails
        }
      }
    }

    return success({ notificationId: notificationRef.id });
  } catch (err) {
    console.error('Create notification error:', err);
    return error('Failed to create notification', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Create notification for a specific user (internal helper)
 * Used by other actions to create notifications
 */
export async function createNotification(
  tenantId: string,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  options?: {
    data?: Record<string, unknown>;
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    sendEmail?: boolean;
  }
): Promise<string | null> {
  try {
    const { data, actionUrl, priority = 'normal', sendEmail = true } = options || {};

    // Create the notification document
    const notificationData = {
      userId,
      type,
      title,
      body,
      data: data || {},
      actionUrl: actionUrl || null,
      priority,
      read: false,
      readAt: null,
      emailSent: false,
      emailSentAt: null,
      createdAt: FieldValue.serverTimestamp(),
    };

    const notificationRef = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .add(notificationData);

    // Send email if requested
    if (sendEmail) {
      const userData = await getUserData(tenantId, userId);
      const preferences = await getUserNotificationPreferences(tenantId, userId);

      if (
        userData &&
        preferences.emailEnabled &&
        preferences.emailTypes[type as keyof typeof preferences.emailTypes]
      ) {
        try {
          await sendNotificationEmail(
            userData.email,
            userData.displayName,
            type,
            {
              recipientName: userData.displayName,
              actionUrl,
              ...data,
            },
            userData.language,
            tenantId
          );

          await notificationRef.update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }
    }

    return notificationRef.id;
  } catch (err) {
    console.error('Create notification error:', err);
    return null;
  }
}

// ==========================================
// Notification Read/Update Actions
// ==========================================

/**
 * Mark a notification as read
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult<void>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    // Verify the notification belongs to the user
    const notificationRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .doc(notificationId);

    const notificationDoc = await notificationRef.get();
    if (!notificationDoc.exists) {
      return error('Notification not found', ErrorCodes.NOT_FOUND);
    }

    const notification = notificationDoc.data()!;
    if (notification.userId !== userId) {
      return error('Not authorized to access this notification', ErrorCodes.UNAUTHORIZED);
    }

    // Mark as read
    await notificationRef.update({
      read: true,
      readAt: FieldValue.serverTimestamp(),
    });

    return success(undefined);
  } catch (err) {
    console.error('Mark notification read error:', err);
    return error('Failed to mark notification as read', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    // Get all unread notifications for the user
    const notificationsSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    if (notificationsSnapshot.empty) {
      return success({ count: 0 });
    }

    // Batch update all notifications
    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();

    notificationsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
      });
    });

    await batch.commit();

    return success({ count: notificationsSnapshot.size });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    return error('Failed to mark notifications as read', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<ActionResult<void>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    // Verify the notification belongs to the user
    const notificationRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .doc(notificationId);

    const notificationDoc = await notificationRef.get();
    if (!notificationDoc.exists) {
      return error('Notification not found', ErrorCodes.NOT_FOUND);
    }

    const notification = notificationDoc.data()!;
    if (notification.userId !== userId) {
      return error('Not authorized to delete this notification', ErrorCodes.UNAUTHORIZED);
    }

    await notificationRef.delete();

    return success(undefined);
  } catch (err) {
    console.error('Delete notification error:', err);
    return error('Failed to delete notification', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Delete all read notifications (cleanup)
 */
export async function deleteReadNotificationsAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    // Get all read notifications for the user
    const notificationsSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', true)
      .get();

    if (notificationsSnapshot.empty) {
      return success({ count: 0 });
    }

    // Batch delete all notifications
    const batch = adminDb.batch();

    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return success({ count: notificationsSnapshot.size });
  } catch (err) {
    console.error('Delete read notifications error:', err);
    return error('Failed to delete notifications', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Notification Preferences Actions
// ==========================================

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferencesAction(): Promise<
  ActionResult<NotificationPreferences>
> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;
    const preferences = await getUserNotificationPreferences(tenantId, userId);

    return success(preferences);
  } catch (err) {
    console.error('Get notification preferences error:', err);
    return error('Failed to get notification preferences', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferencesAction(
  preferences: Partial<NotificationPreferences>
): Promise<ActionResult<NotificationPreferences>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    // Get current preferences
    const currentPreferences = await getUserNotificationPreferences(tenantId, userId);

    // Merge with new preferences
    const updatedPreferences: NotificationPreferences = {
      ...currentPreferences,
      ...preferences,
      emailTypes: {
        ...currentPreferences.emailTypes,
        ...(preferences.emailTypes || {}),
      },
    };

    // Update user document
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .update({
        notificationPreferences: updatedPreferences,
        updatedAt: FieldValue.serverTimestamp(),
      });

    return success(updatedPreferences);
  } catch (err) {
    console.error('Update notification preferences error:', err);
    return error('Failed to update notification preferences', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Query Actions
// ==========================================

/**
 * Get notifications for the current user
 */
export async function getNotificationsAction(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<ActionResult<Notification[]>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;
    const { limit: queryLimit = 50, unreadOnly = false } = options || {};

    let query = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(queryLimit);

    if (unreadOnly) {
      query = adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(queryLimit);
    }

    const snapshot = await query.get();

    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    return success(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    return error('Failed to get notifications', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCountAction(): Promise<ActionResult<number>> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return error('Not authenticated', ErrorCodes.UNAUTHENTICATED);
    }

    const { tenantId, userId } = auth;

    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    return success(snapshot.data().count);
  } catch (err) {
    console.error('Get unread count error:', err);
    return error('Failed to get unread count', ErrorCodes.INTERNAL_ERROR);
  }
}
