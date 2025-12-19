// Invoice validation schemas
// T126 [US3] Create invoice validation schemas

import { z } from 'zod';

// Invoice line item schema
export const invoiceLineItemSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  total: z.number(),
  isOutsourced: z.boolean().default(false),
  partnerOfficeId: z.string().optional(),
  partnerOfficeName: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().optional(),
});

// Generate invoice from booking schema
export const generateInvoiceSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  dueDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid due date'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  discountPercentage: z.number().min(0).max(100).optional(),
  tax: z.number().min(0, 'Tax must be non-negative').default(0),
  taxPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  terms: z.string().max(500, 'Terms must be less than 500 characters').optional(),
});

// Update invoice schema
export const updateInvoiceSchema = z.object({
  discount: z.number().min(0, 'Discount must be non-negative').optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  tax: z.number().min(0, 'Tax must be non-negative').optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(500).optional(),
});

// Issue invoice schema
export const issueInvoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
});

// Cancel invoice schema
export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

// Search invoices schema
export const searchInvoicesSchema = z.object({
  query: z.string().optional(), // invoice number or customer name
  customerId: z.string().optional(),
  bookingId: z.string().optional(),
  status: z.enum(['draft', 'issued', 'paid', 'partial', 'cancelled', 'overdue']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type SearchInvoicesInput = z.infer<typeof searchInvoicesSchema>;
