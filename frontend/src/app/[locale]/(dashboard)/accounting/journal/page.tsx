/**
 * T070 [US7] Create journal entries page
 * Journal entries list page with filters and detail view
 */

import { getJournalEntries, getAccounts } from '@/app/actions/accounting';
import { RefreshCw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { JournalPageClient } from './journal-page-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('accounting.journalEntries'),
    description: t('accounting.journalEntriesDescription')
  };
}

async function JournalContent() {
  const [entriesResult, accountsResult] = await Promise.all([
    getJournalEntries({ limit: 100 }),
    getAccounts(true)
  ]);

  if (!entriesResult.success) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">Failed to load journal entries</p>
          <p className="text-sm text-muted-foreground">{entriesResult.error}</p>
        </div>
      </div>
    );
  }

  if (!accountsResult.success) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">Failed to load accounts</p>
          <p className="text-sm text-muted-foreground">{accountsResult.error}</p>
        </div>
      </div>
    );
  }

  return (
    <JournalPageClient
      initialEntries={entriesResult.data}
      accounts={accountsResult.data}
    />
  );
}

function JournalLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading journal entries...</p>
      </div>
    </div>
  );
}

export default async function JournalPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('accounting.journalEntries')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('accounting.journalEntriesDescription')}
          </p>
        </div>
      </div>

      {/* Journal Content */}
      <Suspense fallback={<JournalLoading />}>
        <JournalContent />
      </Suspense>
    </div>
  );
}
