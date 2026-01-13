'use client';

/**
 * T067 [P] [US7] Create journal-filters component
 * Filters for journal entries by date range, account, source type
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Search, X, Filter } from 'lucide-react';
import { Account } from '@/types/models/account';
import { JournalEntryType } from '@/types/models/journal-entry';

export interface JournalFilters {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  sourceType?: 'invoice' | 'payment' | 'expense';
  entryType?: JournalEntryType;
  searchQuery?: string;
}

interface JournalFiltersProps {
  filters: JournalFilters;
  accounts: Account[];
  onFiltersChange: (filters: JournalFilters) => void;
  onReset: () => void;
}

export function JournalFiltersComponent({
  filters,
  accounts,
  onFiltersChange,
  onReset,
}: JournalFiltersProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof JournalFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  const entryTypes: JournalEntryType[] = [
    'invoice_created',
    'invoice_updated',
    'invoice_cancelled',
    'customer_payment',
    'partner_payment',
    'expense',
    'adjustment',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('accounting.filters')}
            </CardTitle>
            <CardDescription>{t('accounting.filterJournalEntries')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-2" />
                {t('common.clearFilters')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('common.collapse') : t('common.expand')}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('accounting.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={
                  filters.startDate
                    ? filters.startDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  handleFilterChange(
                    'startDate',
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('accounting.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={
                  filters.endDate
                    ? filters.endDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  handleFilterChange(
                    'endDate',
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            {/* Account Filter */}
            <div className="space-y-2">
              <Label htmlFor="account">{t('accounting.account')}</Label>
              <Select
                value={filters.accountId || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('accountId', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder={t('accounting.allAccounts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('accounting.allAccounts')}
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="sourceType">{t('accounting.sourceType')}</Label>
              <Select
                value={filters.sourceType || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('sourceType', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger id="sourceType">
                  <SelectValue placeholder={t('accounting.allSources')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('accounting.allSources')}
                  </SelectItem>
                  <SelectItem value="invoice">
                    {t('accounting.sourceTypes.invoice')}
                  </SelectItem>
                  <SelectItem value="payment">
                    {t('accounting.sourceTypes.payment')}
                  </SelectItem>
                  <SelectItem value="expense">
                    {t('accounting.sourceTypes.expense')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entry Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="entryType">{t('accounting.entryType')}</Label>
              <Select
                value={filters.entryType || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('entryType', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger id="entryType">
                  <SelectValue placeholder={t('accounting.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('accounting.allTypes')}
                  </SelectItem>
                  {entryTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`accounting.entryTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Query */}
            <div className="space-y-2">
              <Label htmlFor="search">{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('accounting.searchJournalEntries')}
                  value={filters.searchQuery || ''}
                  onChange={(e) =>
                    handleFilterChange('searchQuery', e.target.value)
                  }
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
