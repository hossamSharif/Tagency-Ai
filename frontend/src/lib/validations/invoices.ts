// Invoice validation schemas
// T126 [US3] Create invoice validation schemas
// T010 Extended for service-based invoicing with beneficiaries

import { z } from 'zod';

// Beneficiary schema
export const beneficiarySchema = z.object({
  name: z.string().min(1, 'Beneficiary name is required').max(100, 'Name must be less than 100 characters'),
  idNumber: z.string().max(50, 'ID number must be less than 50 characters').optional(),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
  relationship: z.enum(['self', 'spouse', 'child', 'parent', 'sibling', 'other']),
});

// Attachment schema
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number().max(10485760, 'File size must be less than 10MB'),
  uploadedAt: z.date(),
});

// Invoice line item schema (enhanced for service-based invoicing)
export const invoiceLineItemSchema = z.object({
  id: z.string(),
  // Service Reference
  serviceCatalogId: z.string().min(1, 'Service is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  serviceNameAr: z.string().min(1, 'Arabic service name is required'),
  serviceType: z.enum(['visa', 'ticket', 'hotel', 'insurance', 'other']),
  // Legacy support
  serviceId: z.string().optional(),
  description: z.string().optional(),
  // Pricing
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  total: z.number(),
  // Outsourcing
  isOutsourced: z.boolean().default(false),
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().optional(),
  // Legacy support
  partnerOfficeId: z.string().optional(),
  partnerOfficeName: z.string().optional(),
  // Beneficiary
  beneficiary: beneficiarySchema.optional(),
  // Additional
  comments: z.string().max(500, 'Comments must be less than 500 characters').optional(),
  attachments: z.array(attachmentSchema).optional(),
  displayOrder: z.number(),
});

// Create service-based invoice schema
export const createServiceInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one service is required'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  discountPercentage: z.number().min(0).max(100).optional(),
  tax: z.number().min(0, 'Tax must be non-negative').default(0),
  taxPercentage: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  terms: z.string().max(500, 'Terms must be less than 500 characters').optional(),
}).refine(
  (data) => {
    // Validate that discount is not greater than subtotal
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
    return data.discount <= subtotal;
  },
  {
    message: 'Discount cannot be greater than subtotal',
    path: ['discount'],
  }
);

// Generate invoice from booking schema (legacy)
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

// Edit issued invoice schema (for editing at any status with accounting adjustments)
export const editIssuedInvoiceSchema = z.object({
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one service is required'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  discountPercentage: z.number().min(0).max(100).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  attachments: z.array(attachmentSchema).optional(),
  // Optimistic locking
  version: z.number().min(1, 'Version is required for concurrency control'),
  // Context for validation (not stored)
  _validationContext: z.object({
    status: z.enum(['draft', 'issued', 'partial', 'paid', 'cancelled', 'overdue']),
    paidAmount: z.number().default(0),
  }).optional(),
}).refine(
  (data) => {
    // Validate that discount is not greater than subtotal
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
    return data.discount <= subtotal;
  },
  {
    message: 'Discount cannot be greater than subtotal',
    path: ['discount'],
  }
).refine(
  (data) => {
    // For partial invoices, new total cannot be less than paidAmount
    if (data._validationContext?.status === 'partial') {
      const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
      const newTotal = subtotal - data.discount;
      return newTotal >= data._validationContext.paidAmount;
    }
    return true;
  },
  {
    message: 'Cannot reduce total below already paid amount',
    path: ['lineItems'],
  }
);

// Commission summary for line items
export const commissionSummarySchema = z.object({
  partnerId: z.string(),
  partnerName: z.string(),
  amount: z.number(),
  status: z.enum(['pending', 'settled']),
  // Legacy support
  partnerOfficeId: z.string().optional(),
  partnerOfficeName: z.string().optional(),
  totalAmount: z.number().optional(),
});

// Type exports
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
export type AttachmentInput = z.infer<typeof attachmentSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type CreateServiceInvoiceInput = z.infer<typeof createServiceInvoiceSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type SearchInvoicesInput = z.infer<typeof searchInvoicesSchema>;
export type EditIssuedInvoiceInput = z.infer<typeof editIssuedInvoiceSchema>;
export type CommissionSummaryInput = z.infer<typeof commissionSummarySchema>;
