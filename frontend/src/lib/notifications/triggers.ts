/**
 * Notification Triggers
 *
 * Helper functions for triggering notifications from various actions.
 * These functions call the notification server actions to create notifications.
 */

import { createNotification } from '@/app/actions/notifications';
import { NotificationType, NotificationPriority } from '@/types/models/notification';

/**
 * Trigger a payment received notification
 */
export async function triggerPaymentReceivedNotification(
  tenantId: string,
  userId: string,
  data: {
    paymentNumber: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    invoiceId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'payment_received',
    'تم استلام الدفعة',
    `تم استلام دفعة بقيمة ${data.amount} ${data.currency} للفاتورة ${data.invoiceNumber}`,
    {
      data: {
        paymentNumber: data.paymentNumber,
        amount: data.amount.toString(),
        currency: data.currency,
        invoiceNumber: data.invoiceNumber,
      },
      actionUrl: `/invoices/${data.invoiceId}`,
      priority: 'normal',
    }
  );
}

/**
 * Trigger a payment approved notification
 */
export async function triggerPaymentApprovedNotification(
  tenantId: string,
  userId: string,
  data: {
    paymentNumber: string;
    amount: number;
    currency: string;
    invoiceId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'payment_approved',
    'تم قبول الدفعة',
    `تم قبول دفعتك بقيمة ${data.amount} ${data.currency}`,
    {
      data: {
        paymentNumber: data.paymentNumber,
        amount: data.amount.toString(),
        currency: data.currency,
      },
      actionUrl: `/invoices/${data.invoiceId}`,
      priority: 'normal',
    }
  );
}

/**
 * Trigger a payment rejected notification
 */
export async function triggerPaymentRejectedNotification(
  tenantId: string,
  userId: string,
  data: {
    paymentNumber: string;
    amount: number;
    currency: string;
    rejectionReason: string;
    invoiceId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'payment_rejected',
    'تم رفض الدفعة',
    `تم رفض دفعتك: ${data.rejectionReason}`,
    {
      data: {
        paymentNumber: data.paymentNumber,
        amount: data.amount.toString(),
        currency: data.currency,
        rejectionReason: data.rejectionReason,
      },
      actionUrl: `/invoices/${data.invoiceId}`,
      priority: 'high',
    }
  );
}

/**
 * Trigger a booking confirmed notification
 */
export async function triggerBookingConfirmedNotification(
  tenantId: string,
  userId: string,
  data: {
    bookingNumber: string;
    packageName: string;
    packageNameAr?: string;
    totalAmount: number;
    currency: string;
    bookingId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'booking_confirmed',
    'تم تأكيد الحجز',
    `تم تأكيد حجزك للباقة "${data.packageNameAr || data.packageName}"`,
    {
      data: {
        bookingNumber: data.bookingNumber,
        packageName: data.packageName,
        packageNameAr: data.packageNameAr,
        totalAmount: data.totalAmount.toString(),
        currency: data.currency,
      },
      actionUrl: `/bookings/${data.bookingId}`,
      priority: 'normal',
    }
  );
}

/**
 * Trigger a booking cancelled notification
 */
export async function triggerBookingCancelledNotification(
  tenantId: string,
  userId: string,
  data: {
    bookingNumber: string;
    packageName: string;
    bookingId: string;
    reason?: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'booking_cancelled',
    'تم إلغاء الحجز',
    `تم إلغاء الحجز ${data.bookingNumber}${data.reason ? `: ${data.reason}` : ''}`,
    {
      data: {
        bookingNumber: data.bookingNumber,
        packageName: data.packageName,
        reason: data.reason,
      },
      actionUrl: `/bookings/${data.bookingId}`,
      priority: 'high',
    }
  );
}

/**
 * Trigger a document requested notification
 */
export async function triggerDocumentRequestedNotification(
  tenantId: string,
  userId: string,
  data: {
    documentType: string;
    bookingNumber: string;
    bookingId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'document_requested',
    'مطلوب رفع مستند',
    `يرجى رفع ${data.documentType} للحجز ${data.bookingNumber}`,
    {
      data: {
        documentType: data.documentType,
        bookingNumber: data.bookingNumber,
      },
      actionUrl: `/bookings/${data.bookingId}`,
      priority: 'high',
    }
  );
}

/**
 * Trigger a document verified notification
 */
export async function triggerDocumentVerifiedNotification(
  tenantId: string,
  userId: string,
  data: {
    documentType: string;
    bookingNumber: string;
    bookingId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'document_verified',
    'تم التحقق من المستند',
    `تم التحقق من ${data.documentType} للحجز ${data.bookingNumber}`,
    {
      data: {
        documentType: data.documentType,
        bookingNumber: data.bookingNumber,
      },
      actionUrl: `/bookings/${data.bookingId}`,
      priority: 'normal',
    }
  );
}

/**
 * Trigger a document rejected notification
 */
export async function triggerDocumentRejectedNotification(
  tenantId: string,
  userId: string,
  data: {
    documentType: string;
    bookingNumber: string;
    bookingId: string;
    rejectionReason: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'document_rejected',
    'تم رفض المستند',
    `تم رفض ${data.documentType}: ${data.rejectionReason}`,
    {
      data: {
        documentType: data.documentType,
        bookingNumber: data.bookingNumber,
        rejectionReason: data.rejectionReason,
      },
      actionUrl: `/bookings/${data.bookingId}`,
      priority: 'high',
    }
  );
}

/**
 * Trigger a commission settled notification
 */
export async function triggerCommissionSettledNotification(
  tenantId: string,
  userId: string,
  data: {
    settlementNumber: string;
    amount: number;
    currency: string;
    period: string;
    settlementId: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'commission_settled',
    'تمت تسوية العمولة',
    `تمت تسوية عمولتك بقيمة ${data.amount} ${data.currency} للفترة ${data.period}`,
    {
      data: {
        settlementNumber: data.settlementNumber,
        amount: data.amount.toString(),
        currency: data.currency,
        period: data.period,
      },
      actionUrl: `/partner-dashboard/settlements/${data.settlementId}`,
      priority: 'normal',
    }
  );
}

/**
 * Trigger a subscription expiring notification
 */
export async function triggerSubscriptionExpiringNotification(
  tenantId: string,
  userId: string,
  data: {
    daysRemaining: number;
    expiryDate: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'subscription_expiring',
    'الاشتراك قارب على الانتهاء',
    `سينتهي اشتراكك خلال ${data.daysRemaining} أيام في ${data.expiryDate}`,
    {
      data: {
        daysRemaining: data.daysRemaining.toString(),
        expiryDate: data.expiryDate,
      },
      actionUrl: '/settings/subscription',
      priority: 'high',
    }
  );
}

/**
 * Trigger a subscription expired notification
 */
export async function triggerSubscriptionExpiredNotification(
  tenantId: string,
  userId: string
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'subscription_expired',
    'انتهى الاشتراك',
    'انتهى اشتراكك. يرجى تجديد الاشتراك للاستمرار في استخدام المنصة.',
    {
      actionUrl: '/settings/subscription',
      priority: 'urgent',
    }
  );
}

/**
 * Trigger a trial ending notification
 */
export async function triggerTrialEndingNotification(
  tenantId: string,
  userId: string,
  data: {
    daysRemaining: number;
    expiryDate: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'trial_ending',
    'فترة التجربة قاربت على الانتهاء',
    `ستنتهي فترة التجربة المجانية خلال ${data.daysRemaining} أيام. قم بالترقية الآن للاستمرار.`,
    {
      data: {
        daysRemaining: data.daysRemaining.toString(),
        expiryDate: data.expiryDate,
      },
      actionUrl: '/settings/subscription',
      priority: 'high',
    }
  );
}

/**
 * Trigger a user invited notification
 */
export async function triggerUserInvitedNotification(
  tenantId: string,
  userId: string,
  data: {
    inviterName: string;
    role: string;
    officeName: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'user_invited',
    'تمت دعوتك للانضمام',
    `قام ${data.inviterName} بدعوتك للانضمام إلى ${data.officeName} بصفة ${data.role}`,
    {
      data: {
        inviterName: data.inviterName,
        role: data.role,
        officeName: data.officeName,
      },
      actionUrl: '/settings/team',
      priority: 'normal',
    }
  );
}

/**
 * Trigger a package updated notification (for customers who booked)
 */
export async function triggerPackageUpdatedNotification(
  tenantId: string,
  userId: string,
  data: {
    packageName: string;
    packageId: string;
    updateType: string;
  }
): Promise<void> {
  await createNotification(
    tenantId,
    userId,
    'package_updated',
    'تم تحديث الباقة',
    `تم تحديث الباقة "${data.packageName}": ${data.updateType}`,
    {
      data: {
        packageName: data.packageName,
        updateType: data.updateType,
      },
      actionUrl: `/packages/${data.packageId}`,
      priority: 'low',
    }
  );
}

/**
 * Send notification to all admins/owners of a tenant
 */
export async function notifyTenantAdmins(
  tenantId: string,
  type: NotificationType,
  title: string,
  body: string,
  options?: {
    data?: Record<string, unknown>;
    actionUrl?: string;
    priority?: NotificationPriority;
  }
): Promise<void> {
  // Import adminDb dynamically to avoid client-side import
  const { adminDb } = await import('@/lib/firebase/admin');

  // Get all admin users for the tenant
  const usersSnapshot = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('users')
    .where('role', 'in', ['owner', 'admin'])
    .where('status', '==', 'active')
    .get();

  // Send notification to each admin
  await Promise.all(
    usersSnapshot.docs.map((doc) =>
      createNotification(tenantId, doc.id, type, title, body, options)
    )
  );
}
