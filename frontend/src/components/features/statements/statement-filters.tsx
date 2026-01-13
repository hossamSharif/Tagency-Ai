'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  linkedEntityType?: 'customer' | 'partner';
  linkedEntityName?: string;
}

interface StatementFiltersProps {
  accounts: Account[];
  selectedAccountId?: string;
  startDate?: Date;
  endDate?: Date;
  onFilterChange: (filters: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
  isLoading?: boolean;
}

export function StatementFilters({
  accounts,
  selectedAccountId,
  startDate,
  endDate,
  onFilterChange,
  isLoading = false,
}: StatementFiltersProps) {
  const t = useTranslations();
  const [localAccountId, setLocalAccountId] = useState(selectedAccountId);
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate);

  const handleApplyFilters = () => {
    onFilterChange({
      accountId: localAccountId,
      startDate: localStartDate,
      endDate: localEndDate,
    });
  };

  const handleClearFilters = () => {
    setLocalAccountId(undefined);
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    onFilterChange({
      accountId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters = localAccountId || localStartDate || localEndDate;

  // Quick date range helpers
  const setThisMonth = () => {
    const now = new Date();
    setLocalStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setLocalEndDate(new Date());
  };

  const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    setLocalStartDate(lastMonth);
    setLocalEndDate(lastDayOfLastMonth);
  };

  const setThisYear = () => {
    const now = new Date();
    setLocalStartDate(new Date(now.getFullYear(), 0, 1));
    setLocalEndDate(new Date());
  };

  // Group accounts by type
  const customerAccounts = accounts.filter(
    (acc) => acc.linkedEntityType === 'customer'
  );
  const partnerAccounts = accounts.filter(
    (acc) => acc.linkedEntityType === 'partner'
  );
  const otherAccounts = accounts.filter(
    (acc) => !acc.linkedEntityType
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">{t('statements.selectAccount')}</Label>
            <Select
              value={localAccountId}
              onValueChange={setLocalAccountId}
              disabled={isLoading}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder={t('statements.selectAccountPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {customerAccounts.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {t('statements.customerAccounts')}
                    </div>
                    {customerAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.linkedEntityName || account.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {partnerAccounts.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {t('statements.partnerAccounts')}
                    </div>
                    {partnerAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.linkedEntityName || account.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {otherAccounts.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {t('statements.otherAccounts')}
                    </div>
                    {otherAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('statements.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !localStartDate && 'text-muted-foreground'
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localStartDate ? (
                      format(localStartDate, 'PPP')
                    ) : (
                      <span>{t('statements.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localStartDate}
                    onSelect={setLocalStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('statements.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !localEndDate && 'text-muted-foreground'
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localEndDate ? (
                      format(localEndDate, 'PPP')
                    ) : (
                      <span>{t('statements.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localEndDate}
                    onSelect={setLocalEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setThisMonth}
              disabled={isLoading}
            >
              {t('statements.thisMonth')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setLastMonth}
              disabled={isLoading}
            >
              {t('statements.lastMonth')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setThisYear}
              disabled={isLoading}
            >
              {t('statements.thisYear')}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              disabled={!localAccountId || isLoading}
              className="flex-1"
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('statements.generateStatement')}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
