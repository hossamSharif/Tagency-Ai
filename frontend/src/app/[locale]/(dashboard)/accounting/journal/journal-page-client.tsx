'use client';

/**
 * T070 [US7] Create journal entries page - Client Component
 * Interactive journal entries list with filters and detail modal
 */

import { useState, useMemo } from 'react';
import { JournalEntry, JournalEntryType } from '@/types/models/journal-entry';
import { Account } from '@/types/models/account';
import { JournalTable } from '@/components/features/accounting/journal-table';
import {
  JournalFiltersComponent,
  type JournalFilters,
} from '@/components/features/accounting/journal-filters';
import { JournalEntryDetail } from '@/components/features/accounting/journal-entry-detail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface JournalPageClientProps {
  initialEntries: JournalEntry[];
  accounts: Account[];
}

export function JournalPageClient({
  initialEntries,
  accounts,
}: JournalPageClientProps) {
  const t = useTranslations();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filters, setFilters] = useState<JournalFilters>({});

  // Filter entries based on filters
  const filteredEntries = useMemo(() => {
    let result = [...initialEntries];

    // Date range filter
    if (filters.startDate) {
      result = result.filter((entry) => {
        const entryDate =
          typeof entry.date === 'string'
            ? new Date(entry.date)
            : entry.date.toDate
            ? entry.date.toDate()
            : entry.date;
        return entryDate >= filters.startDate!;
      });
    }

    if (filters.endDate) {
      result = result.filter((entry) => {
        const entryDate =
          typeof entry.date === 'string'
            ? new Date(entry.date)
            : entry.date.toDate
            ? entry.date.toDate()
            : entry.date;
        return entryDate <= filters.endDate!;
      });
    }

    // Account filter
    if (filters.accountId) {
      result = result.filter((entry) =>
        entry.lines.some((line) => line.accountId === filters.accountId)
      );
    }

    // Source type filter
    if (filters.sourceType) {
      result = result.filter((entry) => entry.sourceType === filters.sourceType);
    }

    // Entry type filter
    if (filters.entryType) {
      result = result.filter((entry) => entry.type === filters.entryType);
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.entryNumber.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          entry.lines.some(
            (line) =>
              line.accountName.toLowerCase().includes(query) ||
              line.accountCode.toLowerCase().includes(query)
          )
      );
    }

    return result;
  }, [initialEntries, filters]);

  const handleFiltersChange = (newFilters: JournalFilters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleViewDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  // Calculate summary statistics
  const totalDebits = filteredEntries.reduce(
    (sum, entry) => sum + entry.totalDebit,
    0
  );
  const totalCredits = filteredEntries.reduce(
    (sum, entry) => sum + entry.totalCredit,
    0
  );

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <JournalFiltersComponent
          filters={filters}
          accounts={accounts}
          onFiltersChange={handleFiltersChange}
          onReset={handleReset}
        />

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.totalEntries')}
                </p>
                <p className="text-2xl font-bold">{filteredEntries.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.totalDebits')}
                </p>
                <p className="text-2xl font-bold font-mono">
                  {new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalDebits)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.totalCredits')}
                </p>
                <p className="text-2xl font-bold font-mono">
                  {new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalCredits)}
                </p>
              </div>
            </div>
            {totalDebits !== totalCredits && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">
                  {t('accounting.imbalanceWarning')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journal Table */}
        <JournalTable entries={filteredEntries} onViewDetail={handleViewDetail} />

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  {t('accounting.noJournalEntriesFound')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('accounting.tryAdjustingFilters')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('accounting.journalEntryDetails')}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <JournalEntryDetail
              entry={selectedEntry}
              onClose={() => setSelectedEntry(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
