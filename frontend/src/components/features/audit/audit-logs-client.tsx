'use client';

/**
 * T289 [US12] Audit Logs Client Component
 *
 * Main client component for the audit logs page
 */

import { useState } from 'react';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { AuditLogFilters } from '@/types/models/audit-log';
import { AuditLogTable } from './audit-log-table';
import { AuditLogFiltersComponent } from './audit-log-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AuditLogsClient() {
  const t = useTranslations('audit');
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { logs, isLoading, error, hasMore, loadMore, refetch } = useAuditLogs(filters);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error') || 'Error'}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="me-2 h-4 w-4" />
            {t('retry') || 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AuditLogFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('logs') || 'Audit Logs'}</CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="me-2 h-4 w-4" />
            {t('refresh') || 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <AuditLogTable
            logs={logs}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>
    </div>
  );
}
