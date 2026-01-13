// Invoice type definition per data-model.md
// T124 [US3] Create Invoice type definition
// T005 [P] Extended with beneficiary, version, lineItems for service-based invoicing

import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';
import { ServiceType } from './service-catalog';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled' | 'overdue';

export type BeneficiaryRelationship = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export interface Beneficiary {
  name: string;
  idNumber?: string;
  phone?: string;
  relationship: BeneficiaryRelationship;
  passportImageUrl?: string; // Optional passport/photo image URL
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
}

export interface InvoiceLineItem {
  id: string;

  // Service Reference
  serviceCatalogId: string;
  serviceName: string;
  serviceNameAr: string;
  serviceType: ServiceType;

  // Legacy support (for existing bookings)
  serviceId?: string;
  description?: string;

  // Pricing
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;

  // Outsourcing
  isOutsourced: boolean;
  partnerId?: string;
  partnerName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;

  // Legacy support
  partnerOfficeId?: string;
  partnerOfficeName?: string;

  // Beneficiary (optional per line)
  beneficiary?: Beneficiary;

  // Additional
  comments?: string;
  attachments?: Attachment[];

  // Display order
  displayOrder: number;
}

export interface CommissionSummary {
  partnerId: string;
  partnerName: string;
  amount: number;
  status: 'pending' | 'settled';
  settlementId?: string;

  // Legacy support
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  totalAmount?: number;
}

export interface Invoice {
  // Identity
  id: string;
  invoiceNumber: string;

  // References
  bookingId?: string; // Optional for service-based invoices
  customerId: string;

  // Customer info snapshot
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  discount: number;
  discountPercentage?: number;
  tax?: number;
  taxPercentage?: number;
  total: number;
  currency: CurrencyCode;

  // Commission Summary
  totalCommissions: number;
  commissionsByPartner: CommissionSummary[];

  // Status
  status: InvoiceStatus;
  paidAmount: number;
  balance: number;

  // Dates
  invoiceDate: Timestamp;
  issueDate?: Timestamp;
  dueDate?: Timestamp;
  paidDate?: Timestamp;

  // Cancellation
  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;

  // Attachments (invoice-level)
  attachments?: Attachment[];

  // Metadata
  notes?: string;
  terms?: string;

  // Optimistic Locking
  version: number;

  // Accounting Reference
  journalEntryId?: string;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating new invoices
export type CreateInvoiceInput = Omit<
  Invoice,
  'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'balance' | 'paidDate' | 'version' | 'journalEntryId'
>;

// Helper type for updating invoices
export type UpdateInvoiceInput = Partial<
  Omit<Invoice, 'id' | 'invoiceNumber' | 'customerId' | 'version' | 'journalEntryId' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;
