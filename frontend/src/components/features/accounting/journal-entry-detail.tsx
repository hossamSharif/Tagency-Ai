'use client';

/**
 * T068 [P] [US7] Create journal-entry-detail component
 * Detailed view of a single journal entry with all line items and metadata
 */

import { JournalEntry } from '@/types/models/journal-entry';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale, useTranslations } from 'next-intl';
import {
  FileText,
  Calendar,
  User,
  AlertCircle,
  ArrowRightLeft,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  onClose?: () => void;
}

function formatCurrency(amount: number, locale: string = 'en'): string {
  // Always use 'en-US' locale for English numerals
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: any, locale: string): string {
  if (!date) return '';
  const d =
    typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function getEntryTypeColor(type: string): string {
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

function getSourceLink(entry: JournalEntry): { href: string; label: string } | null {
  switch (entry.sourceType) {
    case 'invoice':
      return {
        href: `/invoices/${entry.sourceId}`,
        label: 'View Invoice',
      };
    case 'payment':
      return {
        href: `/payments/${entry.sourceId}`,
        label: 'View Payment',
      };
    case 'expense':
      return {
        href: `/accounting/expenses`,
        label: 'View Expense',
      };
    default:
      return null;
  }
}

export function JournalEntryDetail({ entry, onClose }: JournalEntryDetailProps) {
  const t = useTranslations();
  const locale = useLocale();

  const sourceLink = getSourceLink(entry);

  // Verify balancing
  const isBalanced = entry.totalDebit === entry.totalCredit;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{entry.entryNumber}</CardTitle>
                <Badge className={getEntryTypeColor(entry.type)}>
                  {t(`accounting.entryTypes.${entry.type}`)}
                </Badge>
                {entry.isReversal && (
                  <Badge variant="destructive">
                    {t('accounting.reversal')}
                  </Badge>
                )}
              </div>
              <CardDescription>{entry.description}</CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t('accounting.date')}</p>
                <p className="font-medium">{formatDate(entry.date, locale)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t('accounting.createdBy')}</p>
                <p className="font-medium">{entry.createdBy}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t('accounting.sourceType')}</p>
                <p className="font-medium">
                  {t(`accounting.sourceTypes.${entry.sourceType}`)}
                </p>
              </div>
            </div>

            {sourceLink && (
              <div className="flex items-center gap-3 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{t('accounting.sourceDocument')}</p>
                  <Link
                    href={sourceLink.href}
                    className="font-medium text-primary hover:underline"
                  >
                    {sourceLink.label}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Reversal Info */}
          {(entry.reversesEntryId || entry.reversedByEntryId) && (
            <>
              <Separator />
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  {entry.reversesEntryId && (
                    <p className="text-sm">
                      {t('accounting.reversesEntry')}: {entry.reversesEntryId}
                    </p>
                  )}
                  {entry.reversedByEntryId && (
                    <p className="text-sm">
                      {t('accounting.reversedByEntry')}: {entry.reversedByEntryId}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Journal Lines */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t('accounting.journalLines')}</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-24">{t('accounting.code')}</TableHead>
                    <TableHead>{t('accounting.accountName')}</TableHead>
                    <TableHead className="text-right w-36">
                      {t('accounting.debit')}
                    </TableHead>
                    <TableHead className="text-right w-36">
                      {t('accounting.credit')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {line.accountCode}
                      </TableCell>
                      <TableCell className="font-medium">{line.accountName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {line.debit > 0 ? formatCurrency(line.debit, locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.credit > 0 ? formatCurrency(line.credit, locale) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50 border-t-2">
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

            {/* Balance Check */}
            {!isBalanced && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {t('accounting.unbalancedEntry')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('accounting.debitCreditMismatch')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
