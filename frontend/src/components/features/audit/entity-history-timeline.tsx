'use client';

/**
 * T288 [US12] Entity History Timeline Component
 *
 * Displays audit history for a specific entity as a timeline
 */

import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  EntityHistoryEntry,
  AuditAction,
  auditActionLabels,
  auditActionColors,
} from '@/types/models/audit-log';
import { cn } from '@/lib/utils';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

interface EntityHistoryTimelineProps {
  history: EntityHistoryEntry[];
  isLoading?: boolean;
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  update: <Edit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  status_change: <RefreshCw className="h-3 w-3" />,
  view: <Eye className="h-3 w-3" />,
  export: <Download className="h-3 w-3" />,
};

const actionBgColors: Record<AuditAction, string> = {
  create: 'bg-green-100 dark:bg-green-900',
  update: 'bg-blue-100 dark:bg-blue-900',
  delete: 'bg-red-100 dark:bg-red-900',
  status_change: 'bg-yellow-100 dark:bg-yellow-900',
  view: 'bg-gray-100 dark:bg-gray-900',
  export: 'bg-purple-100 dark:bg-purple-900',
};

export function EntityHistoryTimeline({
  history,
  isLoading,
}: EntityHistoryTimelineProps) {
  const locale = useLocale();
  const t = useTranslations('audit');
  const dateLocale = locale === 'ar' ? ar : enUS;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noHistory') || 'No history available'}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />

      {/* Timeline entries */}
      <div className="space-y-4">
        {history.map((entry, index) => {
          const actionLabel = auditActionLabels[entry.action]?.[locale === 'ar' ? 'ar' : 'en'] || entry.action;
          const hasChanges = entry.changes && entry.changes.length > 0;

          return (
            <div key={entry.id} className="relative flex gap-4 ps-0">
              {/* Timeline dot */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                  actionBgColors[entry.action],
                  auditActionColors[entry.action]
                )}
              >
                {actionIcons[entry.action]}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {actionLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {entry.userEmail}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>

                {entry.description && (
                  <p className="mt-1 text-sm">{entry.description}</p>
                )}

                {hasChanges && (
                  <Collapsible className="mt-2">
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
                      {t('viewChanges') || 'View changes'} ({entry.changes!.length})
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {entry.changes!.map((change, changeIndex) => (
                        <div
                          key={changeIndex}
                          className="rounded border p-2 text-xs"
                        >
                          <div className="font-medium capitalize mb-1">
                            {change.field.replace(/_/g, ' ')}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {formatValue(change.oldValue)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-green-600 dark:text-green-400">
                              {formatValue(change.newValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    } catch {
      return '[Object]';
    }
  }

  const str = String(value);
  return str.length > 50 ? str.substring(0, 50) + '...' : str;
}
