'use server';

/**
 * Partner Entries Server Actions
 * Handles partner account prepayments and withdrawals
 */

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { ActionResult } from '@/lib/actions/types';
import { createPartnerEntrySchema, type CreatePartnerEntryInput } from '@/lib/validations/partner-entries';
import { createJournalEntry, createSimpleEntry, createReversalEntry } from '@/lib/accounting/journal-entries';
import { getPartnerBalance as getPartnerBalanceFromDb } from '@/lib/accounting/balance-calculator';
import type { Account } from '@/types/models/account';
import type { JournalEntry, JournalEntryType } from '@/types/models/journal-entry';

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

/**
 * Partner entry result type
 */
export interface PartnerEntry {
  id: string;
  entryNumber: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference?: string;
  method: 'cash' | 'bank';
  runningBalance?: number;
  isReversed?: boolean;
  reversedByEntryId?: string;
  isReversal?: boolean;
  reversesEntryId?: string;
}

/**
 * Create a partner account entry (prepayment or withdrawal)
 * Creates corresponding journal entry
 */
export async function createPartnerEntryAction(
  input: CreatePartnerEntryInput
): Promise<ActionResult<{ entryId: string; newBalance: number }>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validationResult = createPartnerEntrySchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Validation failed',
        fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { partnerId, type, amount, method, accountId, reference, notes } = validationResult.data;

    // Get the partner's AP account
    const partnerAccountSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', partnerId)
      .limit(1)
      .get();

    if (partnerAccountSnap.empty) {
      return {
        success: false,
        error: 'Partner account not found. Please ensure the partner has an associated account.',
      };
    }

    const partnerAccount = { id: partnerAccountSnap.docs[0].id, ...partnerAccountSnap.docs[0].data() } as Account;

    // Get the cash/bank account
    const cashBankAccountSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .doc(accountId)
      .get();

    if (!cashBankAccountSnap.exists) {
      return {
        success: false,
        error: 'Payment account not found.',
      };
    }

    const cashBankAccount = { id: cashBankAccountSnap.id, ...cashBankAccountSnap.data() } as Account;

    // Get partner name for description
    const partnerSnap = await adminDb
      .collection(`tenants/${tenantId}/partners`)
      .doc(partnerId)
      .get();

    const partnerName = partnerSnap.exists ? (partnerSnap.data()?.name || 'Unknown Partner') : 'Unknown Partner';

    // Determine journal entry type and create lines based on entry type
    let journalEntryType: JournalEntryType;
    let description: string;
    let lines: ReturnType<typeof createSimpleEntry>;

    if (type === 'credit') {
      // Credit Entry (Prepayment to Partner)
      // DEBIT: Partner Account (AP - 3xxx) - Decrease liability (we prepaid them)
      // CREDIT: Cash/Bank Account (1001/1002) - Decrease asset (cash goes out)
      journalEntryType = 'partner_prepayment';
      description = `Partner prepayment - ${partnerName}${reference ? ` (${reference})` : ''}`;

      lines = createSimpleEntry(
        { id: partnerAccount.id, name: partnerAccount.name, code: partnerAccount.code },
        { id: cashBankAccount.id, name: cashBankAccount.name, code: cashBankAccount.code },
        amount
      );
    } else {
      // Debit Entry (Withdrawal/Adjustment from Partner)
      // DEBIT: Cash/Bank Account (1001/1002) - Increase asset (cash comes in)
      // CREDIT: Partner Account (AP - 3xxx) - Increase liability (we owe them less / they withdrew)
      journalEntryType = 'partner_withdrawal';
      description = `Partner withdrawal - ${partnerName}${reference ? ` (${reference})` : ''}`;

      lines = createSimpleEntry(
        { id: cashBankAccount.id, name: cashBankAccount.name, code: cashBankAccount.code },
        { id: partnerAccount.id, name: partnerAccount.name, code: partnerAccount.code },
        amount
      );
    }

    // Add notes to description if provided
    if (notes) {
      description += ` - ${notes}`;
    }

    // Create journal entry
    const journalEntry = await createJournalEntry({
      tenantId,
      description,
      type: journalEntryType,
      lines,
      sourceType: 'payment',
      sourceId: `partner-entry-${Date.now()}`, // Generate unique source ID
      createdBy: user.uid,
    });

    // Get the updated partner balance
    const newBalance = await getPartnerBalanceFromDb(tenantId, partnerId);

    // Revalidate related paths
    revalidatePath('/[locale]/(dashboard)/partner-entries');
    revalidatePath('/[locale]/(dashboard)/accounting/journal');
    revalidatePath('/[locale]/(dashboard)/accounting/accounts');

    return {
      success: true,
      data: {
        entryId: journalEntry.id,
        newBalance,
      },
      message: type === 'credit' ? 'Partner credit added successfully' : 'Partner debit recorded successfully',
    };
  } catch (error) {
    console.error('Error creating partner entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create partner entry',
    };
  }
}

/**
 * Get partner current balance
 */
export async function getPartnerBalanceAction(
  partnerId: string
): Promise<ActionResult<{ balance: number; accountId: string | null }>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    if (!partnerId) {
      return {
        success: false,
        error: 'Partner ID is required',
      };
    }

    // Get the partner's AP account
    const partnerAccountSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', partnerId)
      .limit(1)
      .get();

    if (partnerAccountSnap.empty) {
      return {
        success: true,
        data: { balance: 0, accountId: null },
      };
    }

    const partnerAccount = partnerAccountSnap.docs[0].data() as Account;

    return {
      success: true,
      data: {
        balance: partnerAccount.balance,
        accountId: partnerAccountSnap.docs[0].id,
      },
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
 * Get partner entries history (journal entries related to partner)
 */
export async function getPartnerEntriesAction(
  partnerId: string,
  options?: { limit?: number }
): Promise<ActionResult<PartnerEntry[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    if (!partnerId) {
      return {
        success: false,
        error: 'Partner ID is required',
      };
    }

    // Get the partner's AP account
    const partnerAccountSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', partnerId)
      .limit(1)
      .get();

    if (partnerAccountSnap.empty) {
      return {
        success: true,
        data: [],
      };
    }

    const partnerAccountId = partnerAccountSnap.docs[0].id;

    // Get journal entries that involve this partner's account
    const entriesSnap = await adminDb
      .collection(`tenants/${tenantId}/journalEntries`)
      .orderBy('date', 'desc')
      .limit(options?.limit || 50)
      .get();

    const entries: PartnerEntry[] = [];
    let runningBalance = 0;

    // We need to calculate running balance from oldest to newest, then reverse
    const allEntries: Array<{
      entry: JournalEntry;
      partnerDebit: number;
      partnerCredit: number;
    }> = [];

    entriesSnap.forEach((doc) => {
      const entry = { id: doc.id, ...doc.data() } as JournalEntry;

      // Find lines for the partner account
      const partnerLines = entry.lines.filter((line) => line.accountId === partnerAccountId);

      if (partnerLines.length > 0) {
        const partnerDebit = partnerLines.reduce((sum, line) => sum + line.debit, 0);
        const partnerCredit = partnerLines.reduce((sum, line) => sum + line.credit, 0);

        allEntries.push({
          entry,
          partnerDebit,
          partnerCredit,
        });
      }
    });

    // Reverse to calculate running balance from oldest first
    const reversedEntries = [...allEntries].reverse();
    const balancedEntries: Array<{
      entry: JournalEntry;
      partnerDebit: number;
      partnerCredit: number;
      runningBalance: number;
    }> = [];

    for (const item of reversedEntries) {
      // Balance change: debit decreases liability (prepayment), credit increases liability (we owe more)
      runningBalance += item.partnerCredit - item.partnerDebit;
      balancedEntries.push({
        ...item,
        runningBalance,
      });
    }

    // Reverse back to get newest first with correct running balances
    balancedEntries.reverse();

    for (const item of balancedEntries) {
      const { entry, partnerDebit, partnerCredit, runningBalance: balance } = item;

      // Determine entry type based on which direction money moved
      // Credit entry (prepayment): Partner account is debited (debit > 0)
      // Debit entry (withdrawal/invoice): Partner account is credited (credit > 0)
      const isCredit = partnerDebit > partnerCredit;
      const amount = Math.abs(partnerDebit - partnerCredit);

      // Determine payment method from the description or other account
      let method: 'cash' | 'bank' = 'cash';
      const otherLine = entry.lines.find((line) => line.accountId !== partnerAccountId);
      if (otherLine) {
        if (otherLine.accountCode === '1002' || otherLine.accountName.toLowerCase().includes('bank')) {
          method = 'bank';
        }
      }

      // Extract reference from description if present
      const refMatch = entry.description.match(/\(([^)]+)\)/);
      const reference = refMatch ? refMatch[1] : undefined;

      entries.push({
        id: entry.id,
        entryNumber: entry.entryNumber,
        date: serializeTimestamp(entry.date) as string,
        type: isCredit ? 'credit' : 'debit',
        amount,
        description: entry.description,
        reference,
        method,
        runningBalance: balance,
        isReversed: !!entry.reversedByEntryId,
        reversedByEntryId: entry.reversedByEntryId,
        isReversal: !!entry.isReversal,
        reversesEntryId: entry.reversesEntryId,
      });
    }

    return {
      success: true,
      data: entries,
    };
  } catch (error) {
    console.error('Error fetching partner entries:', error);
    return {
      success: false,
      error: 'Failed to fetch partner entries',
    };
  }
}

/**
 * Get cash and bank accounts for payment method selection
 */
export async function getCashBankAccountsAction(): Promise<
  ActionResult<Array<{ id: string; code: string; name: string; nameAr: string; type: 'cash' | 'bank' }>>
> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const accountsSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('isActive', '==', true)
      .get();

    const accounts: Array<{ id: string; code: string; name: string; nameAr: string; type: 'cash' | 'bank' }> = [];

    accountsSnap.forEach((doc) => {
      const account = doc.data() as Account;
      if (account.subtype === 'cash' || account.subtype === 'bank') {
        accounts.push({
          id: doc.id,
          code: account.code,
          name: account.name,
          nameAr: account.nameAr || account.name,
          type: account.subtype as 'cash' | 'bank',
        });
      }
    });

    // Sort by code
    accounts.sort((a, b) => a.code.localeCompare(b.code));

    return {
      success: true,
      data: accounts,
    };
  } catch (error) {
    console.error('Error fetching cash/bank accounts:', error);
    return {
      success: false,
      error: 'Failed to fetch payment accounts',
    };
  }
}

/**
 * Cancel a partner entry by creating a reversal journal entry
 * This maintains the audit trail instead of deleting the original entry
 */
export async function cancelPartnerEntryAction(input: {
  entryId: string;
  partnerId: string;
  reason: string;
}): Promise<ActionResult<{ reversalEntryId: string; newBalance: number }>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const { entryId, partnerId, reason } = input;

    if (!entryId || !partnerId || !reason) {
      return {
        success: false,
        error: 'Entry ID, Partner ID, and reason are required',
      };
    }

    // Verify the entry exists and belongs to this partner
    const entrySnap = await adminDb
      .collection(`tenants/${tenantId}/journalEntries`)
      .doc(entryId)
      .get();

    if (!entrySnap.exists) {
      return {
        success: false,
        error: 'Entry not found',
      };
    }

    const entry = entrySnap.data() as JournalEntry;

    // Check if entry is already reversed
    if (entry.reversedByEntryId) {
      return {
        success: false,
        error: 'This entry has already been reversed',
      };
    }

    // Check if this is a reversal entry (reversals cannot be reversed)
    if (entry.isReversal) {
      return {
        success: false,
        error: 'Reversal entries cannot be cancelled',
      };
    }

    // Get the partner's AP account to verify this entry involves it
    const partnerAccountSnap = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', partnerId)
      .limit(1)
      .get();

    if (partnerAccountSnap.empty) {
      return {
        success: false,
        error: 'Partner account not found',
      };
    }

    const partnerAccountId = partnerAccountSnap.docs[0].id;

    // Verify this entry involves the partner's account
    const hasPartnerLine = entry.lines.some((line) => line.accountId === partnerAccountId);
    if (!hasPartnerLine) {
      return {
        success: false,
        error: 'This entry does not belong to the selected partner',
      };
    }

    // Create the reversal entry using the accounting helper
    const reversalEntry = await createReversalEntry(
      tenantId,
      entryId,
      user.uid,
      reason
    );

    // Get the updated partner balance
    const newBalance = await getPartnerBalanceFromDb(tenantId, partnerId);

    // Revalidate related paths
    revalidatePath('/[locale]/(dashboard)/partner-entries');
    revalidatePath('/[locale]/(dashboard)/accounting/journal');
    revalidatePath('/[locale]/(dashboard)/accounting/accounts');

    return {
      success: true,
      data: {
        reversalEntryId: reversalEntry.id,
        newBalance,
      },
      message: 'Entry cancelled successfully',
    };
  } catch (error) {
    console.error('Error cancelling partner entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel entry',
    };
  }
}
