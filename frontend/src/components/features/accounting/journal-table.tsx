'use client';

/**
 * T066 [P] [US7] Create journal-table component
 * Displays journal entries in a table format with expandable line details
 */

import { JournalEntry, JournalEntryType } from '@/types/models/journal-entry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface JournalTableProps {
  entries: JournalEntry[];
  onViewDetail?: (entry: JournalEntry) => void;
  showExpandedLines?: boolean;
}

function formatCurrency(amount: number, locale: string = 'en'): string {
  // Always use 'en-US' locale for English numerals
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(date: any, locale: string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

function getEntryTypeColor(type: JournalEntryType): string {
  switch (type) {
    case 'invoice_created':
    case 'invoice_updated':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'invoice_cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'customer_payment':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'partner_payment':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'expense':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'adjustment':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function JournalTable({ entries, onViewDetail, showExpandedLines = false }: JournalTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (entryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedRows(newExpanded);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('accounting.noJournalEntries')}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-32">{t('accounting.entryNumber')}</TableHead>
            <TableHead className="w-32">{t('accounting.date')}</TableHead>
            <TableHead className="w-40">{t('accounting.type')}</TableHead>
            <TableHead>{t('accounting.description')}</TableHead>
            <TableHead className="text-right w-32">{t('accounting.debit')}</TableHead>
            <TableHead className="text-right w-32">{t('accounting.credit')}</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isExpanded = expandedRows.has(entry.id);

            return (
              <>
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(entry.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.entryNumber}
                    {entry.isReversal && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {t('accounting.reversal')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(entry.date, locale)}</TableCell>
                  <TableCell>
                    <Badge className={getEntryTypeColor(entry.type)}>
                      {t(`accounting.entryTypes.${entry.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(entry.totalDebit, locale)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(entry.totalCredit, locale)}
                  </TableCell>
                  <TableCell>
                    {onViewDetail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(entry)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/30 p-0">
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm mb-2">
                          {t('accounting.journalLines')}
                        </h4>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-background">
                                <TableHead className="w-24">{t('accounting.code')}</TableHead>
                                <TableHead>{t('accounting.accountName')}</TableHead>
                                <TableHead className="text-right w-32">{t('accounting.debit')}</TableHead>
                                <TableHead className="text-right w-32">{t('accounting.credit')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.lines.map((line, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono text-sm">
                                    {line.accountCode}
                                  </TableCell>
                                  <TableCell>{line.accountName}</TableCell>
                                  <TableCell className="text-right font-mono">
                                    {line.debit > 0 ? formatCurrency(line.debit, locale) : '—'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {line.credit > 0 ? formatCurrency(line.credit, locale) : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-muted/50">
                                <TableCell colSpan={2}>{t('accounting.total')}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(entry.totalDebit, locale)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(entry.totalCredit, locale)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
