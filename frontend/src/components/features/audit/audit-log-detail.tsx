'use client';

/**
 * T287 [US12] Audit Log Detail Component
 *
 * Detailed view of a single audit log entry
 */

import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AuditLog,
  auditActionLabels,
  auditEntityLabels,
  auditActionColors,
} from '@/types/models/audit-log';
import { formatChange } from '@/lib/audit/create-log';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock, User, FileText, Globe, Monitor } from 'lucide-react';

interface AuditLogDetailProps {
  log: AuditLog;
}

export function AuditLogDetail({ log }: AuditLogDetailProps) {
  const locale = useLocale();
  const t = useTranslations('audit');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const actionLabel = auditActionLabels[log.action]?.[locale === 'ar' ? 'ar' : 'en'] || log.action;
  const entityLabel = auditEntityLabels[log.entityType]?.[locale === 'ar' ? 'ar' : 'en'] || log.entityType;
  const timestamp = log.timestamp?.toDate?.() || new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Badge
          variant="outline"
          className={cn('text-sm py-1 px-3', auditActionColors[log.action])}
        >
          {actionLabel}
        </Badge>
        <span className="text-muted-foreground">{entityLabel}</span>
      </div>

      {/* Description */}
      {log.description && (
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm">{log.description}</p>
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t('timestamp') || 'Timestamp'}
          </div>
          <p className="text-sm font-medium">
            {format(timestamp, 'PPpp', { locale: dateLocale })}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {t('user') || 'User'}
          </div>
          <p className="text-sm font-medium">{log.userEmail}</p>
          <p className="text-xs text-muted-foreground">{log.userRole}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            {t('entityId') || 'Entity ID'}
          </div>
          <p className="text-sm font-mono">{log.entityId}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            {t('logId') || 'Log ID'}
          </div>
          <p className="text-sm font-mono">{log.id}</p>
        </div>
      </div>

      {/* Request Metadata */}
      {(log.ipAddress || log.userAgent) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('requestInfo') || 'Request Information'}</h4>
            <div className="grid grid-cols-1 gap-3">
              {log.ipAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
              )}
              {log.userAgent && (
                <div className="flex items-start gap-2 text-sm">
                  <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Agent:</span>
                  <span className="font-mono text-xs break-all">{log.userAgent}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Changes */}
      {log.changes && log.changes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('changes') || 'Changes'} ({log.changes.length})
            </h4>
            <div className="space-y-2">
              {log.changes.map((change, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="text-sm font-medium capitalize">
                    {change.field.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-mono text-xs break-all">
                      {formatValue(change.oldValue)}
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 p-2 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-mono text-xs break-all">
                      {formatValue(change.newValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}
