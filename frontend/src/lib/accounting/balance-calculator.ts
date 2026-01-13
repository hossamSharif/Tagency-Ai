/**
 * Balance Calculator Utilities
 * Calculate account balances from journal entries
 * T012 - Create balance calculator utilities
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Account, AccountType } from '@/types/models/account';
import type { JournalEntry } from '@/types/models/journal-entry';

/**
 * Calculate the current balance for a specific account
 * from all journal entries
 */
export async function calculateAccountBalance(
  tenantId: string,
  accountId: string
): Promise<number> {
  // Get all journal entries
  const entriesSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .get();

  let balance = 0;

  entriesSnap.forEach((doc) => {
    const entry = doc.data() as JournalEntry;

    // Find lines for this account
    const accountLines = entry.lines.filter(
      (line) => line.accountId === accountId
    );

    // Sum the balance changes (debit - credit)
    accountLines.forEach((line) => {
      balance += line.debit - line.credit;
    });
  });

  return Math.round(balance * 100) / 100;
}

/**
 * Calculate balance as of a specific date
 */
export async function calculateAccountBalanceAsOf(
  tenantId: string,
  accountId: string,
  asOfDate: Date
): Promise<number> {
  const entriesSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .where('date', '<=', Timestamp.fromDate(asOfDate))
    .get();

  let balance = 0;

  entriesSnap.forEach((doc) => {
    const entry = doc.data() as JournalEntry;

    const accountLines = entry.lines.filter(
      (line) => line.accountId === accountId
    );

    accountLines.forEach((line) => {
      balance += line.debit - line.credit;
    });
  });

  return Math.round(balance * 100) / 100;
}

/**
 * Recalculate and update the balance for a specific account
 * Useful for fixing inconsistencies
 */
export async function recalculateAndUpdateAccountBalance(
  tenantId: string,
  accountId: string
): Promise<{ oldBalance: number; newBalance: number }> {
  const accountRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .doc(accountId);

  const accountSnap = await accountRef.get();
  if (!accountSnap.exists) {
    throw new Error(`Account ${accountId} not found`);
  }

  const account = accountSnap.data() as Account;
  const oldBalance = account.balance;

  // Calculate the correct balance
  const newBalance = await calculateAccountBalance(tenantId, accountId);

  // Update the account
  await accountRef.update({
    balance: newBalance,
    lastUpdated: Timestamp.now(),
  });

  return { oldBalance, newBalance };
}

/**
 * Get the balance for a customer (receivable account)
 */
export async function getCustomerBalance(
  tenantId: string,
  customerId: string
): Promise<number> {
  // Find the customer's account
  const accountsSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .where('linkedEntityType', '==', 'customer')
    .where('linkedEntityId', '==', customerId)
    .limit(1)
    .get();

  if (accountsSnap.empty) {
    return 0; // No account yet
  }

  const account = accountsSnap.docs[0].data() as Account;
  return account.balance;
}

/**
 * Get the balance for a partner (payable account)
 */
export async function getPartnerBalance(
  tenantId: string,
  partnerId: string
): Promise<number> {
  // Find the partner's account
  const accountsSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .where('linkedEntityType', '==', 'partner')
    .where('linkedEntityId', '==', partnerId)
    .limit(1)
    .get();

  if (accountsSnap.empty) {
    return 0; // No account yet
  }

  const account = accountsSnap.docs[0].data() as Account;
  return account.balance;
}

/**
 * Get balances for all accounts of a specific type
 */
export async function getAccountBalancesByType(
  tenantId: string,
  accountType: AccountType
): Promise<Array<{ account: Account; balance: number }>> {
  const accountsSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .where('type', '==', accountType)
    .where('isActive', '==', true)
    .get();

  const balances: Array<{ account: Account; balance: number }> = [];

  accountsSnap.forEach((doc) => {
    const account = { id: doc.id, ...doc.data() } as Account;
    balances.push({
      account,
      balance: account.balance,
    });
  });

  return balances;
}

/**
 * Calculate total for a specific account type
 * (e.g., total assets, total expenses)
 */
export async function getTotalByAccountType(
  tenantId: string,
  accountType: AccountType
): Promise<number> {
  const balances = await getAccountBalancesByType(tenantId, accountType);
  const total = balances.reduce((sum, item) => sum + item.balance, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Get trial balance (all accounts with their balances)
 * Used for financial reporting
 */
export async function getTrialBalance(tenantId: string): Promise<{
  accounts: Array<{
    code: string;
    name: string;
    type: AccountType;
    debit: number;
    credit: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}> {
  const accountsSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .where('isActive', '==', true)
    .orderBy('code', 'asc')
    .get();

  const accounts: Array<{
    code: string;
    name: string;
    type: AccountType;
    debit: number;
    credit: number;
  }> = [];

  let totalDebits = 0;
  let totalCredits = 0;

  accountsSnap.forEach((doc) => {
    const account = doc.data() as Account;
    const balance = account.balance;

    // In trial balance:
    // - Assets and Expenses show as debits (positive balances)
    // - Liabilities and Income show as credits (negative balances for liabilities/income)
    let debit = 0;
    let credit = 0;

    if (balance > 0) {
      debit = balance;
      totalDebits += balance;
    } else if (balance < 0) {
      credit = Math.abs(balance);
      totalCredits += Math.abs(balance);
    }

    accounts.push({
      code: account.code,
      name: account.name,
      type: account.type,
      debit,
      credit,
    });
  });

  // Round totals
  totalDebits = Math.round(totalDebits * 100) / 100;
  totalCredits = Math.round(totalCredits * 100) / 100;

  return {
    accounts,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
  };
}

/**
 * Calculate net income (revenues - expenses)
 */
export async function calculateNetIncome(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  revenue: number;
  expenses: number;
  netIncome: number;
}> {
  // Get all journal entries within the date range
  let query = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .orderBy('date', 'asc');

  if (startDate) {
    query = query.where('date', '>=', Timestamp.fromDate(startDate)) as any;
  }

  if (endDate) {
    query = query.where('date', '<=', Timestamp.fromDate(endDate)) as any;
  }

  const entriesSnap = await query.get();

  // Get all accounts
  const accountsSnap = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts')
    .get();

  const accountsMap = new Map<string, Account>();
  accountsSnap.forEach((doc) => {
    const account = { id: doc.id, ...doc.data() } as Account;
    accountsMap.set(account.id, account);
  });

  let revenueTotal = 0;
  let expenseTotal = 0;

  entriesSnap.forEach((doc) => {
    const entry = doc.data() as JournalEntry;

    entry.lines.forEach((line) => {
      const account = accountsMap.get(line.accountId);
      if (!account) return;

      if (account.type === 'income') {
        // Income accounts increase with credits
        revenueTotal += line.credit;
      } else if (account.type === 'expense') {
        // Expense accounts increase with debits
        expenseTotal += line.debit;
      }
    });
  });

  const netIncome = revenueTotal - expenseTotal;

  return {
    revenue: Math.round(revenueTotal * 100) / 100,
    expenses: Math.round(expenseTotal * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
  };
}
