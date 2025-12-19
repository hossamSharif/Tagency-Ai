/**
 * Audit Log Helper Functions
 *
 * Creates audit log entries for tracking changes to important entities
 */

import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { createDocument } from '@/lib/firebase/firestore';
import { UserRole } from '@/types/auth';

/**
 * Audit action types
 */
export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'view' | 'export';

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
 * Change record for tracking field changes
 */
export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
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
  timestamp: ReturnType<typeof serverTimestamp>;
}

/**
 * User context for audit logging
 */
export interface AuditUserContext {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  tenantId: string,
  userContext: AuditUserContext,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  options?: {
    changes?: AuditChange[];
    description?: string;
  }
): Promise<string> {
  const logEntry: AuditLogEntry = {
    userId: userContext.userId,
    userEmail: userContext.userEmail,
    userRole: userContext.userRole,
    action,
    entityType,
    entityId,
    changes: options?.changes,
    description: options?.description,
    ipAddress: userContext.ipAddress,
    userAgent: userContext.userAgent,
    timestamp: serverTimestamp(),
  };

  return createDocument(tenantId, 'auditLogs', logEntry);
}

/**
 * Generate changes array by comparing two objects
 */
export function generateChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: Partial<T>,
  fieldsToTrack?: (keyof T)[]
): AuditChange[] {
  const changes: AuditChange[] = [];
  const keysToCheck = fieldsToTrack || (Object.keys(newData) as (keyof T)[]);

  for (const key of keysToCheck) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if new value is undefined (not being changed)
    if (newValue === undefined) continue;

    // Skip if values are equal
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

    changes.push({
      field: String(key),
      oldValue,
      newValue,
    });
  }

  return changes;
}

/**
 * Log a create action
 */
export async function logCreate(
  tenantId: string,
  userContext: AuditUserContext,
  entityType: AuditEntityType,
  entityId: string,
  description?: string
): Promise<string> {
  return createAuditLog(tenantId, userContext, 'create', entityType, entityId, {
    description,
  });
}

/**
 * Log an update action with changes
 */
export async function logUpdate<T extends Record<string, unknown>>(
  tenantId: string,
  userContext: AuditUserContext,
  entityType: AuditEntityType,
  entityId: string,
  oldData: T,
  newData: Partial<T>,
  description?: string
): Promise<string> {
  const changes = generateChanges(oldData, newData);

  // Don't create log if no changes
  if (changes.length === 0) {
    return '';
  }

  return createAuditLog(tenantId, userContext, 'update', entityType, entityId, {
    changes,
    description,
  });
}

/**
 * Log a delete action
 */
export async function logDelete(
  tenantId: string,
  userContext: AuditUserContext,
  entityType: AuditEntityType,
  entityId: string,
  description?: string
): Promise<string> {
  return createAuditLog(tenantId, userContext, 'delete', entityType, entityId, {
    description,
  });
}

/**
 * Log a status change action
 */
export async function logStatusChange(
  tenantId: string,
  userContext: AuditUserContext,
  entityType: AuditEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  description?: string
): Promise<string> {
  return createAuditLog(tenantId, userContext, 'status_change', entityType, entityId, {
    changes: [{ field: 'status', oldValue: oldStatus, newValue: newStatus }],
    description: description || `Status changed from ${oldStatus} to ${newStatus}`,
  });
}

/**
 * Generate description for common actions
 */
export function generateDescription(
  action: AuditAction,
  entityType: AuditEntityType,
  entityName?: string
): string {
  const entityLabel = entityType.replace('_', ' ');

  switch (action) {
    case 'create':
      return `Created ${entityLabel}${entityName ? `: ${entityName}` : ''}`;
    case 'update':
      return `Updated ${entityLabel}${entityName ? `: ${entityName}` : ''}`;
    case 'delete':
      return `Deleted ${entityLabel}${entityName ? `: ${entityName}` : ''}`;
    case 'status_change':
      return `Changed status of ${entityLabel}${entityName ? `: ${entityName}` : ''}`;
    case 'view':
      return `Viewed ${entityLabel}${entityName ? `: ${entityName}` : ''}`;
    case 'export':
      return `Exported ${entityLabel} data`;
    default:
      return `Performed action on ${entityLabel}`;
  }
}

/**
 * Extract user context from request headers (for server actions)
 */
export function extractUserContext(
  headers: Headers,
  user: { uid: string; email?: string | null },
  role: UserRole
): AuditUserContext {
  return {
    userId: user.uid,
    userEmail: user.email || 'unknown',
    userRole: role,
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined,
  };
}
