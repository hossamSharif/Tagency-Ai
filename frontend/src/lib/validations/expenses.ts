// Expense validation schemas
// T009 [P] Create Zod schema for expenses

import { z } from 'zod';

// Attachment schema
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number().max(10485760, 'File size must be less than 10MB'),
  uploadedAt: z.date(),
});

// Expense schema
export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['rent', 'utilities', 'supplies', 'travel', 'marketing', 'salary', 'other']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'SAR', 'EUR', 'SDG', 'AED', 'EGP', 'GBP']),
  paymentMethod: z.enum(['cash', 'bank']),
  accountId: z.string().min(1, 'Payment account is required'),
  accountName: z.string().min(1, 'Account name is required'),
  expenseAccountId: z.string().min(1, 'Expense account is required'),
  expenseAccountName: z.string().min(1, 'Expense account name is required'),
  expenseDate: z.date(),
  vendorName: z.string().max(100, 'Vendor name must be less than 100 characters').optional(),
  vendorInvoiceNumber: z.string().max(50, 'Vendor invoice number must be less than 50 characters').optional(),
  attachments: z.array(attachmentSchema).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Update expense schema
export const updateExpenseSchema = expenseSchema.partial().omit({
  // Cannot change these fields after creation
  accountId: true,
  accountName: true,
  expenseAccountId: true,
  expenseAccountName: true,
});

// Search expenses schema
export const searchExpensesSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['rent', 'utilities', 'supplies', 'travel', 'marketing', 'salary', 'other']).optional(),
  accountId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type SearchExpensesInput = z.infer<typeof searchExpensesSchema>;
export type AttachmentInput = z.infer<typeof attachmentSchema>;
