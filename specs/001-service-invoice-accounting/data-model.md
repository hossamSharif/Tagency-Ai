# Data Model: Service-Based Invoice & Accounting System

**Feature Branch**: `001-service-invoice-accounting`
**Date**: 2025-12-22

## Overview

This document defines the data models for the service-based invoice and accounting system. All entities are stored in Firebase Firestore under the multi-tenant structure: `tenants/{tenantId}/...`

## Entities

### 1. ServiceCatalogItem

Predefined services that can be added to invoices.

**Collection**: `tenants/{tenantId}/serviceCatalog/{serviceId}`

```typescript
type ServiceType = 'visa' | 'ticket' | 'hotel' | 'insurance' | 'other';
type ProviderType = 'office' | 'partner';

interface ServiceCatalogItem {
  // Identity
  id: string;

  // Basic Info
  name: string;           // English name
  nameAr: string;         // Arabic name
  description?: string;

  // Pricing
  price: number;          // Default price
  currency: CurrencyCode; // From tenant settings

  // Classification
  type: ServiceType;

  // Provider
  providerType: ProviderType;
  defaultPartnerId?: string;      // If partner-provided
  defaultPartnerName?: string;    // Denormalized for display
  commissionPercentage?: number;  // Required if providerType === 'partner'

  // Status
  isActive: boolean;
  usageCount: number;     // Track usage for soft-delete protection

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `isActive` + `type` (for filtered listings)
- `isActive` + `name` (for search)

---

### 2. Invoice (Enhanced)

Service-based invoice with beneficiary support.

**Collection**: `tenants/{tenantId}/invoices/{invoiceId}`

```typescript
type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled';
type BeneficiaryRelationship = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

interface Beneficiary {
  name: string;
  idNumber?: string;
  phone?: string;
  relationship: BeneficiaryRelationship;
}

interface Attachment {
  id: string;
  name: string;
  url: string;           // Firebase Storage URL
  type: string;          // MIME type
  size: number;          // Bytes
  uploadedAt: Timestamp;
}

interface InvoiceLineItem {
  id: string;

  // Service Reference
  serviceCatalogId: string;
  serviceName: string;         // Snapshot at time of creation
  serviceNameAr: string;
  serviceType: ServiceType;

  // Pricing
  quantity: number;
  unitPrice: number;           // Snapshot at time of creation
  discount: number;            // Line-level discount
  total: number;               // (quantity * unitPrice) - discount

  // Partner/Commission
  isOutsourced: boolean;
  partnerId?: string;
  partnerName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;   // total * (commission / 100)

  // Beneficiary (optional per line)
  beneficiary?: Beneficiary;

  // Additional
  comments?: string;
  attachments?: Attachment[];

  // Display order
  displayOrder: number;
}

interface Invoice {
  // Identity
  id: string;
  invoiceNumber: string;       // e.g., "INV-2024-0001"

  // Customer
  customerId: string;
  customerName: string;        // Snapshot
  customerEmail: string;
  customerPhone: string;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;            // Sum of line item totals
  discount: number;            // Invoice-level discount
  discountPercentage?: number;
  total: number;               // subtotal - discount
  currency: CurrencyCode;

  // Commission Summary
  totalCommissions: number;
  commissionsByPartner: {
    partnerId: string;
    partnerName: string;
    amount: number;
    status: 'pending' | 'settled';
    settlementId?: string;
  }[];

  // Payment Status
  status: InvoiceStatus;
  paidAmount: number;
  balance: number;             // total - paidAmount

  // Dates
  invoiceDate: Timestamp;
  dueDate?: Timestamp;
  paidDate?: Timestamp;

  // Cancellation
  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;

  // Attachments (invoice-level)
  attachments?: Attachment[];

  // Notes
  notes?: string;

  // Optimistic Locking
  version: number;

  // Accounting Reference
  journalEntryId?: string;     // Link to journal entry

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `customerId` + `createdAt` (customer invoices)
- `status` + `createdAt` (status filtering)
- `invoiceDate` range queries

---

### 3. Account (Chart of Accounts)

Financial accounts for double-entry accounting.

**Collection**: `tenants/{tenantId}/accounts/{accountId}`

```typescript
type AccountType = 'asset' | 'liability' | 'income' | 'expense';
type AccountSubtype =
  | 'cash'
  | 'bank'
  | 'receivable'
  | 'payable'
  | 'revenue'
  | 'expense_general'
  | 'expense_rent'
  | 'expense_utilities'
  | 'expense_supplies'
  | 'expense_other';

interface Account {
  // Identity
  id: string;
  code: string;                // Account code (e.g., "1001", "2001")

  // Basic Info
  name: string;
  nameAr: string;
  description?: string;

  // Classification
  type: AccountType;
  subtype: AccountSubtype;

  // Linked Entity (for auto-created accounts)
  linkedEntityType?: 'customer' | 'partner';
  linkedEntityId?: string;

  // Balance (denormalized for quick access)
  balance: number;             // Calculated from journal entries
  lastUpdated: Timestamp;

  // Status
  isSystem: boolean;           // System-created (cannot delete)
  isActive: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Default System Accounts** (created on workspace setup):
| Code | Name | Type | Subtype |
|------|------|------|---------|
| 1001 | Cash | asset | cash |
| 1002 | Bank | asset | bank |
| 4001 | Service Revenue | income | revenue |
| 5001 | General Expenses | expense | expense_general |
| 5002 | Rent | expense | expense_rent |
| 5003 | Utilities | expense | expense_utilities |
| 5004 | Supplies | expense | expense_supplies |

---

### 4. JournalEntry

Double-entry accounting journal entries.

**Collection**: `tenants/{tenantId}/journalEntries/{entryId}`

```typescript
type JournalEntryType =
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_cancelled'
  | 'customer_payment'
  | 'partner_payment'
  | 'expense'
  | 'adjustment';

interface JournalEntryLine {
  accountId: string;
  accountName: string;         // Denormalized
  accountCode: string;
  debit: number;               // Always positive or 0
  credit: number;              // Always positive or 0
}

interface JournalEntry {
  // Identity
  id: string;
  entryNumber: string;         // e.g., "JE-2024-0001"

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
```

**Validation Rule**: `totalDebit === totalCredit` (enforced in application logic)

---

### 5. Payment (Enhanced)

Extended to support partner payments.

**Collection**: `tenants/{tenantId}/payments/{paymentId}`

```typescript
type PaymentType = 'customer_receipt' | 'partner_payment';
type PaymentMethod = 'cash' | 'bank';
type PaymentStatus = 'completed' | 'pending' | 'cancelled';

interface Payment {
  // Identity
  id: string;
  paymentNumber: string;       // e.g., "PAY-2024-0001"

  // Payment Type
  paymentType: PaymentType;

  // Parties
  // For customer_receipt:
  customerId?: string;
  customerName?: string;
  invoiceId?: string;

  // For partner_payment:
  partnerId?: string;
  partnerName?: string;
  invoiceIds?: string[];       // Invoices being settled

  // Amount
  amount: number;
  currency: CurrencyCode;

  // For partner payments: commission breakdown
  grossAmount?: number;        // Total owed before commission
  commissionAmount?: number;   // Office's commission
  netAmount?: number;          // Amount actually paid

  // Method
  method: PaymentMethod;
  accountId: string;           // Cash or Bank account used
  accountName: string;

  // Reference
  transactionReference?: string;

  // Status
  status: PaymentStatus;

  // Dates
  paymentDate: Timestamp;

  // Attachments (receipts, proofs)
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
```

---

### 6. Expense

Business expense records.

**Collection**: `tenants/{tenantId}/expenses/{expenseId}`

```typescript
type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'travel'
  | 'marketing'
  | 'salary'
  | 'other';

interface Expense {
  // Identity
  id: string;
  expenseNumber: string;       // e.g., "EXP-2024-0001"

  // Details
  description: string;
  category: ExpenseCategory;

  // Amount
  amount: number;
  currency: CurrencyCode;

  // Payment
  paymentMethod: PaymentMethod;
  accountId: string;           // Cash or Bank account
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
```

---

### 7. Counter

Sequential number generators.

**Collection**: `tenants/{tenantId}/counters/{counterType}`

```typescript
interface Counter {
  year: number;
  sequence: number;
}
```

**Counter Types**:
- `invoices`
- `payments`
- `expenses`
- `journalEntries`

---

## Entity Relationships

```
┌──────────────────┐
│ ServiceCatalog   │
│ Item             │
└────────┬─────────┘
         │ referenced by
         ▼
┌──────────────────┐       ┌──────────────────┐
│ Invoice          │◄──────│ Customer         │
│ (lineItems)      │       │ (existing)       │
└────────┬─────────┘       └──────────────────┘
         │
         │ creates
         ▼
┌──────────────────┐       ┌──────────────────┐
│ JournalEntry     │◄──────│ Account          │
│ (lines)          │       │ (chart)          │
└────────▲─────────┘       └──────────────────┘
         │
         │ creates
┌────────┴─────────┐       ┌──────────────────┐
│ Payment          │──────►│ Partner          │
│                  │       │ (existing)       │
└──────────────────┘       └──────────────────┘
         │
         │ creates
         ▼
┌──────────────────┐
│ Expense          │
└──────────────────┘
```

---

## State Transitions

### Invoice Status

```
     ┌─────────┐
     │  draft  │
     └────┬────┘
          │ issue
          ▼
     ┌─────────┐      payment      ┌─────────┐
     │ issued  │─────────────────► │ partial │
     └────┬────┘                   └────┬────┘
          │ full payment                │ full payment
          │                             │
          ▼                             ▼
     ┌─────────┐                   ┌─────────┐
     │  paid   │                   │  paid   │
     └─────────┘                   └─────────┘

     Any status (except paid) ──cancel──► cancelled
```

### Account Balance Updates

| Event | Account | Debit | Credit |
|-------|---------|-------|--------|
| Invoice Created | Customer Account | +total | |
| Invoice Created | Revenue Account | | +total |
| Customer Payment | Cash/Bank | +amount | |
| Customer Payment | Customer Account | | +amount |
| Partner Payment | Partner Account | +amount | |
| Partner Payment | Cash/Bank | | +amount |
| Expense | Expense Account | +amount | |
| Expense | Cash/Bank | | +amount |
| Invoice Cancelled | Revenue Account | +total | |
| Invoice Cancelled | Customer Account | | +total |

---

## Validation Rules

### ServiceCatalogItem
- `name` required, max 100 chars
- `price` >= 0
- `commissionPercentage` required if `providerType === 'partner'`
- `commissionPercentage` between 0 and 100

### Invoice
- At least one line item required
- `lineItems[].quantity` >= 1
- `lineItems[].unitPrice` >= 0
- Customer must exist
- `discount` <= `subtotal`

### JournalEntry
- `totalDebit === totalCredit` (balanced entry)
- At least 2 lines required
- Each line must have either debit > 0 or credit > 0, not both

### Payment
- `amount` > 0
- For `customer_receipt`: `customerId` required
- For `partner_payment`: `partnerId` required
- Account must exist and be active

### Expense
- `amount` > 0
- `category` required
- `expenseAccountId` must reference valid expense account
