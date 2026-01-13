'use client';

/**
 * Expense List Component
 * T073 [P] [US8] Create expense-list component
 * Displays a filterable list of expenses
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenant } from '@/hooks/use-tenant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCard } from './expense-card';
import type { Expense, ExpenseCategory } from '@/types/models/expense';
import type { Account } from '@/types/models/account';

interface ExpenseListProps {
  expenses: Expense[];
  accounts?: Account[];
  locale?: 'ar' | 'en';
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
  onCreate?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'utilities',
  'supplies',
  'travel',
  'marketing',
  'salary',
  'other',
];

export function ExpenseList({
  expenses,
  accounts = [],
  locale = 'ar',
  onEdit,
  onDelete,
  onView,
  onCreate,
  onExport,
  isLoading = false,
}: ExpenseListProps) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const { tenant } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = expense.description.toLowerCase().includes(query);
      const matchesNumber = expense.expenseNumber.toLowerCase().includes(query);
      const matchesVendor = expense.vendorName?.toLowerCase().includes(query);
      if (!matchesDescription && !matchesNumber && !matchesVendor) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false;
    }

    // Account filter
    if (accountFilter !== 'all' && expense.accountId !== accountFilter) {
      return false;
    }

    // Date range filter
    if (dateFromFilter) {
      const expenseDate = expense.expenseDate instanceof Date
        ? expense.expenseDate
        : new Date(expense.expenseDate);
      const fromDate = new Date(dateFromFilter);
      if (expenseDate < fromDate) {
        return false;
      }
    }

    if (dateToFilter) {
      const expenseDate = expense.expenseDate instanceof Date
        ? expense.expenseDate
        : new Date(expense.expenseDate);
      const toDate = new Date(dateToFilter);
      if (expenseDate > toDate) {
        return false;
      }
    }

    return true;
  });

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCount = filteredExpenses.length;

  // Get unique currency (assuming single currency per workspace)
  const currency = expenses.length > 0 ? expenses[0].currency : tenant?.currency || 'USD';

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    dateFromFilter ||
    dateToFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('expenses')}</h2>
          <p className="text-muted-foreground">
            {totalCount} {t('expensesFound')} - {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport} disabled={isLoading || expenses.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {tCommon('export')}
            </Button>
          )}
          {onCreate && (
            <Button onClick={onCreate} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              {t('recordExpense')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('filters')}</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {tCommon('clearAll')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('category')}</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('all')}</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('paymentAccount')}</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('all')}</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dateFrom')}</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dateTo')}</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {hasActiveFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t('summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalExpenses')}</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? t('noExpensesFound') : t('noExpenses')}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {tCommon('clearFilters')}
              </Button>
            )}
            {!hasActiveFilters && onCreate && (
              <Button onClick={onCreate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('recordFirstExpense')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              locale={locale}
              onEdit={onEdit ? () => onEdit(expense) : undefined}
              onDelete={onDelete ? () => onDelete(expense) : undefined}
              onClick={onView ? () => onView(expense) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
