# TEST-PLAN: Payments Feature

Generated: 2026-01-08
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase
App URL: http://localhost:3000

---

## Test Scope

Testing the Payments feature which covers:
- **User Story 3 (US3)**: Record Customer Payments (Priority P1)
- **User Story 4 (US4)**: Record Partner Payments (Priority P2)

### Key Components Under Test
- Payments list page: `/[locale]/(dashboard)/payments`
- Payment detail page: `/[locale]/(dashboard)/payments/[paymentId]`
- Customer payment recording from invoices
- Partner payment recording with commission deduction
- Payment status management (pending/completed/failed)
- Bank transfer approval workflow
- i18n translations (Arabic RTL and English)
- Mobile responsiveness

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login with primary account | Navigate to /ar/login → Enter hossamsharif1990@gmail.com / Hossam1990@ → Submit | Dashboard loads | Chrome MCP | [ ] |
| AUTH-2 | Verify session persists | Navigate to /ar/payments | Payments page loads without redirect | Chrome MCP | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Can access dashboard

---

## Page: /[locale]/payments

### UI Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-UI-1 | Payments page loads | Navigate to /ar/payments | Page renders with title and tabs | Chrome MCP | [ ] |
| PAY-UI-2 | Customer payments tab visible | Check for customer payments tab | Tab shows "المدفوعات من العملاء" | Chrome MCP | [ ] |
| PAY-UI-3 | Partner payments tab visible | Check for partner payments tab | Tab shows "المدفوعات للشركاء" | Chrome MCP | [ ] |
| PAY-UI-4 | Search input visible | Check for search input | Search field present | Chrome MCP | [ ] |
| PAY-UI-5 | Status filter works | Click status filter dropdown | Shows pending/completed/failed options | Chrome MCP | [ ] |
| PAY-UI-6 | Method filter works | Click method filter dropdown | Shows cash/bank/stripe options | Chrome MCP | [ ] |
| PAY-UI-7 | Tab switching works | Click partner payments tab | Partner payments section displays | Chrome MCP | [ ] |

### i18n Tests - Arabic

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-i18n-AR-1 | Page title Arabic | Check page heading | Shows "المدفوعات" not raw key | Chrome MCP | [ ] |
| PAY-i18n-AR-2 | Tabs Arabic | Check tab labels | Arabic text visible | Chrome MCP | [ ] |
| PAY-i18n-AR-3 | Filter labels Arabic | Check filter placeholders | Arabic placeholders | Chrome MCP | [ ] |
| PAY-i18n-AR-4 | Empty state Arabic | If no payments, check empty text | Arabic empty message | Chrome MCP | [ ] |
| PAY-i18n-AR-5 | RTL alignment | Check page layout | Right-to-left alignment | Chrome MCP | [ ] |

### i18n Tests - English

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-i18n-EN-1 | Page title English | Navigate to /en/payments, check heading | Shows "Payments" | Chrome MCP | [ ] |
| PAY-i18n-EN-2 | Tabs English | Check tab labels | "Customer Payments" / "Partner Payments" | Chrome MCP | [ ] |
| PAY-i18n-EN-3 | LTR alignment | Check page layout | Left-to-right alignment | Chrome MCP | [ ] |

### **HARD STOP** - Payments Page UI
- [ ] All UI elements render correctly
- [ ] i18n translations work for both locales
- [ ] RTL/LTR layouts correct

---

## User Story 3: Customer Payments (US3)

### Pre-condition: Ensure test invoice exists

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-PRE-1 | Navigate to invoices | Go to /ar/invoices | Invoice list visible | Chrome MCP | [ ] |
| PAY-PRE-2 | Find unpaid invoice | Look for invoice with status "issued" or "partial" | Found invoice with balance > 0 | Chrome MCP | [ ] |
| PAY-PRE-3 | Note invoice details | Record invoice ID, customer name, balance | Details noted for testing | Chrome MCP | [ ] |

### Customer Payment CRUD Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US3-1 | Open invoice detail | Click on invoice → View details | Invoice detail page shows | Chrome MCP | [ ] |
| PAY-US3-2 | Click record payment | Click "Record Payment" button | Payment dialog/form opens | Chrome MCP | [ ] |
| PAY-US3-3 | Payment form validation | Submit empty form | Validation errors show | Chrome MCP | [ ] |
| PAY-US3-4 | Amount validation | Enter amount > balance | Error: amount exceeds balance | Chrome MCP | [ ] |
| PAY-US3-5 | Select payment method | Select "Cash" method | Cash method selected | Chrome MCP | [ ] |
| PAY-US3-6 | Select payment account | Select account from dropdown | Account selected | Chrome MCP | [ ] |
| PAY-US3-7 | Enter valid amount | Enter partial amount (e.g., 100) | Amount accepted | Chrome MCP | [ ] |
| PAY-US3-8 | Add notes | Enter payment notes | Notes field accepts text | Chrome MCP | [ ] |
| PAY-US3-9 | Submit payment | Click submit/record button | Payment created successfully | Chrome MCP | [ ] |
| PAY-US3-10 | Verify success message | Check for toast/notification | Success message displays | Chrome MCP | [ ] |
| PAY-US3-11 | Invoice status updates | Check invoice status | Status shows "partial" or "paid" | Chrome MCP | [ ] |
| PAY-US3-12 | Payment in list | Navigate to /ar/payments | New payment appears in list | Chrome MCP | [ ] |
| PAY-US3-13 | Payment card details | Check payment card | Shows amount, method, date, customer | Chrome MCP | [ ] |

### Customer Balance Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US3-14 | Customer balance card | View invoice/customer with balance | Balance card shows | Chrome MCP | [ ] |
| PAY-US3-15 | Balance updates | After payment, check balance | Balance decreased by payment amount | Chrome MCP | [ ] |

### Journal Entry Verification

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US3-16 | Journal entry created | Navigate to /ar/accounting/journal | Payment journal entry exists | Chrome MCP | [ ] |
| PAY-US3-17 | Entry debit/credit | Check journal entry details | Debit: Cash, Credit: Customer Receivable | Chrome MCP | [ ] |

### **HARD STOP** - Customer Payments
- [ ] Can record customer payment
- [ ] Invoice status updates correctly
- [ ] Customer balance updates correctly
- [ ] Journal entry created

---

## User Story 4: Partner Payments (US4)

### Pre-condition: Ensure test partner invoice exists

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-PRE-P1 | Navigate to invoices | Go to /ar/invoices | Invoice list visible | Chrome MCP | [ ] |
| PAY-PRE-P2 | Find partner invoice | Find invoice with partner services (commission) | Found invoice with partner | Chrome MCP | [ ] |
| PAY-PRE-P3 | Note partner details | Record partner name, owed amount | Details noted | Chrome MCP | [ ] |

### Partner Payment CRUD Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US4-1 | Switch to partner tab | Click "Partner Payments" tab | Partner payments section shows | Chrome MCP | [ ] |
| PAY-US4-2 | Record partner payment | Select partner from dropdown | Partner payment dialog opens | Chrome MCP | [ ] |
| PAY-US4-3 | Invoice selection | If invoice-based mode, select invoices | Invoices with partner services shown | Chrome MCP | [ ] |
| PAY-US4-4 | Commission calculation | Check calculated values | Gross, commission, net amounts shown | Chrome MCP | [ ] |
| PAY-US4-5 | Commission deduction | Verify net = gross - commission | Math is correct | Chrome MCP | [ ] |
| PAY-US4-6 | Select payment method | Select "Cash" method | Cash method selected | Chrome MCP | [ ] |
| PAY-US4-7 | Select payment account | Select account from dropdown | Account selected | Chrome MCP | [ ] |
| PAY-US4-8 | Submit partner payment | Click submit button | Payment created | Chrome MCP | [ ] |
| PAY-US4-9 | Verify success message | Check for toast | Success message displays | Chrome MCP | [ ] |
| PAY-US4-10 | Payment in list | Check partner payments tab | New payment appears | Chrome MCP | [ ] |
| PAY-US4-11 | Payment shows commission | Check payment card | Commission breakdown visible | Chrome MCP | [ ] |

### Partner Balance Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US4-12 | Partner balance updates | Check partner balance after payment | Balance decreased by net amount | Chrome MCP | [ ] |

### Commission Settlement Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-US4-13 | Invoice commission settled | Check invoice commission status | Shows "settled" for paid partner | Chrome MCP | [ ] |
| PAY-US4-14 | Journal entry created | Navigate to /ar/accounting/journal | Partner payment journal entry exists | Chrome MCP | [ ] |
| PAY-US4-15 | Entry has 3 lines | Check journal entry | Debit Partner Payable, Credit Cash, Credit Revenue | Chrome MCP | [ ] |

### **HARD STOP** - Partner Payments
- [ ] Can record partner payment with commission
- [ ] Commission calculation is correct
- [ ] Partner balance updates correctly
- [ ] Journal entry created with 3 lines

---

## Payment Detail Page Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-DET-1 | Navigate to payment detail | Click on payment card | Payment detail page loads | Chrome MCP | [ ] |
| PAY-DET-2 | Payment info displayed | Check payment details | Shows number, amount, date, status | Chrome MCP | [ ] |
| PAY-DET-3 | Customer/Partner info | Check entity info | Customer or partner name shown | Chrome MCP | [ ] |
| PAY-DET-4 | Linked invoice | Check invoice link | Invoice number/link displayed | Chrome MCP | [ ] |

---

## Bank Transfer Workflow Tests (If applicable)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-BT-1 | Bank transfer payment | Record payment with bank transfer method | Payment shows as pending | Chrome MCP | [ ] |
| PAY-BT-2 | Pending approval badge | Check payment status | Shows "pending" badge | Chrome MCP | [ ] |
| PAY-BT-3 | Approve payment | Click approve button | Payment status changes to completed | Chrome MCP | [ ] |
| PAY-BT-4 | Reject payment | Record new bank transfer → Reject | Payment status changes to failed | Chrome MCP | [ ] |

---

## Mobile Viewport Tests (375x812)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-MOB-1 | Payments page mobile | Resize to 375x812, load payments | Layout adapts to mobile | Chrome MCP | [ ] |
| PAY-MOB-2 | Tabs responsive | Check tabs on mobile | Tabs visible and tappable | Chrome MCP | [ ] |
| PAY-MOB-3 | Filters stack | Check filter layout | Filters stack vertically | Chrome MCP | [ ] |
| PAY-MOB-4 | Payment cards mobile | Check payment cards | Cards display properly | Chrome MCP | [ ] |
| PAY-MOB-5 | Payment form mobile | Open payment form on mobile | Form fields usable | Chrome MCP | [ ] |

---

## Error Handling Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-ERR-1 | Invalid payment amount | Try amount of 0 or negative | Validation error | Chrome MCP | [ ] |
| PAY-ERR-2 | Missing account | Submit without selecting account | Error: account required | Chrome MCP | [ ] |
| PAY-ERR-3 | Paid invoice payment | Try adding payment to paid invoice | Error: cannot add to paid invoice | Chrome MCP | [ ] |
| PAY-ERR-4 | Cancelled invoice payment | Try adding payment to cancelled invoice | Error: cannot add to cancelled invoice | Chrome MCP | [ ] |

---

## Console Error Check

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-CON-1 | No critical console errors | Check browser console throughout tests | No blocking errors | Chrome MCP | [ ] |

---

## Success Criteria

- All [ ] → [x]
- All HARD STOPs verified
- All fixes committed
- Output `<promise>ALL_TESTS_COMPLETE</promise>`

---

## Test Accounts

```yaml
primary:
  email: hossamsharif1990@gmail.com
  password: Hossam1990@
  role: admin

backup_1:
  email: halabija@gmail.com
  password: Hossam1990@
  role: user

backup_2:
  email: husameldeenh@gmail.com
  password: Hossam1990@
  role: user
```
