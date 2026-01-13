/**
 * Audit Log Helper Functions
 *
 * Creates audit log entries for tracking changes to important entities
 */

import { Timestamp } from 'firebase/firestore';
import { createAdminDocument } from '@/lib/firebase/firestore-admin';
import { UserRole } from '@/types/auth';
import { FieldValue } from 'firebase-admin/firestore';

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
  timestamp: ReturnType<typeof FieldValue.serverTimestamp>;
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

/**
 * Simplified audit log input for server actions
 */
export interface SimpleAuditLogInput {
  tenantId: string;
  userId: string;
  action: AuditAction | 'duplicate';
  resource: AuditEntityType;
  resourceId: string;
  description?: string;
  details?: Record<string, unknown>;
  changes?: AuditChange[];
}

/**
 * Create an audit log entry (simplified version for server actions)
 * This is an overload that works with server actions where full user context isn't needed
 */
export async function createAuditLog(input: SimpleAuditLogInput): Promise<string>;
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
): Promise<string>;
export async function createAuditLog(
  inputOrTenantId: SimpleAuditLogInput | string,
  userContext?: AuditUserContext,
  action?: AuditAction,
  entityType?: AuditEntityType,
  entityId?: string,
  options?: {
    changes?: AuditChange[];
    description?: string;
  }
): Promise<string> {
  // Handle simplified input
  if (typeof inputOrTenantId === 'object') {
    const input = inputOrTenantId;
    const logEntry: Record<string, unknown> = {
      userId: input.userId,
      userEmail: 'system',
      userRole: 'admin' as UserRole,
      action: input.action === 'duplicate' ? 'create' as AuditAction : input.action as AuditAction,
      entityType: input.resource,
      entityId: input.resourceId,
      timestamp: FieldValue.serverTimestamp(),
    };
    // Only add optional fields if they have values (Firebase doesn't allow undefined)
    if (input.changes !== undefined) {
      logEntry.changes = input.changes;
    }
    if (input.description) {
      logEntry.description = input.description;
    } else if (input.details) {
      logEntry.description = JSON.stringify(input.details);
    }
    return createAdminDocument(input.tenantId, 'auditLogs', logEntry);
  }

  // Handle full input - build object without undefined values
  const logEntry: Record<string, unknown> = {
    userId: userContext!.userId,
    userEmail: userContext!.userEmail,
    userRole: userContext!.userRole,
    action: action!,
    entityType: entityType!,
    entityId: entityId!,
    timestamp: FieldValue.serverTimestamp(),
  };
  // Only add optional fields if they have values (Firebase doesn't allow undefined)
  if (options?.changes !== undefined) {
    logEntry.changes = options.changes;
  }
  if (options?.description !== undefined) {
    logEntry.description = options.description;
  }
  if (userContext!.ipAddress !== undefined) {
    logEntry.ipAddress = userContext!.ipAddress;
  }
  if (userContext!.userAgent !== undefined) {
    logEntry.userAgent = userContext!.userAgent;
  }

  return createAdminDocument(inputOrTenantId, 'auditLogs', logEntry);
}

/**
 * T277 [US12] Enhanced audit logging with before/after tracking
 *
 * Create audit log with automatic change detection
 */
export async function createAuditLogWithChanges<T extends Record<string, unknown>>(
  tenantId: string,
  userId: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  options: {
    oldData?: T;
    newData?: Partial<T>;
    description?: string;
    fieldsToTrack?: (keyof T)[];
  }
): Promise<string> {
  let changes: AuditChange[] | undefined;

  if (options.oldData && options.newData) {
    changes = generateChanges(options.oldData, options.newData, options.fieldsToTrack);
    // Don't create log if no actual changes detected
    if (action === 'update' && changes.length === 0) {
      return '';
    }
  }

  return createAuditLog({
    tenantId,
    userId,
    action,
    resource: entityType,
    resourceId: entityId,
    description: options.description,
    changes,
  });
}

/**
 * Serialize a value for display in audit logs
 * Handles dates, complex objects, etc.
 */
export function serializeAuditValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Complex Object]';
    }
  }

  return String(value);
}

/**
 * Format a change for human-readable display
 */
export function formatChange(change: AuditChange): string {
  const oldVal = serializeAuditValue(change.oldValue);
  const newVal = serializeAuditValue(change.newValue);

  if (oldVal === 'null') {
    return `Set ${change.field} to "${newVal}"`;
  }

  if (newVal === 'null') {
    return `Cleared ${change.field} (was "${oldVal}")`;
  }

  return `Changed ${change.field} from "${oldVal}" to "${newVal}"`;
}

/**
 * Get a summary of changes for description
 */
export function summarizeChanges(changes: AuditChange[]): string {
  if (changes.length === 0) {
    return 'No changes';
  }

  if (changes.length === 1) {
    return formatChange(changes[0]);
  }

  const fields = changes.map(c => c.field);
  return `Updated ${fields.length} fields: ${fields.join(', ')}`;
}
