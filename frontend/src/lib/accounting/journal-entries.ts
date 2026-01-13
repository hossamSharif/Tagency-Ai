/**
 * Journal Entry Helper Utilities
 * Double-entry accounting journal entry creation and management
 * T011 - Create journal entry helper utilities
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryType,
} from '@/types/models/journal-entry';
import { generateSequentialNumber } from './number-generator';

/**
 * Input for creating a journal entry
 */
export interface CreateJournalEntryInput {
  tenantId: string;
  description: string;
  type: JournalEntryType;
  lines: JournalEntryLine[];
  sourceType: 'invoice' | 'payment' | 'expense';
  sourceId: string;
  createdBy: string;
  date?: Date;
  isReversal?: boolean;
  reversesEntryId?: string;
}

/**
 * Validate that a journal entry is balanced (debits === credits)
 */
export function validateBalancedEntry(lines: JournalEntryLine[]): {
  isValid: boolean;
  totalDebit: number;
  totalCredit: number;
  error?: string;
} {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebit: 0,
      totalCredit: 0,
      error: 'Journal entry must have at least 2 lines',
    };
  }

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  // Allow 0.01 difference for floating point precision
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    isValid: isBalanced,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    error: isBalanced
      ? undefined
      : `Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`,
  };
}

/**
 * Create a journal entry with automatic balance validation
 * Also updates account balances in a transaction
 */
export async function createJournalEntry(
  input: CreateJournalEntryInput
): Promise<JournalEntry> {
  const { tenantId, lines, date, isReversal = false, reversesEntryId } = input;

  // Validate balanced entry
  const validation = validateBalancedEntry(lines);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Validate that each line has either debit or credit, not both
  for (const line of lines) {
    if (line.debit > 0 && line.credit > 0) {
      throw new Error(
        `Line for account ${line.accountCode} has both debit and credit`
      );
    }
    if (line.debit === 0 && line.credit === 0) {
      throw new Error(
        `Line for account ${line.accountCode} must have either debit or credit`
      );
    }
  }

  // Generate entry number
  const entryNumber = await generateSequentialNumber(
    tenantId,
    'journalEntries',
    'JE'
  );

  const entryDate = date || new Date();

  // Create journal entry document
  const entryRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .doc();

  const entry: JournalEntry = {
    id: entryRef.id,
    entryNumber,
    date: Timestamp.fromDate(entryDate),
    description: input.description,
    type: input.type,
    lines,
    totalDebit: validation.totalDebit,
    totalCredit: validation.totalCredit,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    isReversal,
    ...(reversesEntryId ? { reversesEntryId } : {}),
    createdBy: input.createdBy,
    createdAt: Timestamp.now(),
  };

  // Use batch to update journal entry and account balances atomically
  const batch = adminDb.batch();

  // Set the journal entry
  batch.set(entryRef, entry);

  // Update account balances
  for (const line of lines) {
    const accountRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('accounts')
      .doc(line.accountId);

    // Balance change = debit - credit
    // Asset/Expense accounts: increase with debits
    // Liability/Income accounts: increase with credits
    const balanceChange = line.debit - line.credit;

    batch.update(accountRef, {
      balance: FieldValue.increment(balanceChange),
      lastUpdated: Timestamp.now(),
    });
  }

  // Commit the batch
  await batch.commit();

  return entry;
}

/**
 * Create a reversal journal entry (for cancellations)
 * Reverses all debits and credits from the original entry
 */
export async function createReversalEntry(
  tenantId: string,
  originalEntryId: string,
  createdBy: string,
  reason: string
): Promise<JournalEntry> {
  // Fetch the original entry
  const originalEntryRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .doc(originalEntryId);

  const originalEntrySnap = await originalEntryRef.get();
  if (!originalEntrySnap.exists) {
    throw new Error(`Journal entry ${originalEntryId} not found`);
  }

  const originalEntry = originalEntrySnap.data() as JournalEntry;

  // Check if already reversed
  if (originalEntry.reversedByEntryId) {
    throw new Error(`Entry ${originalEntryId} has already been reversed`);
  }

  // Create reversed lines (swap debits and credits)
  const reversedLines: JournalEntryLine[] = originalEntry.lines.map(
    (line) => ({
      accountId: line.accountId,
      accountName: line.accountName,
      accountCode: line.accountCode,
      debit: line.credit, // Swap
      credit: line.debit, // Swap
    })
  );

  // Create the reversal entry
  const reversalEntry = await createJournalEntry({
    tenantId,
    description: `Reversal: ${reason}`,
    type: 'adjustment',
    lines: reversedLines,
    sourceType: originalEntry.sourceType,
    sourceId: originalEntry.sourceId,
    createdBy,
    isReversal: true,
    reversesEntryId: originalEntryId,
  });

  // Update the original entry to mark it as reversed
  await originalEntryRef.update({
    reversedByEntryId: reversalEntry.id,
  });

  return reversalEntry;
}

/**
 * Helper to create a simple two-line journal entry
 */
export function createSimpleEntry(
  debitAccount: { id: string; name: string; code: string },
  creditAccount: { id: string; name: string; code: string },
  amount: number
): JournalEntryLine[] {
  return [
    {
      accountId: debitAccount.id,
      accountName: debitAccount.name,
      accountCode: debitAccount.code,
      debit: amount,
      credit: 0,
    },
    {
      accountId: creditAccount.id,
      accountName: creditAccount.name,
      accountCode: creditAccount.code,
      debit: 0,
      credit: amount,
    },
  ];
}

/**
 * Get journal entries for a specific account within a date range
 * Used for generating account statements
 */
export async function getAccountJournalEntries(
  tenantId: string,
  accountId: string,
  startDate?: Date,
  endDate?: Date
): Promise<
  Array<{
    entry: JournalEntry;
    debit: number;
    credit: number;
  }>
> {
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

  const snapshot = await query.get();

  // Filter entries that have lines for this account
  const accountEntries: Array<{
    entry: JournalEntry;
    debit: number;
    credit: number;
  }> = [];

  snapshot.forEach((doc) => {
    const entry = { id: doc.id, ...doc.data() } as JournalEntry;

    // Find lines for this account
    const accountLines = entry.lines.filter(
      (line) => line.accountId === accountId
    );

    if (accountLines.length > 0) {
      // Sum debits and credits for this account
      const debit = accountLines.reduce((sum, line) => sum + line.debit, 0);
      const credit = accountLines.reduce((sum, line) => sum + line.credit, 0);

      accountEntries.push({
        entry,
        debit,
        credit,
      });
    }
  });

  return accountEntries;
}

/**
 * Calculate running balance for account entries
 */
export function calculateRunningBalance(
  entries: Array<{ debit: number; credit: number }>,
  openingBalance: number = 0
): Array<{ debit: number; credit: number; runningBalance: number }> {
  let balance = openingBalance;

  return entries.map((entry) => {
    balance += entry.debit - entry.credit;
    return {
      ...entry,
      runningBalance: balance,
    };
  });
}

/**
 * Input for creating an invoice adjustment entry (Net/Agency Accounting)
 * Used when editing issued/partial/paid invoices
 */
export interface InvoiceAdjustmentInput {
  tenantId: string;
  originalEntryId: string;
  sourceId: string;
  description: string;
  createdBy: string;
  // Calculated deltas
  arDelta: number; // Positive = customer owes more, Negative = owes less
  apDeltas: Array<{
    partnerId: string;
    accountId: string;
    accountName: string;
    accountCode: string;
    delta: number; // Positive = we owe more, Negative = we owe less
  }>;
  revenueDelta: number; // Positive = more revenue, Negative = less revenue
  customerAccount: { id: string; name: string; code: string };
  revenueAccount: { id: string; name: string; code: string };
}

/**
 * Create an invoice adjustment journal entry for the Net/Agency accounting model
 * Handles AR, AP (per partner), and Revenue adjustments
 * Returns null if no adjustment is needed (all deltas are zero)
 */
export async function createInvoiceAdjustmentEntry(
  input: InvoiceAdjustmentInput
): Promise<JournalEntry | null> {
  const {
    tenantId,
    originalEntryId,
    sourceId,
    description,
    createdBy,
    arDelta,
    apDeltas,
    revenueDelta,
    customerAccount,
    revenueAccount,
  } = input;

  // Check if any adjustment is needed
  const hasArChange = Math.abs(arDelta) >= 0.01;
  const hasApChange = apDeltas.some((ap) => Math.abs(ap.delta) >= 0.01);
  const hasRevenueChange = Math.abs(revenueDelta) >= 0.01;

  if (!hasArChange && !hasApChange && !hasRevenueChange) {
    // No adjustment needed
    return null;
  }

  // Build journal lines based on deltas
  const journalLines: JournalEntryLine[] = [];

  // AR adjustment (Asset account)
  // Positive delta = customer owes more = Debit AR
  // Negative delta = customer owes less = Credit AR
  if (hasArChange) {
    if (arDelta > 0) {
      journalLines.push({
        accountId: customerAccount.id,
        accountName: customerAccount.name,
        accountCode: customerAccount.code,
        debit: Math.abs(arDelta),
        credit: 0,
      });
    } else {
      journalLines.push({
        accountId: customerAccount.id,
        accountName: customerAccount.name,
        accountCode: customerAccount.code,
        debit: 0,
        credit: Math.abs(arDelta),
      });
    }
  }

  // AP adjustments (Liability accounts)
  // Positive delta = we owe more = Credit AP (increase liability)
  // Negative delta = we owe less = Debit AP (decrease liability)
  for (const apDelta of apDeltas) {
    if (Math.abs(apDelta.delta) >= 0.01) {
      if (apDelta.delta > 0) {
        journalLines.push({
          accountId: apDelta.accountId,
          accountName: apDelta.accountName,
          accountCode: apDelta.accountCode,
          debit: 0,
          credit: Math.abs(apDelta.delta),
        });
      } else {
        journalLines.push({
          accountId: apDelta.accountId,
          accountName: apDelta.accountName,
          accountCode: apDelta.accountCode,
          debit: Math.abs(apDelta.delta),
          credit: 0,
        });
      }
    }
  }

  // Revenue adjustment (Income account)
  // Positive delta = more revenue = Credit Revenue
  // Negative delta = less revenue = Debit Revenue
  if (hasRevenueChange) {
    if (revenueDelta > 0) {
      journalLines.push({
        accountId: revenueAccount.id,
        accountName: revenueAccount.name,
        accountCode: revenueAccount.code,
        debit: 0,
        credit: Math.abs(revenueDelta),
      });
    } else {
      journalLines.push({
        accountId: revenueAccount.id,
        accountName: revenueAccount.name,
        accountCode: revenueAccount.code,
        debit: Math.abs(revenueDelta),
        credit: 0,
      });
    }
  }

  // Validate balance
  const validation = validateBalancedEntry(journalLines);
  if (!validation.isValid) {
    throw new Error(
      `Invoice adjustment entry is not balanced: ${validation.error}`
    );
  }

  // Create the journal entry
  const adjustmentEntry = await createJournalEntry({
    tenantId,
    description,
    type: 'invoice_updated',
    lines: journalLines,
    sourceType: 'invoice',
    sourceId,
    createdBy,
    isReversal: false,
  });

  // Link adjustment to original entry
  const originalEntryRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .doc(originalEntryId);

  // Add reference to adjustments on original entry (for audit trail)
  await originalEntryRef.update({
    adjustedByEntryIds: FieldValue.arrayUnion(adjustmentEntry.id),
  });

  return adjustmentEntry;
}
