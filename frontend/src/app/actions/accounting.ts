'use server';

/**
 * Accounting Server Actions
 * Handles chart of accounts, journal entries, and accounting operations
 * T014 - Create accounting server actions
 */

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { ActionResult } from '@/lib/actions/types';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '@/types/models/account';
import type { JournalEntry } from '@/types/models/journal-entry';
import {
  calculateAccountBalance,
  getCustomerBalance,
  getPartnerBalance,
  getAccountBalancesByType,
  getTrialBalance,
  calculateNetIncome,
} from '@/lib/accounting/balance-calculator';
import {
  getAccountJournalEntries,
  calculateRunningBalance,
} from '@/lib/accounting/journal-entries';

/**
 * Require authentication and return user with tenant
 */
async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthenticated');
  }
  return user;
}

/**
 * Serialize Firestore Timestamps to ISO strings for client components
 */
function serializeTimestamp(ts: unknown): unknown {
  if (!ts) return undefined;
  if (
    ts &&
    typeof ts === 'object' &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return ts;
}

function serializeAccount(account: Record<string, unknown>): Account {
  return {
    ...account,
    lastUpdated: serializeTimestamp(account.lastUpdated),
    createdAt: serializeTimestamp(account.createdAt),
    updatedAt: serializeTimestamp(account.updatedAt),
  } as unknown as Account;
}

function serializeJournalEntry(entry: Record<string, unknown>): JournalEntry {
  return {
    ...entry,
    date: serializeTimestamp(entry.date),
    createdAt: serializeTimestamp(entry.createdAt),
  } as unknown as JournalEntry;
}

/**
 * Get all accounts for the current tenant
 */
export async function getAccounts(
  activeOnly: boolean = true
): Promise<ActionResult<Account[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    let query = adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .orderBy('code', 'asc');

    if (activeOnly) {
      query = query.where('isActive', '==', true) as any;
    }

    const snapshot = await query.get();

    const accounts: Account[] = [];
    snapshot.forEach((doc) => {
      accounts.push(serializeAccount({ id: doc.id, ...doc.data() }));
    });

    return {
      success: true,
      data: accounts,
    };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return {
      success: false,
      error: 'Failed to fetch accounts',
    };
  }
}

/**
 * Get a single account by ID
 */
export async function getAccount(
  accountId: string
): Promise<ActionResult<Account>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const doc = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc(accountId)
      .get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Account not found',
      };
    }

    return {
      success: true,
      data: serializeAccount({ id: doc.id, ...doc.data() }),
    };
  } catch (error) {
    console.error('Error fetching account:', error);
    return {
      success: false,
      error: 'Failed to fetch account',
    };
  }
}

/**
 * Create a new account
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<ActionResult<Account>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Check for duplicate code
    const existingAccount = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('code', '==', input.code)
      .limit(1)
      .get();

    if (!existingAccount.empty) {
      return {
        success: false,
        error: 'An account with this code already exists',
      };
    }

    // Create account document
    const docRef = adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc();

    const now = Timestamp.now();

    const account: Account = {
      id: docRef.id,
      ...input,
      balance: 0,
      lastUpdated: now as any,
      createdAt: now as any,
      updatedAt: now as any,
    };

    await docRef.set(account);

    revalidatePath('/[locale]/(dashboard)/accounting');

    return {
      success: true,
      data: serializeAccount(account as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return {
      success: false,
      error: 'Failed to create account',
    };
  }
}

/**
 * Update an account
 */
export async function updateAccount(
  accountId: string,
  input: UpdateAccountInput
): Promise<ActionResult<Account>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const docRef = adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc(accountId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: 'Account not found',
      };
    }

    const account = doc.data() as Account;

    // Prevent updating system accounts (except isActive)
    if (account.isSystem && Object.keys(input).some((key) => key !== 'isActive')) {
      return {
        success: false,
        error: 'Cannot modify system accounts',
      };
    }

    await docRef.update({
      ...input,
      updatedAt: Timestamp.now(),
    });

    const updated = await docRef.get();

    revalidatePath('/[locale]/(dashboard)/accounting');

    return {
      success: true,
      data: serializeAccount({ id: updated.id, ...updated.data() }),
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return {
      success: false,
      error: 'Failed to update account',
    };
  }
}

/**
 * Delete an account (soft delete by setting isActive to false)
 */
export async function deleteAccount(
  accountId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const docRef = adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc(accountId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: 'Account not found',
      };
    }

    const account = doc.data() as Account;

    // Prevent deleting system accounts
    if (account.isSystem) {
      return {
        success: false,
        error: 'Cannot delete system accounts',
      };
    }

    // Check if account has any transactions
    const entriesSnap = await adminDb
      .collection(`tenants/${tenantId}/journalEntries`)
      .limit(1)
      .get();

    let hasTransactions = false;
    entriesSnap.forEach((entryDoc) => {
      const entry = entryDoc.data() as JournalEntry;
      if (entry.lines.some((line) => line.accountId === accountId)) {
        hasTransactions = true;
      }
    });

    if (hasTransactions) {
      return {
        success: false,
        error: 'Cannot delete account with existing transactions',
      };
    }

    // Soft delete
    await docRef.update({
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    revalidatePath('/[locale]/(dashboard)/accounting');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    return {
      success: false,
      error: 'Failed to delete account',
    };
  }
}

/**
 * Get journal entries with optional filters
 */
export async function getJournalEntries(params?: {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  sourceType?: 'invoice' | 'payment' | 'expense';
  limit?: number;
}): Promise<ActionResult<JournalEntry[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    let query: any = adminDb
      .collection(`tenants/${tenantId}/journalEntries`)
      .orderBy('date', 'desc');

    if (params?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(params.startDate));
    }

    if (params?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(params.endDate));
    }

    if (params?.sourceType) {
      query = query.where('sourceType', '==', params.sourceType);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const snapshot = await query.get();

    let entries: JournalEntry[] = [];
    snapshot.forEach((doc: any) => {
      entries.push(serializeJournalEntry({ id: doc.id, ...doc.data() }));
    });

    // Filter by accountId if provided (since we can't query array contains in compound query)
    if (params?.accountId) {
      entries = entries.filter((entry) =>
        entry.lines.some((line) => line.accountId === params.accountId)
      );
    }

    return {
      success: true,
      data: entries,
    };
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return {
      success: false,
      error: 'Failed to fetch journal entries',
    };
  }
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntry(
  entryId: string
): Promise<ActionResult<JournalEntry>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const doc = await adminDb
      .collection(`tenants/${tenantId}/journalEntries`)
      .doc(entryId)
      .get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Journal entry not found',
      };
    }

    return {
      success: true,
      data: serializeJournalEntry({ id: doc.id, ...doc.data() }),
    };
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return {
      success: false,
      error: 'Failed to fetch journal entry',
    };
  }
}

/**
 * Get customer balance
 */
export async function getCustomerBalanceAction(
  customerId: string
): Promise<ActionResult<number>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const balance = await getCustomerBalance(tenantId, customerId);

    return {
      success: true,
      data: balance,
    };
  } catch (error) {
    console.error('Error fetching customer balance:', error);
    return {
      success: false,
      error: 'Failed to fetch customer balance',
    };
  }
}

/**
 * Get partner balance
 */
export async function getPartnerBalanceAction(
  partnerId: string
): Promise<ActionResult<number>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const balance = await getPartnerBalance(tenantId, partnerId);

    return {
      success: true,
      data: balance,
    };
  } catch (error) {
    console.error('Error fetching partner balance:', error);
    return {
      success: false,
      error: 'Failed to fetch partner balance',
    };
  }
}

/**
 * Get trial balance
 */
export async function getTrialBalanceAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof getTrialBalance>>>
> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const trialBalance = await getTrialBalance(tenantId);

    return {
      success: true,
      data: trialBalance,
    };
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    return {
      success: false,
      error: 'Failed to fetch trial balance',
    };
  }
}

/**
 * Get net income (profit/loss)
 */
export async function getNetIncomeAction(params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<Awaited<ReturnType<typeof calculateNetIncome>>>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const netIncome = await calculateNetIncome(
      tenantId,
      params?.startDate,
      params?.endDate
    );

    return {
      success: true,
      data: netIncome,
    };
  } catch (error) {
    console.error('Error calculating net income:', error);
    return {
      success: false,
      error: 'Failed to calculate net income',
    };
  }
}

/**
 * Get account statement (journal entries for a specific account)
 */
export async function getAccountStatement(params: {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<
  ActionResult<
    Array<{
      entry: JournalEntry;
      debit: number;
      credit: number;
      runningBalance: number;
    }>
  >
> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Get entries for this account
    const entries = await getAccountJournalEntries(
      tenantId,
      params.accountId,
      params.startDate,
      params.endDate
    );

    // Get account to determine opening balance
    const accountDoc = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc(params.accountId)
      .get();

    if (!accountDoc.exists) {
      return {
        success: false,
        error: 'Account not found',
      };
    }

    const account = accountDoc.data() as Account;

    // Calculate opening balance (balance as of start date - 1 day)
    let openingBalance = 0;
    if (params.startDate) {
      const beforeStartDate = new Date(params.startDate);
      beforeStartDate.setDate(beforeStartDate.getDate() - 1);
      const balanceAsOf = await calculateAccountBalance(tenantId, params.accountId);
      // This is a simplification - in production you'd calculate the exact balance as of the start date
      openingBalance = account.balance - entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
    }

    // Calculate running balances
    const statement = calculateRunningBalance(entries, openingBalance).map(
      (item, index) => ({
        entry: serializeJournalEntry(entries[index].entry as unknown as Record<string, unknown>),
        debit: item.debit,
        credit: item.credit,
        runningBalance: item.runningBalance,
      })
    );

    return {
      success: true,
      data: statement,
    };
  } catch (error) {
    console.error('Error generating account statement:', error);
    return {
      success: false,
      error: 'Failed to generate account statement',
    };
  }
}
