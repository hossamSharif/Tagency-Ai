'use client';

/**
 * T285 [US12] Audit Log Table Component
 *
 * Displays audit logs in a table format with filtering
 */

import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AuditLog,
  AuditAction,
  AuditEntityType,
  auditActionLabels,
  auditEntityLabels,
  auditActionColors,
} from '@/types/models/audit-log';
import { Plus, Edit, Trash2, RefreshCw, Eye, Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditLogDetail } from './audit-log-detail';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  status_change: <RefreshCw className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
};

export function AuditLogTable({
  logs,
  isLoading,
  hasMore,
  onLoadMore,
}: AuditLogTableProps) {
  const locale = useLocale();
  const t = useTranslations('audit');
  const dateLocale = locale === 'ar' ? ar : enUS;

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('noLogs') || 'No audit logs found'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('action') || 'Action'}</TableHead>
            <TableHead>{t('entity') || 'Entity'}</TableHead>
            <TableHead>{t('user') || 'User'}</TableHead>
            <TableHead>{t('description') || 'Description'}</TableHead>
            <TableHead>{t('timestamp') || 'Time'}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const actionLabel = auditActionLabels[log.action]?.[locale === 'ar' ? 'ar' : 'en'] || log.action;
            const entityLabel = auditEntityLabels[log.entityType]?.[locale === 'ar' ? 'ar' : 'en'] || log.entityType;
            const timestamp = log.timestamp?.toDate?.() || new Date();

            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div className={cn('p-2 rounded', auditActionColors[log.action])}>
                    {actionIcons[log.action]}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{actionLabel}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{entityLabel}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {log.entityId.substring(0, 8)}...
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{log.userEmail}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm max-w-xs truncate">
                    {log.description || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {format(timestamp, 'MMM d, yyyy', { locale: dateLocale })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(timestamp, { addSuffix: true, locale: dateLocale })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {t('logDetails') || 'Audit Log Details'}
                        </DialogTitle>
                      </DialogHeader>
                      <AuditLogDetail log={log} />
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="me-2 h-4 w-4 animate-spin" />
                {t('loading') || 'Loading...'}
              </>
            ) : (
              <>
                <ChevronDown className="me-2 h-4 w-4" />
                {t('loadMore') || 'Load More'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
