# Server Actions Contract: Service-Based Invoice & Accounting System

**Feature Branch**: `001-service-invoice-accounting`
**Date**: 2025-12-22

## Overview

This document defines the server action contracts for the service-based invoice and accounting system. All actions are implemented as Next.js Server Actions using the existing pattern in `frontend/src/app/actions/`.

## Common Types

```typescript
// Return type for all server actions
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
interface PaginationParams {
  limit?: number;       // Default: 20, Max: 100
  startAfter?: string;  // Document ID for cursor pagination
}

interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastId?: string;
}

// Date range filter
interface DateRange {
  start: Date;
  end: Date;
}
```

---

## Service Catalog Actions

**File**: `frontend/src/app/actions/services-catalog.ts`

### getServiceCatalog

List all services in the catalog.

```typescript
async function getServiceCatalog(
  params?: {
    type?: ServiceType;
    isActive?: boolean;
    search?: string;
  } & PaginationParams
): Promise<ActionResult<PaginatedResult<ServiceCatalogItem>>>
```

### getServiceCatalogItem

Get a single service by ID.

```typescript
async function getServiceCatalogItem(
  serviceId: string
): Promise<ActionResult<ServiceCatalogItem>>
```

### createServiceCatalogItem

Create a new service in the catalog.

```typescript
async function createServiceCatalogItem(
  data: {
    name: string;
    nameAr: string;
    description?: string;
    price: number;
    type: ServiceType;
    providerType: ProviderType;
    defaultPartnerId?: string;
    commissionPercentage?: number;
  }
): Promise<ActionResult<ServiceCatalogItem>>
```

### updateServiceCatalogItem

Update an existing service.

```typescript
async function updateServiceCatalogItem(
  serviceId: string,
  data: Partial<{
    name: string;
    nameAr: string;
    description: string;
    price: number;
    type: ServiceType;
    providerType: ProviderType;
    defaultPartnerId: string;
    commissionPercentage: number;
    isActive: boolean;
  }>
): Promise<ActionResult<ServiceCatalogItem>>
```

### deleteServiceCatalogItem

Delete a service (fails if in use).

```typescript
async function deleteServiceCatalogItem(
  serviceId: string
): Promise<ActionResult<void>>
// Error if usageCount > 0
```

---

## Invoice Actions

**File**: `frontend/src/app/actions/invoices.ts` (extend existing)

### getInvoices

List invoices with filters.

```typescript
async function getInvoices(
  params?: {
    customerId?: string;
    status?: InvoiceStatus | InvoiceStatus[];
    dateRange?: DateRange;
    search?: string;  // Invoice number or customer name
  } & PaginationParams
): Promise<ActionResult<PaginatedResult<Invoice>>>
```

### getInvoice

Get a single invoice by ID.

```typescript
async function getInvoice(
  invoiceId: string
): Promise<ActionResult<Invoice>>
```

### createInvoice

Create a new service-based invoice.

```typescript
async function createInvoice(
  data: {
    customerId: string;
    invoiceDate: Date;
    dueDate?: Date;
    lineItems: {
      serviceCatalogId: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      isOutsourced: boolean;
      partnerId?: string;
      commissionPercentage?: number;
      beneficiary?: Beneficiary;
      comments?: string;
    }[];
    discount?: number;
    discountPercentage?: number;
    notes?: string;
    attachments?: { name: string; url: string; type: string; size: number }[];
    status?: 'draft' | 'issued';  // Default: 'draft'
  }
): Promise<ActionResult<Invoice>>
// Creates journal entry if status === 'issued'
```

### updateInvoice

Update an existing invoice (with optimistic locking).

```typescript
async function updateInvoice(
  invoiceId: string,
  version: number,  // For optimistic locking
  data: Partial<{
    dueDate: Date;
    lineItems: InvoiceLineItem[];
    discount: number;
    discountPercentage: number;
    notes: string;
    attachments: Attachment[];
  }>
): Promise<ActionResult<Invoice>>
// Error if version mismatch
// Creates adjustment journal entry if amounts changed
```

### issueInvoice

Change invoice status from draft to issued.

```typescript
async function issueInvoice(
  invoiceId: string,
  version: number
): Promise<ActionResult<Invoice>>
// Creates journal entry
```

### cancelInvoice

Cancel an invoice.

```typescript
async function cancelInvoice(
  invoiceId: string,
  version: number,
  reason: string
): Promise<ActionResult<Invoice>>
// Creates reversal journal entry
// Adjusts customer balance
```

### addInvoiceAttachment

Add attachment to an invoice.

```typescript
async function addInvoiceAttachment(
  invoiceId: string,
  attachment: { name: string; url: string; type: string; size: number }
): Promise<ActionResult<Invoice>>
```

### removeInvoiceAttachment

Remove attachment from an invoice.

```typescript
async function removeInvoiceAttachment(
  invoiceId: string,
  attachmentId: string
): Promise<ActionResult<Invoice>>
```

---

## Payment Actions

**File**: `frontend/src/app/actions/payments.ts` (extend existing)

### getPayments

List payments with filters.

```typescript
async function getPayments(
  params?: {
    paymentType?: PaymentType;
    customerId?: string;
    partnerId?: string;
    invoiceId?: string;
    dateRange?: DateRange;
    method?: PaymentMethod;
  } & PaginationParams
): Promise<ActionResult<PaginatedResult<Payment>>>
```

### getPayment

Get a single payment by ID.

```typescript
async function getPayment(
  paymentId: string
): Promise<ActionResult<Payment>>
```

### recordCustomerPayment

Record a payment received from a customer.

```typescript
async function recordCustomerPayment(
  data: {
    customerId: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    accountId: string;  // Cash or Bank account
    paymentDate: Date;
    transactionReference?: string;
    notes?: string;
    attachments?: { name: string; url: string; type: string; size: number }[];
  }
): Promise<ActionResult<Payment>>
// Updates invoice status (partial/paid)
// Creates journal entry
// Updates account balances
```

### recordPartnerPayment

Record a payment made to a partner.

```typescript
async function recordPartnerPayment(
  data: {
    partnerId: string;
    invoiceIds: string[];  // Invoices being settled
    grossAmount: number;   // Total owed
    commissionAmount: number;  // Office's cut
    netAmount: number;     // Amount paid
    method: PaymentMethod;
    accountId: string;
    paymentDate: Date;
    transactionReference?: string;
    notes?: string;
    attachments?: { name: string; url: string; type: string; size: number }[];
  }
): Promise<ActionResult<Payment>>
// Updates invoice commission status
// Creates journal entry
// Updates account balances
```

### getCustomerBalance

Get customer's current balance.

```typescript
async function getCustomerBalance(
  customerId: string
): Promise<ActionResult<{ balance: number; currency: CurrencyCode }>>
```

### getPartnerBalance

Get partner's outstanding amount.

```typescript
async function getPartnerBalance(
  partnerId: string
): Promise<ActionResult<{
  totalOwed: number;
  totalPaid: number;
  pendingAmount: number;
  currency: CurrencyCode;
}>>
```

---

## Accounting Actions

**File**: `frontend/src/app/actions/accounting.ts` (new)

### getAccounts

Get chart of accounts.

```typescript
async function getAccounts(
  params?: {
    type?: AccountType;
    subtype?: AccountSubtype;
    isActive?: boolean;
  }
): Promise<ActionResult<Account[]>>
```

### getAccount

Get a single account by ID.

```typescript
async function getAccount(
  accountId: string
): Promise<ActionResult<Account>>
```

### createAccount

Create a custom account.

```typescript
async function createAccount(
  data: {
    code: string;
    name: string;
    nameAr: string;
    description?: string;
    type: AccountType;
    subtype: AccountSubtype;
  }
): Promise<ActionResult<Account>>
```

### updateAccount

Update an account.

```typescript
async function updateAccount(
  accountId: string,
  data: Partial<{
    name: string;
    nameAr: string;
    description: string;
    isActive: boolean;
  }>
): Promise<ActionResult<Account>>
// Cannot update system accounts' type/subtype
```

### getJournalEntries

Get journal entries with filters.

```typescript
async function getJournalEntries(
  params?: {
    accountId?: string;
    type?: JournalEntryType;
    dateRange?: DateRange;
    sourceType?: 'invoice' | 'payment' | 'expense';
    sourceId?: string;
  } & PaginationParams
): Promise<ActionResult<PaginatedResult<JournalEntry>>>
```

### getJournalEntry

Get a single journal entry.

```typescript
async function getJournalEntry(
  entryId: string
): Promise<ActionResult<JournalEntry>>
```

### recalculateAccountBalances

Recalculate all account balances from journal entries.

```typescript
async function recalculateAccountBalances(): Promise<ActionResult<void>>
// Admin function for reconciliation
```

---

## Expense Actions

**File**: `frontend/src/app/actions/expenses.ts` (new)

### getExpenses

List expenses with filters.

```typescript
async function getExpenses(
  params?: {
    category?: ExpenseCategory;
    dateRange?: DateRange;
    accountId?: string;
  } & PaginationParams
): Promise<ActionResult<PaginatedResult<Expense>>>
```

### getExpense

Get a single expense.

```typescript
async function getExpense(
  expenseId: string
): Promise<ActionResult<Expense>>
```

### createExpense

Record a business expense.

```typescript
async function createExpense(
  data: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod: PaymentMethod;
    accountId: string;        // Cash or Bank
    expenseAccountId: string; // Expense category account
    expenseDate: Date;
    vendorName?: string;
    vendorInvoiceNumber?: string;
    notes?: string;
    attachments?: { name: string; url: string; type: string; size: number }[];
  }
): Promise<ActionResult<Expense>>
// Creates journal entry
// Updates account balances
```

### updateExpense

Update an expense.

```typescript
async function updateExpense(
  expenseId: string,
  data: Partial<{
    description: string;
    category: ExpenseCategory;
    vendorName: string;
    notes: string;
    attachments: Attachment[];
  }>
): Promise<ActionResult<Expense>>
// Note: Amount changes not allowed (would require journal reversal)
```

### deleteExpense

Delete an expense (creates reversal).

```typescript
async function deleteExpense(
  expenseId: string
): Promise<ActionResult<void>>
// Creates reversal journal entry
```

---

## Statement Actions

**File**: `frontend/src/app/actions/statements.ts` (new)

### getCustomerStatement

Generate a customer account statement.

```typescript
async function getCustomerStatement(
  customerId: string,
  dateRange: DateRange
): Promise<ActionResult<{
  customer: { id: string; name: string; email: string };
  openingBalance: number;
  closingBalance: number;
  currency: CurrencyCode;
  transactions: {
    date: Date;
    description: string;
    reference: string;  // Invoice/Payment number
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
}>>
```

### getPartnerStatement

Generate a partner account statement.

```typescript
async function getPartnerStatement(
  partnerId: string,
  dateRange: DateRange
): Promise<ActionResult<{
  partner: { id: string; name: string };
  openingBalance: number;
  closingBalance: number;
  currency: CurrencyCode;
  transactions: {
    date: Date;
    description: string;
    reference: string;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
}>>
```

### getAccountLedger

Get ledger for any account.

```typescript
async function getAccountLedger(
  accountId: string,
  dateRange: DateRange
): Promise<ActionResult<{
  account: Account;
  openingBalance: number;
  closingBalance: number;
  entries: {
    date: Date;
    entryNumber: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
    sourceType: string;
    sourceId: string;
  }[];
}>>
```

---

## Quick-Add Actions

These are thin wrappers that call existing actions with minimal required fields.

### quickAddCustomer

```typescript
async function quickAddCustomer(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }
): Promise<ActionResult<Customer>>
```

### quickAddPartner

```typescript
async function quickAddPartner(
  data: {
    name: string;
    contactPerson: string;
    email: string;
    defaultCommissionPercentage: number;
  }
): Promise<ActionResult<PartnerOffice>>
```

### quickAddService

```typescript
async function quickAddService(
  data: {
    name: string;
    nameAr: string;
    price: number;
    type: ServiceType;
    providerType: ProviderType;
    commissionPercentage?: number;
  }
): Promise<ActionResult<ServiceCatalogItem>>
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Resource does not exist |
| `PERMISSION_DENIED` | User lacks permission |
| `VERSION_CONFLICT` | Optimistic lock failure |
| `VALIDATION_ERROR` | Input validation failed |
| `SERVICE_IN_USE` | Cannot delete service with invoices |
| `PARTNER_HAS_BALANCE` | Cannot delete partner with outstanding balance |
| `UNBALANCED_ENTRY` | Journal entry debits != credits |
| `INVALID_STATUS_TRANSITION` | Invalid invoice status change |
