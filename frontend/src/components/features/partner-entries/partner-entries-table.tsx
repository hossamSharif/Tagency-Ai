'use client';

/**
 * Partner Entries Table Component
 *
 * Displays recent entries for a selected partner with cancel functionality
 */

import { useTranslations } from 'next-intl';
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
import { cn } from '@/lib/utils';
import { ArrowUpCircle, ArrowDownCircle, FileText, X, RotateCcw } from 'lucide-react';
import type { PartnerEntry } from '@/app/actions/partner-entries';

interface PartnerEntriesTableProps {
  entries: PartnerEntry[];
  isLoading?: boolean;
  locale: string;
  currency?: string;
  onCancelEntry?: (entry: PartnerEntry) => void;
}

export function PartnerEntriesTable({
  entries,
  isLoading,
  locale,
  currency = 'SAR',
  onCancelEntry,
}: PartnerEntriesTableProps) {
  const t = useTranslations('partnerEntries');
  const isArabic = locale === 'ar';

  // Format currency
  const formatCurrency = (amount: number, showSign = false) => {
    const formatted = new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    if (showSign) {
      const sign = amount >= 0 ? '+' : '-';
      return `${sign}${currency} ${formatted}`;
    }
    return `${currency} ${formatted}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isArabic ? 'ar-SA' : 'en-SA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{isArabic ? 'لا توجد عمليات سابقة' : 'No entries found'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
            <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
            <TableHead>{isArabic ? 'المرجع' : 'Reference'}</TableHead>
            <TableHead className="text-end">{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
            <TableHead className="text-end">{isArabic ? 'الرصيد' : 'Balance'}</TableHead>
            {onCancelEntry && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isCredit = entry.type === 'credit';
            // For display, credit means we added to partner (positive from their perspective)
            // Debit means we deducted (negative from their perspective)
            const amountDisplay = isCredit ? entry.amount : -entry.amount;
            const isReversed = entry.isReversed;
            const isReversal = entry.isReversal;
            const canCancel = !isReversed && !isReversal && onCancelEntry;

            return (
              <TableRow
                key={entry.id}
                className={cn(isReversed && 'opacity-60')}
              >
                <TableCell className={cn('font-medium', isReversed && 'line-through')}>
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'gap-1',
                        isReversed && 'opacity-70',
                        isReversal
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : isCredit
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      )}
                    >
                      {isReversal ? (
                        <RotateCcw className="h-3 w-3" />
                      ) : isCredit ? (
                        <ArrowUpCircle className="h-3 w-3" />
                      ) : (
                        <ArrowDownCircle className="h-3 w-3" />
                      )}
                      {isReversal
                        ? (isArabic ? 'عكس' : 'Reversal')
                        : isCredit
                          ? (isArabic ? 'دائن' : 'Credit')
                          : (isArabic ? 'مدين' : 'Debit')}
                    </Badge>
                    {isReversed && (
                      <Badge variant="destructive" className="text-xs">
                        {t('reversed')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className={cn('text-muted-foreground', isReversed && 'line-through')}>
                  {entry.reference || entry.entryNumber}
                </TableCell>
                <TableCell className={cn(
                  'text-end font-medium',
                  isReversed && 'line-through',
                  isReversal
                    ? 'text-purple-600 dark:text-purple-400'
                    : isCredit
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                )}>
                  {formatCurrency(amountDisplay, true)}
                </TableCell>
                <TableCell className="text-end font-medium">
                  {entry.runningBalance !== undefined && (
                    <span className={cn(
                      entry.runningBalance < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    )}>
                      {formatCurrency(Math.abs(entry.runningBalance))}
                    </span>
                  )}
                </TableCell>
                {onCancelEntry && (
                  <TableCell>
                    {canCancel ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onCancelEntry(entry)}
                        title={t('cancelEntry')}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t('cancelEntry')}</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled
                        title={isReversed
                          ? t('alreadyReversed')
                          : (isArabic ? 'لا يمكن إلغاء قيد العكس' : 'Cannot cancel reversal entries')}
                      >
                        <X className="h-4 w-4 opacity-30" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default PartnerEntriesTable;
