// JournalEntry type definition per data-model.md
// T003 [P] Create JournalEntry type

import { Timestamp } from 'firebase/firestore';

export type JournalEntryType =
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_cancelled'
  | 'customer_payment'
  | 'partner_payment'
  | 'partner_prepayment'
  | 'partner_withdrawal'
  | 'expense'
  | 'adjustment';

export interface JournalEntryLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
}

/**
 * JournalEntry - Double-entry accounting journal entries
 * Collection: `tenants/{tenantId}/journalEntries/{entryId}`
 */
export interface JournalEntry {
  // Identity
  id: string;
  entryNumber: string;

  // Entry Details
  date: Timestamp;
  description: string;
  type: JournalEntryType;

  // Double-Entry Lines (must balance: sum(debits) === sum(credits))
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;

  // Source Reference
  sourceType: 'invoice' | 'payment' | 'expense';
  sourceId: string;

  // Reversal (for cancellations/corrections)
  isReversal: boolean;
  reversesEntryId?: string;
  reversedByEntryId?: string;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
}

/**
 * Input for creating a new journal entry
 */
export type CreateJournalEntryInput = Omit<
  JournalEntry,
  'id' | 'entryNumber' | 'createdAt'
>;
