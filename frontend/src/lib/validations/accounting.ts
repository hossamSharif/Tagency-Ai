// Accounting validation schemas
// T008 [P] Create Zod schema for accounting

import { z } from 'zod';

// Account schema
export const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(10, 'Code must be less than 10 characters'),
  name: z.string().min(1, 'Account name is required').max(100, 'Name must be less than 100 characters'),
  nameAr: z.string().min(1, 'Arabic name is required').max(100, 'Arabic name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: z.enum(['asset', 'liability', 'income', 'expense']),
  subtype: z.enum([
    'cash',
    'bank',
    'receivable',
    'payable',
    'revenue',
    'expense_general',
    'expense_rent',
    'expense_utilities',
    'expense_supplies',
    'expense_other',
  ]),
  linkedEntityType: z.enum(['customer', 'partner']).optional(),
  linkedEntityId: z.string().optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Update account schema
export const updateAccountSchema = accountSchema.partial().omit({
  code: true,
  isSystem: true,
});

// Journal entry line schema
export const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountCode: z.string().min(1, 'Account code is required'),
  debit: z.number().min(0, 'Debit must be non-negative'),
  credit: z.number().min(0, 'Credit must be non-negative'),
}).refine(
  (data) => {
    // Each line must have either debit or credit, not both
    return (data.debit > 0 && data.credit === 0) || (data.credit > 0 && data.debit === 0);
  },
  {
    message: 'A line must have either debit or credit, not both',
  }
);

// Journal entry schema
export const journalEntrySchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  type: z.enum([
    'invoice_created',
    'invoice_updated',
    'invoice_cancelled',
    'customer_payment',
    'partner_payment',
    'expense',
    'adjustment',
  ]),
  lines: z.array(journalEntryLineSchema).min(2, 'At least 2 lines are required'),
  sourceType: z.enum(['invoice', 'payment', 'expense']),
  sourceId: z.string().min(1, 'Source ID is required'),
  isReversal: z.boolean().default(false),
  reversesEntryId: z.string().optional(),
}).refine(
  (data) => {
    // Validate balanced entry
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating point precision
  },
  {
    message: 'Journal entry must be balanced (total debits must equal total credits)',
  }
);

// Search journal entries schema
export const searchJournalEntriesSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum([
    'invoice_created',
    'invoice_updated',
    'invoice_cancelled',
    'customer_payment',
    'partner_payment',
    'expense',
    'adjustment',
  ]).optional(),
  sourceType: z.enum(['invoice', 'payment', 'expense']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type AccountInput = z.infer<typeof accountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type SearchJournalEntriesInput = z.infer<typeof searchJournalEntriesSchema>;
