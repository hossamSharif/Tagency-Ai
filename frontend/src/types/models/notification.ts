import { Timestamp } from 'firebase/firestore';

/**
 * Notification types for different events in the system
 */
export type NotificationType =
  | 'payment_received'
  | 'payment_approved'
  | 'payment_rejected'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'document_requested'
  | 'document_verified'
  | 'document_rejected'
  | 'package_updated'
  | 'commission_settled'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'trial_ending'
  | 'user_invited'
  | 'general';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification entity - in-app notifications for users
 * Collection: `tenants/{tenantId}/notifications/{notificationId}`
 */
export interface Notification {
  /** Notification ID */
  id: string;
  /** Recipient user ID */
  userId: string;

  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification body/message */
  body: string;
  /** Additional data for context */
  data?: Record<string, unknown>;

  /** URL to navigate to when clicked */
  actionUrl?: string;
  /** Priority level */
  priority: NotificationPriority;

  /** Whether the notification has been read */
  read: boolean;
  /** When the notification was read */
  readAt?: Timestamp;

  /** Whether email was sent for this notification */
  emailSent: boolean;
  /** When email was sent */
  emailSentAt?: Timestamp;

  /** When created */
  createdAt: Timestamp;
}

/**
 * Notification creation input
 */
export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  priority?: NotificationPriority;
  sendEmail?: boolean;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** Enable/disable all email notifications */
  emailEnabled: boolean;

  /** Per-type email preferences */
  emailTypes: {
    payment_received: boolean;
    payment_approved: boolean;
    payment_rejected: boolean;
    booking_confirmed: boolean;
    booking_cancelled: boolean;
    document_requested: boolean;
    document_verified: boolean;
    document_rejected: boolean;
    package_updated: boolean;
    commission_settled: boolean;
    subscription_expiring: boolean;
    subscription_expired: boolean;
    trial_ending: boolean;
    user_invited: boolean;
    general: boolean;
  };

  /** Enable/disable in-app notifications */
  inAppEnabled: boolean;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  emailTypes: {
    payment_received: true,
    payment_approved: true,
    payment_rejected: true,
    booking_confirmed: true,
    booking_cancelled: true,
    document_requested: true,
    document_verified: true,
    document_rejected: true,
    package_updated: false,
    commission_settled: true,
    subscription_expiring: true,
    subscription_expired: true,
    trial_ending: true,
    user_invited: true,
    general: true,
  },
  inAppEnabled: true,
};

/**
 * Notification type display info
 */
export const NOTIFICATION_TYPE_INFO: Record<
  NotificationType,
  { label: string; labelAr: string; icon: string; color: string }
> = {
  payment_received: {
    label: 'Payment Received',
    labelAr: 'تم استلام الدفعة',
    icon: 'DollarSign',
    color: 'green',
  },
  payment_approved: {
    label: 'Payment Approved',
    labelAr: 'تم قبول الدفعة',
    icon: 'CheckCircle',
    color: 'green',
  },
  payment_rejected: {
    label: 'Payment Rejected',
    labelAr: 'تم رفض الدفعة',
    icon: 'XCircle',
    color: 'red',
  },
  booking_confirmed: {
    label: 'Booking Confirmed',
    labelAr: 'تم تأكيد الحجز',
    icon: 'CalendarCheck',
    color: 'green',
  },
  booking_cancelled: {
    label: 'Booking Cancelled',
    labelAr: 'تم إلغاء الحجز',
    icon: 'CalendarX',
    color: 'red',
  },
  document_requested: {
    label: 'Document Requested',
    labelAr: 'طلب مستند',
    icon: 'FileQuestion',
    color: 'yellow',
  },
  document_verified: {
    label: 'Document Verified',
    labelAr: 'تم التحقق من المستند',
    icon: 'FileCheck',
    color: 'green',
  },
  document_rejected: {
    label: 'Document Rejected',
    labelAr: 'تم رفض المستند',
    icon: 'FileX',
    color: 'red',
  },
  package_updated: {
    label: 'Package Updated',
    labelAr: 'تم تحديث الباقة',
    icon: 'Package',
    color: 'blue',
  },
  commission_settled: {
    label: 'Commission Settled',
    labelAr: 'تمت تسوية العمولة',
    icon: 'Banknote',
    color: 'green',
  },
  subscription_expiring: {
    label: 'Subscription Expiring',
    labelAr: 'الاشتراك قارب على الانتهاء',
    icon: 'Clock',
    color: 'yellow',
  },
  subscription_expired: {
    label: 'Subscription Expired',
    labelAr: 'انتهى الاشتراك',
    icon: 'AlertTriangle',
    color: 'red',
  },
  trial_ending: {
    label: 'Trial Ending',
    labelAr: 'فترة التجربة قاربت على الانتهاء',
    icon: 'Clock',
    color: 'yellow',
  },
  user_invited: {
    label: 'User Invited',
    labelAr: 'تمت دعوة مستخدم',
    icon: 'UserPlus',
    color: 'blue',
  },
  general: {
    label: 'Notification',
    labelAr: 'إشعار',
    icon: 'Bell',
    color: 'gray',
  },
};

/**
 * Notification priority display info
 */
export const NOTIFICATION_PRIORITY_INFO: Record<
  NotificationPriority,
  { label: string; labelAr: string; color: string }
> = {
  low: { label: 'Low', labelAr: 'منخفضة', color: 'gray' },
  normal: { label: 'Normal', labelAr: 'عادية', color: 'blue' },
  high: { label: 'High', labelAr: 'عالية', color: 'yellow' },
  urgent: { label: 'Urgent', labelAr: 'عاجلة', color: 'red' },
};

/**
 * Check if a notification type is important (should always show)
 */
export function isImportantNotification(type: NotificationType): boolean {
  const importantTypes: NotificationType[] = [
    'payment_rejected',
    'booking_cancelled',
    'document_rejected',
    'subscription_expiring',
    'subscription_expired',
    'trial_ending',
  ];
  return importantTypes.includes(type);
}

/**
 * Get notification action text based on type
 */
export function getNotificationActionText(
  type: NotificationType,
  locale: 'ar' | 'en' = 'ar'
): string {
  const actions: Record<NotificationType, { ar: string; en: string }> = {
    payment_received: { ar: 'عرض الدفعة', en: 'View Payment' },
    payment_approved: { ar: 'عرض الدفعة', en: 'View Payment' },
    payment_rejected: { ar: 'عرض التفاصيل', en: 'View Details' },
    booking_confirmed: { ar: 'عرض الحجز', en: 'View Booking' },
    booking_cancelled: { ar: 'عرض الحجز', en: 'View Booking' },
    document_requested: { ar: 'رفع المستند', en: 'Upload Document' },
    document_verified: { ar: 'عرض المستند', en: 'View Document' },
    document_rejected: { ar: 'إعادة الرفع', en: 'Re-upload' },
    package_updated: { ar: 'عرض الباقة', en: 'View Package' },
    commission_settled: { ar: 'عرض التسوية', en: 'View Settlement' },
    subscription_expiring: { ar: 'تجديد الاشتراك', en: 'Renew Subscription' },
    subscription_expired: { ar: 'تجديد الاشتراك', en: 'Renew Subscription' },
    trial_ending: { ar: 'الترقية الآن', en: 'Upgrade Now' },
    user_invited: { ar: 'عرض الفريق', en: 'View Team' },
    general: { ar: 'عرض', en: 'View' },
  };
  return actions[type][locale];
}
