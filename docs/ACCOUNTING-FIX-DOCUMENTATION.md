# Accounting Logic Fix Documentation

> **Date**: January 12, 2026
> **Issue**: Revenue Over-Reporting (880 vs 80 SAR)
> **Status**: RESOLVED
> **Severity**: Critical - Financial Reporting Accuracy

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Description](#problem-description)
3. [Root Cause Analysis](#root-cause-analysis)
4. [The Correct Accounting Model](#the-correct-accounting-model)
5. [Implementation Details](#implementation-details)
6. [Files Modified](#files-modified)
7. [Code Changes](#code-changes)
8. [Testing & Verification](#testing--verification)
9. [Before/After Comparison](#beforeafter-comparison)
10. [Cleanup Script](#cleanup-script)
11. [Future Considerations](#future-considerations)

---

## Executive Summary

The travel agency accounting system had critical bugs causing **Revenue to be reported as 880 SAR instead of 80 SAR** for an 800 SAR invoice with 10% commission. The bugs stemmed from:

1. Invoice creation crediting full amount as revenue instead of splitting between AP and commission
2. Partner payment incorrectly adding revenue again (double-counting)
3. AR account lookup using wrong field names, causing duplicate accounts

All issues have been fixed. The system now correctly implements the **Net/Agency Accounting Method**.

---

## Problem Description

### Symptom

For an invoice with:
- **Total**: 800 SAR
- **Partner Service**: 800 SAR (outsourced to Galaxy Travel Agency)
- **Commission Rate**: 10%
- **Commission Amount**: 80 SAR

**Expected Revenue**: 80 SAR (commission only)
**Actual Revenue**: 880 SAR (incorrect - 11x overstated)

### Business Impact

- Financial statements showed inflated revenue
- Profit margins appeared incorrect
- Partner liabilities (AP) not properly tracked
- Account balances inconsistent with actual transactions

---

## Root Cause Analysis

### Bug #1: Invoice Creation Journal Entry

**Location**: `frontend/src/app/actions/invoices.ts` (lines ~787-811)

**Problem**: When issuing an invoice with partner services, the system created a simple 2-line journal entry:

```
WRONG:
  Debit:  AR (Customer)      800
  Credit: Revenue            800  ← INCORRECT: Full amount as revenue
```

**Why it's wrong**: The agency doesn't earn 800 SAR - it only earns the 80 SAR commission. The remaining 720 SAR belongs to the partner and should be recorded as a liability (Accounts Payable).

---

### Bug #2: Partner Payment Journal Entry

**Location**: `frontend/src/app/actions/payments.ts` (lines ~1127-1180)

**Problem**: When paying the partner, the system created a 3-line journal entry:

```
WRONG:
  Debit:  AP (Partner)       800  ← Used gross instead of net
  Credit: Cash               720
  Credit: Revenue             80  ← INCORRECT: Revenue credited AGAIN
```

**Why it's wrong**: Revenue was already recorded at invoice time. Recording it again during partner payment causes double-counting. Also, the AP debit used gross amount (800) instead of net (720).

---

### Bug #3: AR Account Lookup

**Location**: `frontend/src/app/actions/payments.ts` (lines ~195-222)

**Problem**: The query to find customer AR accounts used the wrong field:

```typescript
// WRONG QUERY:
.where('customerId', '==', invoice.customerId)

// But accounts were created with:
linkedEntityType: 'customer'
linkedEntityId: '<customer-id>'
```

**Why it's wrong**: The query never found existing AR accounts because it looked for a field (`customerId`) that didn't exist. This caused the system to create duplicate AR accounts for the same customer, leading to balance inconsistencies.

---

## The Correct Accounting Model

The travel agency operates as an **intermediary** using the **Net/Agency Method**:

- The agency collects money from customers on behalf of partners
- The agency only earns commission (the markup/fee)
- The partner is owed the net amount (gross - commission)

### Correct Journal Entry Flow

**Example**: 800 SAR invoice, Partner gets 720 SAR, Agency earns 80 SAR commission

#### Step 1: Invoice Issued

```
Debit:  Accounts Receivable (Customer)     800  ← Customer owes us
Credit: Accounts Payable (Partner)         720  ← We owe partner
Credit: Service Revenue                     80  ← Our commission earned
```

**Accounting Equation**: Assets (+800 AR) = Liabilities (+720 AP) + Equity (+80 Revenue)

#### Step 2: Customer Payment Received (800 SAR)

```
Debit:  Cash                               800  ← Money received
Credit: Accounts Receivable (Customer)     800  ← Customer debt cleared
```

**Result**: AR is cleared, Cash increases

#### Step 3: Partner Payment Made (720 SAR)

```
Debit:  Accounts Payable (Partner)         720  ← Clear our debt
Credit: Cash                               720  ← Money paid out
```

**Result**: AP is cleared, Cash decreases

### Final Balances

| Account | Balance | Explanation |
|---------|---------|-------------|
| Cash | +80 | 800 received - 720 paid = 80 profit |
| AR | 0 | Customer debt cleared |
| AP | 0 | Partner debt cleared |
| Revenue | 80 | Commission earned |

---

## Implementation Details

### Phase 1: Fix AR Account Lookup

**File**: `frontend/src/app/actions/payments.ts`

Changed the query to use the correct field names that match how accounts are created:

```typescript
// BEFORE (wrong):
const arAccountQuery = await adminDb
  .collection(`tenants/${tenantId}/accounts`)
  .where('type', '==', 'asset')
  .where('subtype', '==', 'receivable')
  .where('customerId', '==', invoice.customerId)  // Wrong field
  .limit(1)
  .get();

// AFTER (correct):
const arAccountQuery = await adminDb
  .collection(`tenants/${tenantId}/accounts`)
  .where('linkedEntityType', '==', 'customer')
  .where('linkedEntityId', '==', invoice.customerId)
  .limit(1)
  .get();
```

Also updated the fallback account creation to use consistent fields:

```typescript
// Account creation now uses:
{
  linkedEntityType: 'customer',
  linkedEntityId: invoice.customerId,
  // Instead of: customerId: invoice.customerId
}
```

---

### Phase 2: Fix Partner Payment Journal Entry

**File**: `frontend/src/app/actions/payments.ts`

Removed the incorrect revenue credit line and fixed the amounts:

```typescript
// BEFORE (wrong - 3 lines):
const journalLines = [
  { accountId: partnerAccount.id, debit: data.grossAmount, credit: 0 },
  { accountId: paymentAccount.id, debit: 0, credit: data.netAmount },
  { accountId: revenueAccount.id, debit: 0, credit: data.commissionAmount }, // WRONG
];

// AFTER (correct - 2 lines):
const journalLines = [
  {
    accountId: partnerAccount.id,
    accountName: partnerAccount.name,
    accountCode: partnerAccount.code,
    debit: data.netAmount,  // Clear net liability (what we owe)
    credit: 0,
  },
  {
    accountId: paymentAccount.id,
    accountName: paymentAccount.name,
    accountCode: paymentAccount.code,
    debit: 0,
    credit: data.netAmount,  // Cash paid out
  },
];
```

**Key Changes**:
- Removed revenue credit line (revenue already recorded at invoice time)
- Changed AP debit from `grossAmount` to `netAmount`

---

### Phase 3: Fix Invoice Creation Journal Entry

**File**: `frontend/src/app/actions/invoices.ts`

Replaced the simple 2-line entry with a dynamic multi-line entry that properly splits revenue:

```typescript
// Build journal lines dynamically
const journalLines = [];

// 1. Always: Debit AR for full invoice amount
journalLines.push({
  accountId: customerAccount.id,
  accountName: customerAccount.name,
  accountCode: customerAccount.code,
  debit: invoice.total,
  credit: 0
});

// 2. For each partner: Credit AP for net amount owed
let totalPartnerLiability = 0;
let totalCommissionRevenue = 0;

if (invoice.commissionsByPartner && invoice.commissionsByPartner.length > 0) {
  for (const commission of invoice.commissionsByPartner) {
    const partnerId = commission.partnerId || commission.partnerOfficeId;
    const commissionAmount = commission.amount || commission.totalAmount || 0;

    // Calculate gross for this partner from line items
    let partnerGross = 0;
    for (const item of invoice.lineItems) {
      if (item.isOutsourced && item.partnerId === partnerId) {
        partnerGross += item.total;
      }
    }

    const partnerNet = partnerGross - commissionAmount;

    if (partnerNet > 0) {
      // Get partner AP account
      const partnerAccount = await getPartnerAccount(tenantId, partnerId);

      // Credit AP for net owed to partner
      journalLines.push({
        accountId: partnerAccount.id,
        accountName: partnerAccount.name,
        accountCode: partnerAccount.code,
        debit: 0,
        credit: partnerNet
      });

      totalPartnerLiability += partnerNet;
    }

    totalCommissionRevenue += commissionAmount;
  }
}

// 3. Credit Revenue for our earnings (commission + direct services)
const directRevenue = invoice.total - totalPartnerLiability - totalCommissionRevenue;
const ourRevenue = totalCommissionRevenue + directRevenue;

if (ourRevenue > 0) {
  journalLines.push({
    accountId: revenueAccount.id,
    accountName: revenueAccount.name,
    accountCode: revenueAccount.code,
    debit: 0,
    credit: ourRevenue
  });
}
```

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `frontend/src/app/actions/payments.ts` | AR lookup query fix | ~195-245 |
| `frontend/src/app/actions/payments.ts` | Partner payment journal fix | ~1150-1182 |
| `frontend/src/app/actions/invoices.ts` | Invoice creation journal fix | ~755-890 |
| `frontend/scripts/cleanup-accounting-data.js` | New cleanup script | New file |

---

## Code Changes

### payments.ts - AR Account Lookup (Line ~195)

```diff
- const arAccountQuery = await adminDb
-   .collection(`tenants/${tenantId}/accounts`)
-   .where('type', '==', 'asset')
-   .where('subtype', '==', 'receivable')
-   .where('customerId', '==', invoice.customerId)
-   .limit(1)
-   .get();

+ const arAccountQuery = await adminDb
+   .collection(`tenants/${tenantId}/accounts`)
+   .where('linkedEntityType', '==', 'customer')
+   .where('linkedEntityId', '==', invoice.customerId)
+   .limit(1)
+   .get();
```

### payments.ts - Partner Payment Journal (Line ~1150)

```diff
  const journalLines = [
    {
      accountId: partnerAccount.id,
      accountName: partnerAccount.name,
      accountCode: partnerAccount.code,
-     debit: data.grossAmount,
+     debit: data.netAmount,
      credit: 0,
    },
    {
      accountId: paymentAccount.id,
      accountName: paymentAccount.name,
      accountCode: paymentAccount.code,
      debit: 0,
      credit: data.netAmount,
    },
-   {
-     accountId: revenueAccount.id,
-     accountName: revenueAccount.name,
-     accountCode: revenueAccount.code,
-     debit: 0,
-     credit: data.commissionAmount,
-   },
  ];
```

### invoices.ts - Invoice Journal Entry (Line ~787)

See [Phase 3 Implementation Details](#phase-3-fix-invoice-creation-journal-entry) for full code.

---

## Testing & Verification

### Manual Test Flow

1. **Create Invoice** with partner service:
   - Amount: 800 SAR
   - Partner: Any active partner
   - Commission: 10%

2. **Issue Invoice** - Verify journal entry:
   ```
   Expected:
   DR AR (Customer)     800
   CR AP (Partner)      720
   CR Revenue            80
   ```

3. **Record Customer Payment** (800 SAR) - Verify journal:
   ```
   Expected:
   DR Cash              800
   CR AR (Customer)     800
   ```

4. **Record Partner Payment** (720 SAR) - Verify journal:
   ```
   Expected:
   DR AP (Partner)      720
   CR Cash              720
   ```

5. **Verify Final Balances**:
   - Cash: 80
   - AR: 0
   - AP: 0
   - Revenue: 80

### Verification Script

Run to check accounting state:

```bash
cd frontend
node check-accounting-state.js
```

---

## Before/After Comparison

### Invoice Creation

| Aspect | Before (Bug) | After (Fixed) |
|--------|--------------|---------------|
| AR Debit | 800 | 800 |
| AP Credit | 0 (missing!) | 720 |
| Revenue Credit | 800 (wrong!) | 80 (correct) |
| Entry Balance | 800 = 800 | 800 = 720 + 80 |

### Partner Payment

| Aspect | Before (Bug) | After (Fixed) |
|--------|--------------|---------------|
| AP Debit | 800 (gross - wrong) | 720 (net - correct) |
| Cash Credit | 720 | 720 |
| Revenue Credit | 80 (double-count!) | 0 (already recorded) |
| Entry Balance | 800 = 800 | 720 = 720 |

### Total Revenue Impact

| Scenario | Before | After |
|----------|--------|-------|
| At Invoice | +800 | +80 |
| At Partner Payment | +80 | +0 |
| **Total Revenue** | **880** (wrong) | **80** (correct) |

---

## Cleanup Script

A cleanup script was created to reset test data after fixing the bugs:

**File**: `frontend/scripts/cleanup-accounting-data.js`

**What it does**:
1. Deletes all journal entries
2. Deletes all payments
3. Resets all invoices to draft status
4. Deletes duplicate AR accounts
5. Resets all account balances to 0
6. Resets partner commission totals
7. Resets customer balances

**Usage**:
```bash
cd frontend
node scripts/cleanup-accounting-data.js
```

**Warning**: This script deletes financial data. Only use in development/testing environments.

---

## Future Considerations

### 1. Mixed Invoice Support

The current fix handles invoices with:
- Only partner services (outsourced)
- Only direct services (in-house)
- Mixed services (both)

For mixed invoices, revenue is correctly split between:
- Commission from partner services
- Full amount from direct services

### 2. Multiple Partners per Invoice

The fix supports invoices with services from multiple partners. Each partner gets their own AP credit line in the journal entry.

### 3. Account Field Consistency

Ensure all code creating or querying linked accounts uses:
- `linkedEntityType`: 'customer' | 'partner'
- `linkedEntityId`: The entity's ID

**Never use** deprecated fields like `customerId` or `partnerId` directly on accounts.

### 4. Firestore Indexes

The following compound indexes may be needed:

```
Collection: tenants/{tenantId}/accounts
Fields: linkedEntityType (ASC), linkedEntityId (ASC)
```

### 5. Data Migration

For existing production data with incorrect journal entries:
1. Identify affected invoices/payments
2. Recalculate correct journal entries
3. Adjust account balances accordingly
4. Consider creating adjustment entries rather than deleting

---

## Appendix: Accounting Terminology

| Term | Definition |
|------|------------|
| **AR (Accounts Receivable)** | Asset account tracking money owed TO us by customers |
| **AP (Accounts Payable)** | Liability account tracking money owed BY us to partners |
| **Revenue** | Income account tracking our earnings |
| **Debit** | Left side of entry - increases assets, decreases liabilities |
| **Credit** | Right side of entry - decreases assets, increases liabilities |
| **Net/Agency Method** | Accounting method where intermediary records only commission as revenue |
| **Double-Entry** | Every transaction has equal debits and credits |

---

## Contact

For questions about this fix, refer to:
- Plan file: `.claude/plans/sleepy-growing-tiger.md`
- Test report: `specs/001-service-invoice-accounting/TEST-REPORT.md`
