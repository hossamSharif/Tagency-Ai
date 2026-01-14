# Quickstart Guide: Service-Based Invoice & Accounting System

**Feature Branch**: `001-service-invoice-accounting`
**Date**: 2025-12-22

## Prerequisites

Before implementing this feature, ensure:

1. **Branch Setup**: You're on the `001-service-invoice-accounting` branch
2. **Firebase**: Firebase emulators are running (`firebase emulators:start`)
3. **Dependencies**: All npm dependencies are installed (`npm install` in frontend/)
4. **Auth**: You can log in to a test workspace

## Implementation Order

Follow this order to maintain dependencies:

```
Phase 1: Data Foundation
├── 1.1 Type definitions (models)
├── 1.2 Service Catalog CRUD
└── 1.3 Chart of Accounts setup

Phase 2: Core Invoicing
├── 2.1 Invoice form with line items
├── 2.2 Beneficiary support
├── 2.3 Document attachments
└── 2.4 Invoice CRUD actions

Phase 3: Accounting Engine
├── 3.1 Journal entry creation
├── 3.2 Balance calculations
└── 3.3 Account auto-creation (customer/partner)

Phase 4: Payments
├── 4.1 Customer payment recording
├── 4.2 Partner payment recording
└── 4.3 Balance updates

Phase 5: Reporting
├── 5.1 Account statements
├── 5.2 Journal view
└── 5.3 PDF export

Phase 6: Business Expenses
├── 6.1 Expense recording
└── 6.2 Expense categories

Phase 7: UX Enhancements
├── 7.1 Quick-add modals
├── 7.2 Invoice cancellation
└── 7.3 Optimistic locking UI
```

## Quick Code Patterns

### 1. Creating a New Type Definition

```typescript
// frontend/src/types/models/service-catalog.ts
import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

export type ServiceType = 'visa' | 'ticket' | 'hotel' | 'insurance' | 'other';
export type ProviderType = 'office' | 'partner';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: CurrencyCode;
  type: ServiceType;
  providerType: ProviderType;
  defaultPartnerId?: string;
  commissionPercentage?: number;
  isActive: boolean;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. Creating a Server Action

```typescript
// frontend/src/app/actions/services-catalog.ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getCurrentUser } from '@/lib/firebase/auth';
import { revalidatePath } from 'next/cache';

export async function createServiceCatalogItem(data: CreateServiceInput) {
  const user = await getCurrentUser();
  if (!user?.tenantId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const docRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('serviceCatalog')
      .doc();

    const item = {
      ...data,
      id: docRef.id,
      isActive: true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(item);
    revalidatePath('/[locale]/(dashboard)/services');

    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Failed to create service' };
  }
}
```

### 3. Creating a Journal Entry (Double-Entry)

```typescript
// frontend/src/lib/accounting/journal-entries.ts
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface JournalLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
}

export async function createJournalEntry(
  tenantId: string,
  data: {
    description: string;
    type: JournalEntryType;
    lines: JournalLine[];
    sourceType: 'invoice' | 'payment' | 'expense';
    sourceId: string;
  },
  createdBy: string
) {
  // Validate balanced entry
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Journal entry must be balanced');
  }

  // Generate entry number
  const entryNumber = await generateNumber(tenantId, 'journalEntries', 'JE');

  const entry = {
    id: '', // Will be set after creation
    entryNumber,
    date: new Date(),
    description: data.description,
    type: data.type,
    lines: data.lines,
    totalDebit,
    totalCredit,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    isReversal: false,
    createdBy,
    createdAt: new Date(),
  };

  const batch = adminDb.batch();

  // Create journal entry
  const entryRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('journalEntries')
    .doc();

  entry.id = entryRef.id;
  batch.set(entryRef, entry);

  // Update account balances
  for (const line of data.lines) {
    const accountRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('accounts')
      .doc(line.accountId);

    const balanceChange = line.debit - line.credit;
    batch.update(accountRef, {
      balance: FieldValue.increment(balanceChange),
      lastUpdated: new Date(),
    });
  }

  await batch.commit();
  return entry;
}
```

### 4. Invoice Form Component Pattern

```tsx
// frontend/src/components/features/invoices/invoice-form.tsx
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/lib/validations/invoices';

export function InvoiceForm({ customers, services, partners }) {
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      lineItems: [{ serviceCatalogId: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  // Calculate totals
  const lineItems = form.watch('lineItems');
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
    0
  );
  const discount = form.watch('discount') || 0;
  const total = subtotal - discount;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Customer Selection with Quick-Add */}
        <CustomerSelect
          customers={customers}
          onQuickAdd={() => setShowCustomerModal(true)}
        />

        {/* Line Items */}
        {fields.map((field, index) => (
          <ServiceLineItem
            key={field.id}
            index={index}
            services={services}
            partners={partners}
            onRemove={() => remove(index)}
          />
        ))}

        <Button type="button" onClick={() => append(defaultLineItem)}>
          Add Service
        </Button>

        {/* Totals */}
        <div className="space-y-2">
          <div>Subtotal: {formatCurrency(subtotal)}</div>
          <div>Discount: {formatCurrency(discount)}</div>
          <div className="font-bold">Total: {formatCurrency(total)}</div>
        </div>

        <Button type="submit">Save Invoice</Button>
      </form>
    </Form>
  );
}
```

### 5. Quick-Add Modal Pattern

```tsx
// frontend/src/components/features/invoices/quick-add-modals/customer-modal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { quickAddCustomer } from '@/app/actions/customers';

export function QuickAddCustomerModal({ open, onOpenChange, onCustomerCreated }) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(data: QuickAddCustomerData) {
    startTransition(async () => {
      const result = await quickAddCustomer(data);
      if (result.success) {
        onCustomerCreated(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <QuickCustomerForm onSubmit={handleSubmit} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}
```

### 6. Optimistic Locking Error Handling

```tsx
// In update action
async function updateInvoice(invoiceId: string, version: number, data: UpdateData) {
  // ... inside transaction
  const currentVersion = docSnap.data()?.version;
  if (currentVersion !== version) {
    return {
      success: false,
      error: 'VERSION_CONFLICT',
      message: 'This invoice was modified by another user. Please reload.',
    };
  }
  // ... proceed with update
}

// In component
function InvoiceEditForm({ invoice }) {
  const [currentVersion, setCurrentVersion] = useState(invoice.version);

  async function handleSubmit(data) {
    const result = await updateInvoice(invoice.id, currentVersion, data);

    if (!result.success && result.error === 'VERSION_CONFLICT') {
      toast.error(result.message, {
        action: {
          label: 'Reload',
          onClick: () => router.refresh(),
        },
      });
      return;
    }

    // Update local version on success
    if (result.success) {
      setCurrentVersion(result.data.version);
    }
  }
}
```

## File Creation Checklist

### Types (Phase 1.1)

- [ ] `frontend/src/types/models/service-catalog.ts`
- [ ] `frontend/src/types/models/account.ts`
- [ ] `frontend/src/types/models/journal-entry.ts`
- [ ] `frontend/src/types/models/expense.ts`
- [ ] Update `frontend/src/types/models/invoice.ts` (add beneficiary, version)
- [ ] Update `frontend/src/types/models/payment.ts` (add partner payment fields)

### Server Actions

- [ ] `frontend/src/app/actions/services-catalog.ts`
- [ ] `frontend/src/app/actions/accounting.ts`
- [ ] `frontend/src/app/actions/expenses.ts`
- [ ] `frontend/src/app/actions/statements.ts`
- [ ] Update `frontend/src/app/actions/invoices.ts`
- [ ] Update `frontend/src/app/actions/payments.ts`

### Lib Utilities

- [ ] `frontend/src/lib/accounting/journal-entries.ts`
- [ ] `frontend/src/lib/accounting/balance-calculator.ts`
- [ ] `frontend/src/lib/pdf/statement-template.tsx`
- [ ] `frontend/src/lib/validations/services-catalog.ts`
- [ ] `frontend/src/lib/validations/accounting.ts`
- [ ] `frontend/src/lib/validations/expenses.ts`

### Pages

- [ ] `frontend/src/app/[locale]/(dashboard)/services/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/services/[serviceId]/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/invoices/new/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/accounting/accounts/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/accounting/journal/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/accounting/expenses/page.tsx`
- [ ] `frontend/src/app/[locale]/(dashboard)/statements/page.tsx`

### Components

- [ ] `frontend/src/components/features/invoices/invoice-form.tsx`
- [ ] `frontend/src/components/features/invoices/service-line-item.tsx`
- [ ] `frontend/src/components/features/invoices/beneficiary-form.tsx`
- [ ] `frontend/src/components/features/invoices/quick-add-modals/`
- [ ] `frontend/src/components/features/services/service-form.tsx`
- [ ] `frontend/src/components/features/services/service-list.tsx`
- [ ] `frontend/src/components/features/accounting/account-list.tsx`
- [ ] `frontend/src/components/features/accounting/journal-table.tsx`
- [ ] `frontend/src/components/features/expenses/expense-form.tsx`
- [ ] `frontend/src/components/features/statements/statement-view.tsx`

## Testing Checklist

Use Chrome MCP for E2E testing:

1. **Service Catalog**
   - [ ] Create a new service
   - [ ] Edit service price
   - [ ] Verify service appears in invoice form dropdown

2. **Invoice Creation**
   - [ ] Create invoice with 3+ services
   - [ ] Add beneficiary to a service
   - [ ] Attach document to invoice
   - [ ] Verify total calculation

3. **Payments**
   - [ ] Record customer payment
   - [ ] Verify invoice status updates
   - [ ] Record partner payment
   - [ ] Verify commission calculation

4. **Accounting**
   - [ ] Verify journal entries created
   - [ ] Check account balances
   - [ ] Generate customer statement
   - [ ] Export statement as PDF

5. **Edge Cases**
   - [ ] Concurrent edit conflict
   - [ ] Cancel invoice with payments
   - [ ] Delete service in use (should fail)

## Common Issues & Solutions

### Issue: Journal entry not balanced
**Solution**: Check that all lines have either debit or credit (not both), and totals match.

### Issue: Version conflict on save
**Solution**: Refresh the page to get latest data, then re-apply changes.

### Issue: PDF not generating
**Solution**: Ensure @react-pdf/renderer components don't use browser-only APIs. Use dynamic import with `ssr: false` for PDF viewer.

### Issue: Account balance incorrect
**Solution**: Run `recalculateAccountBalances()` admin action to recalculate from journal entries.
