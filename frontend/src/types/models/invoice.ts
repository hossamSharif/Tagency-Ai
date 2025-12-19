// Invoice type definition per data-model.md
// T124 [US3] Create Invoice type definition

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled' | 'overdue';

export interface InvoiceLineItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;

  // Outsourcing
  isOutsourced: boolean;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  commissionPercentage?: number;
  commissionAmount?: number; // Calculated: total * (commission / 100)
}

export interface CommissionSummary {
  partnerOfficeId: string;
  partnerOfficeName: string;
  totalAmount: number;
  status: 'pending' | 'settled';
  settlementId?: string;
}

export interface Invoice {
  // Identity
  id: string;
  invoiceNumber: string; // e.g., "INV-2024-0001"

  // References
  bookingId: string;
  customerId: string;

  // Customer info snapshot
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number; // Before any adjustments
  discount: number; // Total discounts
  discountPercentage?: number; // Optional discount percentage
  tax: number; // If applicable
  taxPercentage?: number; // Optional tax percentage
  total: number; // Final amount
  currency: CurrencyCode;

  // Commission Summary
  totalCommissions: number; // Sum of partner commissions
  commissionsByPartner: CommissionSummary[];

  // Status
  status: InvoiceStatus;
  paidAmount: number;
  balance: number;

  // Dates
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;

  // Metadata
  notes?: string;
  terms?: string; // Payment terms
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating new invoices
export type CreateInvoiceInput = Omit<
  Invoice,
  'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'balance' | 'paidDate'
>;

// Helper type for updating invoices
export type UpdateInvoiceInput = Partial<
  Pick<Invoice, 'discount' | 'discountPercentage' | 'tax' | 'taxPercentage' | 'notes' | 'terms' | 'dueDate'>
>;
