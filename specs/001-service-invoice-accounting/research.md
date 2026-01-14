# Research: Service-Based Invoice & Accounting System

**Feature Branch**: `001-service-invoice-accounting`
**Date**: 2025-12-22

## Research Topics

### 1. PDF Generation for Invoices and Statements

**Decision**: Use @react-pdf/renderer (already in project dependencies)

**Rationale**:
- Already installed in package.json (`@react-pdf/renderer: ^4.3.1`)
- React component-based approach aligns with project architecture
- Supports complex layouts needed for invoices (tables, headers, footers)
- Works both client-side (PDFViewer, PDFDownloadLink) and server-side
- TypeScript support included

**Alternatives Considered**:
- **jsPDF**: Lower-level API, requires manual positioning, less React-native
- **html2pdf**: Relies on DOM rendering, less control over output
- **Server-side PDF services**: Adds external dependency, increases complexity

**Implementation Pattern**:
```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create reusable invoice template component
const InvoiceDocument = ({ invoice, tenant }) => (
  <Document>
    <Page size="A4">
      <View style={styles.header}>
        <Text>{tenant.name}</Text>
        <Text>Invoice #{invoice.invoiceNumber}</Text>
      </View>
      {/* Line items, totals, etc. */}
    </Page>
  </Document>
);
```

---

### 2. Double-Entry Accounting Pattern

**Decision**: Implement simplified double-entry with automatic journal entry creation

**Rationale**:
- Spec requirement (A-004): Double-entry accounting principles for all transactions
- Provides complete audit trail
- Enables accurate balance calculations
- Standard pattern for financial software

**Design Pattern**:

Each financial transaction creates a journal entry with balanced debits and credits:

| Transaction Type | Debit Account | Credit Account |
|-----------------|---------------|----------------|
| Invoice Created | Customer (Receivable) | Income |
| Customer Payment | Cash/Bank | Customer (Receivable) |
| Partner Payment | Partner (Payable) | Cash/Bank |
| Business Expense | Expense Category | Cash/Bank |
| Invoice Cancelled | Income | Customer (Receivable) |

**Account Types**:
- **Assets**: Cash, Bank, Accounts Receivable (Customer accounts)
- **Liabilities**: Accounts Payable (Partner accounts)
- **Income**: Service Revenue
- **Expenses**: Rent, Utilities, Supplies, etc.

**Implementation Approach**:
- Journal entries created automatically via server actions
- Each entry has: date, description, array of line items (account, debit/credit amount)
- Account balances calculated from sum of journal entry lines
- No manual journal entry creation for users (automatic from invoices/payments)

---

### 3. Optimistic Locking for Concurrent Edits

**Decision**: Implement version-based optimistic locking using Firestore

**Rationale**:
- Spec clarification: "Optimistic locking - second user sees error and must reload"
- Firebase mobile/web SDKs use optimistic concurrency by default
- Prevents silent data overwrites
- Better UX than pessimistic locking (no waiting for locks)

**Implementation Pattern**:
```typescript
// Each document has a version field (incrementing number or Timestamp)
interface VersionedDocument {
  version: number;
  updatedAt: Timestamp;
}

// On update, check version matches
async function updateInvoice(invoiceId: string, data: UpdateData, expectedVersion: number) {
  const docRef = doc(db, 'invoices', invoiceId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const currentVersion = docSnap.data()?.version;

    if (currentVersion !== expectedVersion) {
      throw new Error('CONFLICT: Document was modified by another user. Please reload.');
    }

    transaction.update(docRef, {
      ...data,
      version: currentVersion + 1,
      updatedAt: serverTimestamp()
    });
  });
}
```

**Error Handling**:
- Catch version conflict errors
- Display user-friendly message: "This invoice was updated by another user. Please reload to see the latest changes."
- Provide "Reload" button to refresh data

---

### 4. Service Catalog vs. Package Services

**Decision**: Create new standalone Service Catalog separate from Package Services

**Rationale**:
- Existing `Service` type is tied to packages (nested under packages collection)
- New system needs predefined services at workspace level
- Services can be added to invoices independently of packages
- Cleaner separation of concerns

**Data Model**:
```typescript
// New: Predefined service catalog at workspace level
// Collection: tenants/{tenantId}/serviceCatalog/{serviceId}
interface ServiceCatalogItem {
  id: string;
  name: string;
  nameAr: string; // Arabic name
  description?: string;
  price: number;
  currency: CurrencyCode;
  type: 'visa' | 'ticket' | 'hotel' | 'insurance' | 'other';

  // Provider
  providerType: 'office' | 'partner';
  defaultPartnerId?: string;
  defaultPartnerName?: string;
  commissionPercentage?: number;

  // Metadata
  isActive: boolean;
  usageCount: number; // For soft-delete protection
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 5. Beneficiary Information Per Service

**Decision**: Embed beneficiary data in invoice line items

**Rationale**:
- Each service in an invoice can have different beneficiaries
- Visa/ticket services commonly need passenger information
- Keeps data together with the service for easy retrieval

**Data Model**:
```typescript
interface Beneficiary {
  name: string;
  idNumber?: string;
  phone?: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
}

interface InvoiceLineItem {
  // ... existing fields
  beneficiary?: Beneficiary;
  comments?: string;
  attachments?: Attachment[];
}
```

---

### 6. Account Statements Generation

**Decision**: Generate statements on-demand from journal entries

**Rationale**:
- No need to store statement documents
- Always reflects current data
- Date range filtering at query time
- Export to PDF using existing @react-pdf/renderer

**Query Pattern**:
```typescript
// Get all journal entry lines for an account within date range
const entries = await getDocs(
  query(
    collection(db, `tenants/${tenantId}/journalEntries`),
    where('lines', 'array-contains', { accountId: customerId }),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  )
);

// Calculate running balance
let runningBalance = openingBalance;
const lines = entries.map(entry => {
  runningBalance += entry.debit - entry.credit;
  return { ...entry, runningBalance };
});
```

---

### 7. Quick-Add Modals Pattern

**Decision**: Use shadcn/ui Dialog with embedded forms

**Rationale**:
- Consistent with existing UI patterns
- No page navigation required
- Returns created entity for immediate use
- Reuses existing form validation schemas

**Implementation Pattern**:
```tsx
// Quick-add modal for customer
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Customer</DialogTitle>
    </DialogHeader>
    <CustomerForm
      onSuccess={(customer) => {
        onCustomerCreated(customer);
        setIsOpen(false);
      }}
      isQuickAdd={true} // Minimal fields
    />
  </DialogContent>
</Dialog>
```

---

### 8. Invoice Number Generation

**Decision**: Workspace-specific sequential pattern with year prefix

**Rationale**:
- Spec assumption A-007: Workspace-specific sequential pattern
- Year prefix helps with organization and prevents number bloat
- Format: `INV-{YEAR}-{SEQUENCE}` (e.g., INV-2024-0001)

**Implementation**:
```typescript
// Use Firestore transaction to ensure uniqueness
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const counterRef = doc(db, `tenants/${tenantId}/counters/invoices`);
  const year = new Date().getFullYear();

  return runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const data = counterDoc.data() || { year, sequence: 0 };

    // Reset sequence if year changed
    let sequence = data.year === year ? data.sequence + 1 : 1;

    transaction.set(counterRef, { year, sequence });

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
  });
}
```

---

## Dependencies Summary

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| @react-pdf/renderer | ^4.3.1 | PDF generation | Already installed |
| firebase | ^12.7.0 | Database, auth, storage | Already installed |
| zod | ^4.2.1 | Validation schemas | Already installed |
| react-hook-form | ^7.68.0 | Form handling | Already installed |
| @radix-ui/react-dialog | ^1.1.15 | Quick-add modals | Already installed |
| date-fns | ^4.1.0 | Date formatting/manipulation | Already installed |

**No new dependencies required.**

---

## Firestore Collection Structure

```text
tenants/{tenantId}/
├── serviceCatalog/{serviceId}      # NEW: Predefined services
├── invoices/{invoiceId}            # Enhanced with beneficiaries
├── accounts/{accountId}            # NEW: Chart of accounts
├── journalEntries/{entryId}        # NEW: Double-entry journal
├── expenses/{expenseId}            # NEW: Business expenses
├── counters/
│   ├── invoices                    # Invoice number counter
│   ├── payments                    # Payment number counter
│   └── transactions                # Transaction number counter
├── customers/{customerId}          # Existing - add accountId ref
├── partnerOffices/{partnerId}      # Existing - add accountId ref
└── payments/{paymentId}            # Existing - extend for partner payments
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex accounting calculations | Implement comprehensive unit tests for balance calculations |
| Large PDF rendering on mobile | Lazy load PDF preview, offer direct download option |
| Concurrent edit conflicts | Clear error messages with reload option |
| Invoice editing impacts accounting | Automatic journal entry adjustments on edit |
| Statement query performance | Add composite indexes for account + date queries |
