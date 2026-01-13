import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/app/actions/accounting';
import { AccountList } from '@/components/features/accounting/account-list';
import { AccountForm } from '@/components/features/accounting/account-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Plus, RefreshCw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountsPageClient } from './accounts-page-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('accounting.chartOfAccounts'),
    description: t('accounting.chartOfAccountsDescription')
  };
}

async function AccountsContent() {
  const accountsResult = await getAccounts(false); // Get all accounts including inactive

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

  return <AccountsPageClient initialAccounts={accountsResult.data} />;
}

function AccountsLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      </div>
    </div>
  );
}

export default async function AccountsPage({
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
            {t('accounting.chartOfAccounts')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('accounting.chartOfAccountsDescription')}
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <Suspense fallback={<AccountsLoading />}>
        <AccountsContent />
      </Suspense>
    </div>
  );
}
