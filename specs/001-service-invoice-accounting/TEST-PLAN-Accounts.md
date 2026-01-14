# TEST-PLAN: Accounts (Chart of Accounts) Section

Generated: 2026-01-10
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase
App URL: http://localhost:3000
Route: /accounting/accounts

---

## Overview

This test plan covers **User Story 6 - Manage Chart of Accounts** from the spec. This includes:
- Viewing the chart of accounts grouped by type (asset, liability, income, expense)
- Creating new accounts
- Editing existing accounts
- Deactivating accounts (soft delete)
- Verifying system accounts cannot be modified
- Auto-creation of accounts for customers/partners

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate to http://localhost:3000 -> Enter credentials -> Submit | Dashboard loads | Chrome | [ ] |

**Test Credentials:**
- Primary: hossamsharif1990@gmail.com / Hossam1990@
- Backup: halabija@gmail.com / Hossam1990@

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Dashboard is visible

---

## Section 1: Navigation & Page Load

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-NAV-1 | Sidebar Navigation | Click "Accounting" in sidebar -> Click "Chart of Accounts" | Accounts page loads | Chrome | [ ] |
| ACC-NAV-2 | Direct URL | Navigate to /accounting/accounts | Accounts page loads | Chrome | [ ] |
| ACC-NAV-3 | Page Title | Verify page header | Shows "Chart of Accounts" title | Chrome | [ ] |

---

## Section 2: i18n Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-i18n-1 | Page Title Translated | View page header | No raw keys like "accounting.chartOfAccounts" | Chrome | [ ] |
| ACC-i18n-2 | Account Types Translated | View account type badges | Shows "Asset", "Liability", etc. (not raw keys) | Chrome | [ ] |
| ACC-i18n-3 | Subtype Labels | View subtype column | Shows "Cash", "Bank", "Receivable", etc. | Chrome | [ ] |
| ACC-i18n-4 | Button Labels | View "Create Account" button | Proper label, no raw keys | Chrome | [ ] |
| ACC-i18n-5 | Table Headers | View table headers | "Code", "Account Name", "Balance", etc. | Chrome | [ ] |
| ACC-i18n-6 | Arabic Locale | Switch to Arabic locale | All text in Arabic, RTL layout | Chrome | [ ] |

---

## Section 3: Account List Display

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-LIST-1 | Accounts Load | Navigate to accounts page | List of accounts displays | Chrome | [ ] |
| ACC-LIST-2 | Grouped by Type | View account cards | Accounts grouped by Asset, Liability, Income, Expense | Chrome | [ ] |
| ACC-LIST-3 | Total Balance per Type | View card headers | Each type shows total balance | Chrome | [ ] |
| ACC-LIST-4 | Account Code Display | View account row | Shows account code (e.g., 1001) | Chrome | [ ] |
| ACC-LIST-5 | Account Name Display | View account row | Shows account name | Chrome | [ ] |
| ACC-LIST-6 | Balance Display | View account row | Shows formatted balance | Chrome | [ ] |
| ACC-LIST-7 | Status Badge | View account row | Shows "Active" or "Inactive" badge | Chrome | [ ] |
| ACC-LIST-8 | System Account Lock | View system account row | Edit button shows lock icon | Chrome | [ ] |

### **HARD STOP** - List Display Checkpoint
- [ ] Accounts list loads without errors
- [ ] Accounts are properly grouped by type

---

## Section 4: Default System Accounts

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-SYS-1 | Cash Account Exists | View Asset accounts | "Cash" account exists | Chrome | [ ] |
| ACC-SYS-2 | Bank Account Exists | View Asset accounts | "Bank" account exists | Chrome | [ ] |
| ACC-SYS-3 | Revenue Account Exists | View Income accounts | Revenue/income account exists | Chrome | [ ] |
| ACC-SYS-4 | Expense Accounts Exist | View Expense accounts | At least one expense account exists | Chrome | [ ] |
| ACC-SYS-5 | System Flag | View system accounts | System accounts have lock icon (cannot edit) | Chrome | [ ] |

---

## Section 5: Create Account

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-CREATE-1 | Open Create Dialog | Click "Create Account" button | Dialog opens with form | Chrome | [ ] |
| ACC-CREATE-2 | Form Fields | View create form | Shows Code, Name, Name (Arabic), Type, Subtype, Description, Active toggle | Chrome | [ ] |
| ACC-CREATE-3 | Type Selection | Select account type | Type dropdown works | Chrome | [ ] |
| ACC-CREATE-4 | Subtype Updates | Change type from Asset to Expense | Subtype options update accordingly | Chrome | [ ] |
| ACC-CREATE-5 | Validation - Empty Code | Submit without code | Shows validation error | Chrome | [ ] |
| ACC-CREATE-6 | Validation - Empty Name | Submit without name | Shows validation error | Chrome | [ ] |
| ACC-CREATE-7 | Create Success | Fill all fields -> Submit | Account created, toast shows, dialog closes | Chrome | [ ] |
| ACC-CREATE-8 | New Account in List | After creation | New account appears in list | Chrome | [ ] |
| ACC-CREATE-9 | Duplicate Code Error | Create account with existing code | Shows error "account with this code already exists" | Chrome | [ ] |

**Test Data for Create:**
```
Code: 9001
Name: Test Account
Name (Arabic): حساب اختبار
Type: Expense
Subtype: General Expense
Description: Test account for QA
Active: Yes
```

### **HARD STOP** - Create Checkpoint
- [ ] Can successfully create a new account
- [ ] New account appears in the list

---

## Section 6: Edit Account

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-EDIT-1 | Open Edit Dialog | Click edit button on non-system account | Edit dialog opens | Chrome | [ ] |
| ACC-EDIT-2 | Pre-populated Fields | View edit form | All fields show current values | Chrome | [ ] |
| ACC-EDIT-3 | Code Field Disabled | View code field | Code cannot be changed in edit mode | Chrome | [ ] |
| ACC-EDIT-4 | Type Field Disabled | View type field | Type cannot be changed in edit mode | Chrome | [ ] |
| ACC-EDIT-5 | Update Name | Change account name -> Save | Name updates successfully | Chrome | [ ] |
| ACC-EDIT-6 | Update Description | Change description -> Save | Description updates | Chrome | [ ] |
| ACC-EDIT-7 | Toggle Active Status | Toggle active switch -> Save | Status changes | Chrome | [ ] |
| ACC-EDIT-8 | System Account Protected | Try to edit system account | Edit button disabled/shows lock | Chrome | [ ] |

---

## Section 7: Delete/Deactivate Account

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-DEL-1 | Delete Button | View non-system account actions | Delete/deactivate option available | Chrome | [ ] |
| ACC-DEL-2 | Confirm Dialog | Click delete | Confirmation dialog appears | Chrome | [ ] |
| ACC-DEL-3 | Cancel Delete | Click cancel on confirmation | Dialog closes, account unchanged | Chrome | [ ] |
| ACC-DEL-4 | Confirm Delete | Click confirm delete | Account deactivated | Chrome | [ ] |
| ACC-DEL-5 | Account with Transactions | Try to delete account with journal entries | Shows error "cannot delete account with transactions" | Chrome | [ ] |
| ACC-DEL-6 | System Account Protected | Try to delete system account | Not allowed, shows error | Chrome | [ ] |

---

## Section 8: Auto-Created Accounts (Customer/Partner)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-AUTO-1 | Customer Account | Navigate to accounts after customer exists | Customer receivable account exists | Chrome | [ ] |
| ACC-AUTO-2 | Partner Account | Navigate to accounts after partner exists | Partner payable account exists | Chrome | [ ] |
| ACC-AUTO-3 | Linked Entity Display | View auto-created account | Shows "Linked to Customer" or "Linked to Partner" | Chrome | [ ] |

---

## Section 9: Mobile Responsive Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-MOB-1 | Mobile List View | Set viewport to 375x812 | Accounts display properly | Chrome | [ ] |
| ACC-MOB-2 | Mobile Create | Open create dialog on mobile | Form is usable | Chrome | [ ] |
| ACC-MOB-3 | Mobile Edit | Open edit dialog on mobile | Form is usable | Chrome | [ ] |
| ACC-MOB-4 | Table Scroll | View accounts table on mobile | Horizontal scroll if needed | Chrome | [ ] |

---

## Section 10: Empty State

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-EMPTY-1 | No Accounts Message | View accounts with no data (new workspace) | Shows "No accounts" message | Chrome | [ ] |

---

## Section 11: Console Errors

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-ERR-1 | Page Load Errors | Check console on page load | No critical errors | Chrome | [ ] |
| ACC-ERR-2 | Create Errors | Check console after create | No critical errors | Chrome | [ ] |
| ACC-ERR-3 | Edit Errors | Check console after edit | No critical errors | Chrome | [ ] |

---

## Success Criteria

Test execution is complete when:

- [ ] All AUTH tests pass
- [ ] All NAV tests pass
- [ ] All i18n tests pass (no raw translation keys)
- [ ] All LIST tests pass
- [ ] All SYS (system accounts) tests pass
- [ ] All CREATE tests pass
- [ ] All EDIT tests pass
- [ ] All DEL tests pass
- [ ] All AUTO tests pass
- [ ] All MOB tests pass
- [ ] All ERR tests pass
- [ ] All HARD STOPs verified
- [ ] All fixes committed
- [ ] TEST-REPORT-Accounts.md generated

---

## Test Execution Notes

1. Start with AUTH section - cannot proceed without login
2. Verify default system accounts exist before testing create/edit
3. Create a test account specifically for edit/delete testing
4. Do not delete accounts that are linked to existing transactions
5. Screenshot any failures to specs/001-service-invoice-accounting/screenshots/

---

## Output Signal

When all tests pass:
```
<promise>ALL_TESTS_COMPLETE</promise>
```

If >50% tests blocked:
```
<promise>BLOCKED</promise>
```
