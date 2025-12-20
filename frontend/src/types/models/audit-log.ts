/**
 * T276 [US12] AuditLog Type Definition
 *
 * Tracks all significant changes for compliance and troubleshooting
 */

import { Timestamp } from 'firebase/firestore';
import { UserRole } from '../auth';

/**
 * Audit action types
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'view'
  | 'export';

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | 'package'
  | 'service'
  | 'booking'
  | 'invoice'
  | 'payment'
  | 'customer'
  | 'user'
  | 'partner_office'
  | 'settlement'
  | 'tenant'
  | 'subscription';

/**
 * Individual field change record
 */
export interface AuditChange {
  /** Field name that was changed */
  field: string;
  /** Value before the change */
  oldValue: unknown;
  /** Value after the change */
  newValue: unknown;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  /** Firestore document ID */
  id: string;

  /** User who performed the action */
  userId: string;
  userEmail: string;
  userRole: UserRole;

  /** Action performed */
  action: AuditAction;

  /** Entity affected */
  entityType: AuditEntityType;
  entityId: string;

  /** Changes made (for update actions) */
  changes?: AuditChange[];

  /** Human-readable description */
  description?: string;

  /** Request metadata */
  ipAddress?: string;
  userAgent?: string;

  /** Timestamp */
  timestamp: Timestamp;
}

/**
 * Audit log filter options
 */
export interface AuditLogFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Entity history entry (for timeline view)
 */
export interface EntityHistoryEntry {
  id: string;
  action: AuditAction;
  userEmail: string;
  description?: string;
  changes?: AuditChange[];
  timestamp: Date;
}

/**
 * Audit log display helpers
 */
export const auditActionLabels: Record<AuditAction, { en: string; ar: string }> = {
  create: { en: 'Created', ar: 'إنشاء' },
  update: { en: 'Updated', ar: 'تحديث' },
  delete: { en: 'Deleted', ar: 'حذف' },
  status_change: { en: 'Status Changed', ar: 'تغيير الحالة' },
  view: { en: 'Viewed', ar: 'عرض' },
  export: { en: 'Exported', ar: 'تصدير' },
};

export const auditEntityLabels: Record<AuditEntityType, { en: string; ar: string }> = {
  package: { en: 'Package', ar: 'باقة' },
  service: { en: 'Service', ar: 'خدمة' },
  booking: { en: 'Booking', ar: 'حجز' },
  invoice: { en: 'Invoice', ar: 'فاتورة' },
  payment: { en: 'Payment', ar: 'دفعة' },
  customer: { en: 'Customer', ar: 'عميل' },
  user: { en: 'User', ar: 'مستخدم' },
  partner_office: { en: 'Partner Office', ar: 'مكتب شريك' },
  settlement: { en: 'Settlement', ar: 'تسوية' },
  tenant: { en: 'Workspace', ar: 'مساحة العمل' },
  subscription: { en: 'Subscription', ar: 'اشتراك' },
};

/**
 * Action icon colors
 */
export const auditActionColors: Record<AuditAction, string> = {
  create: 'text-green-500',
  update: 'text-blue-500',
  delete: 'text-red-500',
  status_change: 'text-yellow-500',
  view: 'text-gray-500',
  export: 'text-purple-500',
};
