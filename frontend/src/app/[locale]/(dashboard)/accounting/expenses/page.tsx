/**
 * Expenses Page
 * T075 [US8] Create expenses page
 * Main page for managing business expenses
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { RefreshCw } from 'lucide-react';
import { getExpenses, getExpenseSummary } from '@/app/actions/expenses';
import { getAccounts } from '@/app/actions/accounting';
import { ExpensesPageClient } from './expenses-page-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('expenses.expenses'),
    description: t('expenses.expensesDescription'),
  };
}

async function ExpensesContent() {
  // Fetch expenses and accounts in parallel
  const [expensesResult, accountsResult] = await Promise.all([
    getExpenses({ limit: 100 }),
    getAccounts(true), // Only active accounts
  ]);

  if (!expensesResult.success) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-lg text-destructive mb-2">Failed to load expenses</p>
          <p className="text-sm text-muted-foreground">{expensesResult.error}</p>
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

  // Filter accounts for payment (cash/bank) and expense types
  const paymentAccounts = accountsResult.data.filter(
    (acc) => acc.subtype === 'cash' || acc.subtype === 'bank'
  );
  const expenseAccounts = accountsResult.data.filter((acc) => acc.type === 'expense');

  return (
    <ExpensesPageClient
      initialExpenses={expensesResult.data}
      paymentAccounts={paymentAccounts}
      expenseAccounts={expenseAccounts}
    />
  );
}

function ExpensesLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading expenses...</p>
      </div>
    </div>
  );
}

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('expenses.expenses')}</h1>
          <p className="text-muted-foreground mt-1">{t('expenses.expensesDescription')}</p>
        </div>
      </div>

      {/* Expenses Content */}
      <Suspense fallback={<ExpensesLoading />}>
        <ExpensesContent />
      </Suspense>
    </div>
  );
}
