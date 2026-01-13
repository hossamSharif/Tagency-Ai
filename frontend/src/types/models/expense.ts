// Expense type definition per data-model.md
// T004 [P] Create Expense type

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'travel'
  | 'marketing'
  | 'salary'
  | 'other';

export type PaymentMethod = 'cash' | 'bank';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
}

/**
 * Expense - Business expense records
 * Collection: `tenants/{tenantId}/expenses/{expenseId}`
 */
export interface Expense {
  // Identity
  id: string;
  expenseNumber: string;

  // Details
  description: string;
  category: ExpenseCategory;

  // Amount
  amount: number;
  currency: CurrencyCode;

  // Payment
  paymentMethod: PaymentMethod;
  accountId: string;
  accountName: string;

  // Expense Account
  expenseAccountId: string;
  expenseAccountName: string;

  // Date
  expenseDate: Timestamp;

  // Vendor (optional)
  vendorName?: string;
  vendorInvoiceNumber?: string;

  // Attachments (receipts)
  attachments?: Attachment[];

  // Notes
  notes?: string;

  // Accounting Reference
  journalEntryId: string;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input for creating a new expense
 */
export type CreateExpenseInput = Omit<
  Expense,
  'id' | 'expenseNumber' | 'journalEntryId' | 'createdAt' | 'updatedAt'
>;

/**
 * Input for updating an expense
 */
export type UpdateExpenseInput = Partial<
  Omit<Expense, 'id' | 'expenseNumber' | 'journalEntryId' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;
