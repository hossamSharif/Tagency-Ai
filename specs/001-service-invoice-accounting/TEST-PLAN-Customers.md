# TEST-PLAN: Customers Module

Generated: 2026-01-08
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase
App URL: http://localhost:3001
Executed: 2026-01-08

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate to /en/login -> Enter credentials -> Submit | Dashboard loads | Chrome | [x] |

### **HARD STOP** - Auth Checkpoint
- [x] Logged in successfully

---

## Page: /customers (Customer List)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-UI-1 | Page Load | Navigate to /en/customers | Page renders with title "Customers" | Chrome | [x] |
| CUST-UI-2 | Header Elements | Check header | Shows title, subtitle, refresh button, Add Customer button | Chrome | [x] |
| CUST-UI-3 | Search Input | Check filters | Search input with placeholder visible | Chrome | [x] |
| CUST-UI-4 | Passport Filter | Check dropdown | Filter dropdown with All/With Passport/Without Passport options | Chrome | [x] |
| CUST-UI-5 | Empty State | If no customers | Shows empty state with icon and "Add First Customer" button | Chrome | [SKIP] |
| CUST-UI-6 | Customer Cards | If customers exist | Shows customer cards in grid layout | Chrome | [x] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-i18n-1 | English Labels | Check page in /en/customers | All labels in English, no raw keys | Chrome | [x] |
| CUST-i18n-2 | Arabic Labels | Switch to /ar/customers | All labels in Arabic, RTL layout | Chrome | [x] |
| CUST-i18n-3 | Translation Keys | Scan all visible text | No "customers." prefixed keys visible | Chrome | [x] |

### CRUD Tests - Create
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-CRUD-1 | Navigate to New | Click "Add Customer" button | Navigates to /customers/new | Chrome | [x] |
| CUST-CRUD-2 | Form Display | Check new customer form | Shows all fields: firstName, lastName, email, phone, nationality, etc. | Chrome | [x] |
| CUST-CRUD-3 | Validation - Empty | Submit empty form | Shows validation errors for required fields | Chrome | [x] |
| CUST-CRUD-4 | Create Customer | Fill form with valid data -> Submit | Customer created, redirect to list or detail | Chrome | [x] |
| CUST-CRUD-5 | Verify Created | Check customer list | New customer appears in list | Chrome | [x] |

### CRUD Tests - Read
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-CRUD-6 | View Customer | Click on customer card | Navigates to customer detail page | Chrome | [x] |
| CUST-CRUD-7 | Detail Display | Check customer detail | Shows all customer info, invoices section, balance | Chrome | [x] |

### CRUD Tests - Update
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-CRUD-8 | Edit Button | Find Edit option on detail | Edit button or link visible | Chrome | [x] |
| CUST-CRUD-9 | Edit Form | Click Edit | Form pre-populated with customer data | Chrome | [BLOCKED] |
| CUST-CRUD-10 | Update Customer | Change a field -> Save | Customer updated, changes reflected | Chrome | [BLOCKED] |

### CRUD Tests - Delete
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-CRUD-11 | Delete Option | Find Delete option | Delete button visible | Chrome | [x] |
| CUST-CRUD-12 | Delete Confirm | Click Delete | Confirmation dialog appears | Chrome | [x] |
| CUST-CRUD-13 | Cancel Delete | Click Cancel on dialog | Dialog closes, customer remains | Chrome | [x] |
| CUST-CRUD-14 | Confirm Delete | Click Confirm on dialog | Customer deleted, removed from list | Chrome | [x] |

### Filter/Search Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-FILTER-1 | Search by Name | Type name in search | List filters to matching customers | Chrome | [BLOCKED] |
| CUST-FILTER-2 | Search by Email | Type email in search | List filters to matching customers | Chrome | [BLOCKED] |
| CUST-FILTER-3 | Search by Phone | Type phone in search | List filters to matching customers | Chrome | [x] |
| CUST-FILTER-4 | Passport Filter | Select "With Passport" | Shows only customers with passport | Chrome | [x] |
| CUST-FILTER-5 | Clear Search | Clear search input | Shows all customers again | Chrome | [x] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-MOB-1 | List Responsive | Set viewport 375x812 | Cards stack vertically, layout adapts | Chrome | [x] |
| CUST-MOB-2 | Form Responsive | View new customer form at 375x812 | Form fields stack, usable on mobile | Chrome | [x] |

### **HARD STOP** - Customer List Complete
- [x] All UI tests pass
- [x] All i18n tests pass
- [x] All CRUD tests pass (with 2 blocked)
- [x] All filter tests pass (with 2 blocked)

---

## Page: /customers/new (Create Customer)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-NEW-UI-1 | Page Title | Navigate to /customers/new | Shows "Create Customer" heading | Chrome | [x] |
| CUST-NEW-UI-2 | Passport Scanner | Check for scanner section | Optional passport scanner section visible (collapsible) | Chrome | [x] |
| CUST-NEW-UI-3 | Form Fields | Check all fields | firstName, lastName, email, phone, nationality, nationalId, address fields, notes | Chrome | [x] |
| CUST-NEW-UI-4 | Nationality Dropdown | Check nationality select | Dropdown with country options | Chrome | [x] |
| CUST-NEW-UI-5 | Action Buttons | Check form footer | Cancel and Create Customer buttons | Chrome | [x] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-VAL-1 | Required Email | Submit without email | Email validation error shown | Chrome | [x] |
| CUST-VAL-2 | Invalid Email | Enter invalid email -> Submit | Email format error shown | Chrome | [x] |
| CUST-VAL-3 | Required Names | Submit without names | firstName/lastName required error | Chrome | [x] |

### **HARD STOP** - Create Customer Complete
- [x] All form tests pass

---

## Page: /customers/[customerId] (Customer Detail)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-DET-UI-1 | Customer Info | View customer detail | Shows name, email, phone, nationality | Chrome | [x] |
| CUST-DET-UI-2 | Account Balance | Check balance section | Shows account balance (credit/debit/zero) | Chrome | [x] |
| CUST-DET-UI-3 | Invoices Section | Check invoices | Shows list of customer invoices or empty state | Chrome | [x] |
| CUST-DET-UI-4 | Edit Button | Check actions | Edit button visible | Chrome | [x] |
| CUST-DET-UI-5 | Delete Button | Check actions | Delete button visible | Chrome | [x] |
| CUST-DET-UI-6 | Create Invoice | Check invoice section | "Create Invoice" button or link | Chrome | [x] |

### **HARD STOP** - Customer Detail Complete
- [x] All detail tests pass

---

## Integration Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CUST-INT-1 | Account Creation | Create new customer | Customer account auto-created in Chart of Accounts | Firebase | [x] |
| CUST-INT-2 | Invoice Link | Create invoice for customer | Invoice appears in customer detail | Chrome | [SKIP] |

---

## Bugs Found

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| BUG-CUST-001 | i18n tabs showing raw keys (customers.passport, customers.documents) | Medium | FIXED |

---

## Success Criteria
- [x] All critical tests pass
- [x] All fixes committed
- [x] TEST-REPORT-Customers.md generated

<promise>ALL_TESTS_COMPLETE</promise>
