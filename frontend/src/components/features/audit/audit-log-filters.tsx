'use client';

/**
 * T286 [US12] Audit Log Filters Component
 *
 * Filter controls for audit logs
 */

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AuditLogFilters,
  AuditAction,
  AuditEntityType,
  auditActionLabels,
  auditEntityLabels,
} from '@/types/models/audit-log';
import { cn } from '@/lib/utils';

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}

const actions: AuditAction[] = ['create', 'update', 'delete', 'status_change', 'view', 'export'];
const entityTypes: AuditEntityType[] = [
  'package',
  'service',
  'booking',
  'invoice',
  'payment',
  'customer',
  'user',
  'partner_office',
  'settlement',
];

export function AuditLogFiltersComponent({
  filters,
  onFiltersChange,
}: AuditLogFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('audit');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const updateFilter = (key: keyof AuditLogFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('filters') || 'Filters'}</span>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="me-2 h-4 w-4" />
            {t('clearFilters') || 'Clear'}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label>{t('entityType') || 'Entity Type'}</Label>
          <Select
            value={filters.entityType || ''}
            onValueChange={(value) => updateFilter('entityType', value as AuditEntityType)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allEntities') || 'All entities'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('allEntities') || 'All entities'}</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {auditEntityLabels[type]?.[locale === 'ar' ? 'ar' : 'en'] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label>{t('action') || 'Action'}</Label>
          <Select
            value={filters.action || ''}
            onValueChange={(value) => updateFilter('action', value as AuditAction)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allActions') || 'All actions'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('allActions') || 'All actions'}</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {auditActionLabels[action]?.[locale === 'ar' ? 'ar' : 'en'] || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>{t('startDate') || 'Start Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-start font-normal',
                  !filters.startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="me-2 h-4 w-4" />
                {filters.startDate
                  ? format(filters.startDate, 'PPP', { locale: dateLocale })
                  : t('selectDate') || 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => updateFilter('startDate', date)}
                initialFocus
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>{t('endDate') || 'End Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-start font-normal',
                  !filters.endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="me-2 h-4 w-4" />
                {filters.endDate
                  ? format(filters.endDate, 'PPP', { locale: dateLocale })
                  : t('selectDate') || 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => updateFilter('endDate', date)}
                initialFocus
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
