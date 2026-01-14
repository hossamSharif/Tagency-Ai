# TEST-PLAN: Service-Based Invoice & Accounting System

Generated: 2026-01-10
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase
App URL: http://localhost:3001
Branch: 001-service-invoice-accounting

---

## Previously Tested Modules (Skipping)

The following modules have already been tested with passing results:
- Customers (TEST-REPORT-Customers.md) - 87% pass rate
- Partners (TEST-REPORT-Partners.md) - 100% pass rate
- Payments (TEST-REPORT-Payments.md) - 96% pass rate
- Accounts (TEST-REPORT-Accounts.md) - 98% pass rate
- Settings (TEST-REPORT-Settings.md) - 82% pass rate

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login with primary account | Navigate to /login → Enter hossamsharif1990@gmail.com / Hossam1990@ → Submit | Redirect to dashboard | Chrome MCP | [ ] |
| AUTH-2 | Verify session persists | Navigate to /services | Page loads without redirect to login | Chrome MCP | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Can access dashboard

---

## Module 1: Services Catalog (User Story 2)

### Page: /services - List View

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-UI-1 | Page loads | Navigate to /services | Services list page renders | Chrome MCP | [ ] |
| SVC-UI-2 | Page title displays | Check page header | Shows "Services" or Arabic equivalent | Chrome MCP | [ ] |
| SVC-UI-3 | Create button visible | Look for add/create button | "Add Service" or "+" button visible | Chrome MCP | [ ] |
| SVC-UI-4 | Empty state (if no services) | Check list when empty | Shows empty state message | Chrome MCP | [ ] |
| SVC-UI-5 | Service cards display | Check list with services | Each service shows name, price, type | Chrome MCP | [ ] |

#### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-i18n-1 | Page title translated | Check EN and AR | No raw translation keys | Chrome MCP | [ ] |
| SVC-i18n-2 | Service types translated | Check service type labels | Visa, Ticket, Hotel, Insurance display properly | Chrome MCP | [ ] |
| SVC-i18n-3 | Button labels translated | Check all buttons | No raw keys visible | Chrome MCP | [ ] |

#### CRUD Tests - Create
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-CR-1 | Navigate to create form | Click "Add Service" | Create service form opens | Chrome MCP | [ ] |
| SVC-CR-2 | Form fields present | Check form | Name, Price, Type, Provider type fields visible | Chrome MCP | [ ] |
| SVC-CR-3 | Create office service | Fill form with office provider → Submit | Service created successfully | Chrome MCP | [ ] |
| SVC-CR-4 | Create partner service | Fill form with partner provider → Submit | Service created with commission field | Chrome MCP | [ ] |
| SVC-CR-5 | Commission field required | Select partner provider, leave commission empty | Validation error shown | Chrome MCP | [ ] |
| SVC-CR-6 | Validation errors | Submit empty form | Required field errors shown | Chrome MCP | [ ] |

#### CRUD Tests - Read
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-RD-1 | View service detail | Click on service card | Service detail page/modal opens | Chrome MCP | [ ] |
| SVC-RD-2 | All fields displayed | Check detail view | Shows name, price, type, provider, commission | Chrome MCP | [ ] |

#### CRUD Tests - Update
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-UP-1 | Edit button visible | View service detail | Edit button present | Chrome MCP | [ ] |
| SVC-UP-2 | Edit form pre-populated | Click edit | Form shows current values | Chrome MCP | [ ] |
| SVC-UP-3 | Update service | Modify price → Save | Price updated in list | Chrome MCP | [ ] |

#### CRUD Tests - Delete
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-DL-1 | Delete button visible | View service detail | Delete button present | Chrome MCP | [ ] |
| SVC-DL-2 | Delete confirmation | Click delete | Confirmation dialog shown | Chrome MCP | [ ] |
| SVC-DL-3 | Delete unused service | Confirm delete | Service removed from list | Chrome MCP | [ ] |
| SVC-DL-4 | Cannot delete service in use | Try to delete service used in invoice | Warning/error shown | Chrome MCP | [ ] |

#### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-MOB-1 | Responsive layout | Set viewport 375x812 | List displays properly | Chrome MCP | [ ] |
| SVC-MOB-2 | Touch targets | Check buttons | Buttons are tappable size | Chrome MCP | [ ] |

### **HARD STOP** - Services Module Complete
- [ ] All CRUD operations work
- [ ] i18n is correct
- [ ] No console errors

---

## Module 2: Invoices (User Story 1, 9, 10)

### Page: /invoices - List View

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-UI-1 | Page loads | Navigate to /invoices | Invoice list page renders | Chrome MCP | [ ] |
| INV-UI-2 | Page title displays | Check page header | Shows "Invoices" or Arabic equivalent | Chrome MCP | [ ] |
| INV-UI-3 | Create button visible | Look for add/create button | "Create Invoice" button visible | Chrome MCP | [ ] |
| INV-UI-4 | Invoice cards display | Check list | Each invoice shows number, customer, total, status | Chrome MCP | [ ] |
| INV-UI-5 | Status badges | Check invoice statuses | Draft, Issued, Paid, Cancelled badges styled | Chrome MCP | [ ] |
| INV-UI-6 | Filter controls | Check filter options | Status filter, date filter visible | Chrome MCP | [ ] |

#### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-i18n-1 | Page title translated | Check EN and AR | No raw translation keys | Chrome MCP | [ ] |
| INV-i18n-2 | Status labels translated | Check status badges | Draft/Issued/Paid/Cancelled proper | Chrome MCP | [ ] |
| INV-i18n-3 | Filter labels translated | Check filters | All labels translated | Chrome MCP | [ ] |

### Page: /invoices/new - Create Invoice

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-1 | Form loads | Navigate to /invoices/new | Create invoice form renders | Chrome MCP | [ ] |
| INV-NEW-2 | Customer dropdown | Check customer field | Dropdown with customers visible | Chrome MCP | [ ] |
| INV-NEW-3 | Quick-add customer button | Look for "+" next to customer | Button visible and clickable | Chrome MCP | [ ] |
| INV-NEW-4 | Add service button | Look for "Add Service" | Button visible | Chrome MCP | [ ] |
| INV-NEW-5 | Service line item | Add a service | Service row with price appears | Chrome MCP | [ ] |
| INV-NEW-6 | Beneficiary fields | Add ticket/visa service | Beneficiary fields appear | Chrome MCP | [ ] |
| INV-NEW-7 | Attachment upload | Check attachment area | Upload button visible | Chrome MCP | [ ] |
| INV-NEW-8 | Total calculation | Add multiple services | Total updates automatically | Chrome MCP | [ ] |
| INV-NEW-9 | Discount field | Check discount input | Discount field present | Chrome MCP | [ ] |

#### Quick-Add Tests (User Story 10)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-QA-1 | Quick-add customer modal | Click "+" next to customer | Modal opens with customer form | Chrome MCP | [ ] |
| INV-QA-2 | Create customer in modal | Fill and submit | Customer created and selected | Chrome MCP | [ ] |
| INV-QA-3 | Quick-add partner modal | Click "+" next to partner in service | Modal opens with partner form | Chrome MCP | [ ] |
| INV-QA-4 | Quick-add service modal | Click "+" next to service dropdown | Modal opens with service form | Chrome MCP | [ ] |

#### CRUD Tests - Create
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-CR-1 | Create draft invoice | Select customer, add services → Save as Draft | Invoice saved with Draft status | Chrome MCP | [ ] |
| INV-CR-2 | Create issued invoice | Fill form → Issue | Invoice saved with Issued status | Chrome MCP | [ ] |
| INV-CR-3 | Invoice number generated | Create invoice | Unique invoice number assigned | Chrome MCP | [ ] |
| INV-CR-4 | Validation errors | Submit without customer | Required field error shown | Chrome MCP | [ ] |
| INV-CR-5 | Commission calculated | Add partner service | Commission amount shown | Chrome MCP | [ ] |
| INV-CR-6 | Beneficiary info saved | Add beneficiary to service → Save | Beneficiary data persists | Chrome MCP | [ ] |

### Page: /invoices/[id] - Invoice Detail

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DET-1 | Detail page loads | Click on invoice | Detail page renders | Chrome MCP | [ ] |
| INV-DET-2 | Invoice info displayed | Check header | Number, date, customer, status visible | Chrome MCP | [ ] |
| INV-DET-3 | Line items displayed | Check services section | All services with prices listed | Chrome MCP | [ ] |
| INV-DET-4 | Beneficiary info displayed | Check service details | Beneficiary name/ID shown | Chrome MCP | [ ] |
| INV-DET-5 | Totals displayed | Check totals section | Subtotal, discount, total visible | Chrome MCP | [ ] |
| INV-DET-6 | Action buttons | Check actions | Edit, Cancel, Print/PDF buttons | Chrome MCP | [ ] |

#### Update Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-UP-1 | Edit invoice | Click edit → Modify → Save | Changes saved | Chrome MCP | [ ] |
| INV-UP-2 | Edit issued invoice | Edit an issued invoice | Can edit with warning | Chrome MCP | [ ] |
| INV-UP-3 | Add service to existing | Edit → Add service → Save | New service added | Chrome MCP | [ ] |

#### Cancel Tests (User Story 9)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-CAN-1 | Cancel button visible | View invoice | Cancel button present | Chrome MCP | [ ] |
| INV-CAN-2 | Cancel dialog opens | Click cancel | Confirmation dialog with reason field | Chrome MCP | [ ] |
| INV-CAN-3 | Cancel draft invoice | Confirm cancel | Invoice status = Cancelled | Chrome MCP | [ ] |
| INV-CAN-4 | Cancel invoice with payments | Try to cancel | Shows payment status and refund options | Chrome MCP | [ ] |
| INV-CAN-5 | Balance reversed | Cancel issued invoice | Customer balance adjusted | Chrome MCP | [ ] |

#### PDF Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-PDF-1 | PDF download button | Check action buttons | Print/Download PDF button visible | Chrome MCP | [ ] |
| INV-PDF-2 | Generate PDF | Click download | PDF file downloads | Chrome MCP | [ ] |

#### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-MOB-1 | List responsive | Set viewport 375x812 | List displays properly | Chrome MCP | [ ] |
| INV-MOB-2 | Form responsive | View create form on mobile | Form fields stack properly | Chrome MCP | [ ] |
| INV-MOB-3 | Detail responsive | View detail on mobile | All info visible | Chrome MCP | [ ] |

### **HARD STOP** - Invoices Module Complete
- [ ] Can create invoice with services
- [ ] Quick-add modals work
- [ ] Can cancel invoice
- [ ] PDF generation works
- [ ] i18n is correct

---

## Module 3: Statements (User Story 5)

### Page: /statements

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-UI-1 | Page loads | Navigate to /statements | Statements page renders | Chrome MCP | [ ] |
| STM-UI-2 | Account type selector | Check selector | Customer/Partner tabs or dropdown | Chrome MCP | [ ] |
| STM-UI-3 | Account selector | Check account dropdown | List of accounts available | Chrome MCP | [ ] |
| STM-UI-4 | Date range filter | Check date inputs | From/To date pickers visible | Chrome MCP | [ ] |
| STM-UI-5 | Generate button | Check actions | Generate statement button visible | Chrome MCP | [ ] |

#### Statement View Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-VW-1 | Statement displays | Select account → Generate | Statement view renders | Chrome MCP | [ ] |
| STM-VW-2 | Opening balance | Check statement | Opening balance shown | Chrome MCP | [ ] |
| STM-VW-3 | Transactions listed | Check rows | Invoices and payments listed | Chrome MCP | [ ] |
| STM-VW-4 | Running balance | Check balance column | Running balance calculated | Chrome MCP | [ ] |
| STM-VW-5 | Closing balance | Check bottom | Closing balance shown | Chrome MCP | [ ] |
| STM-VW-6 | Date range applied | Use date filter | Only transactions in range shown | Chrome MCP | [ ] |

#### Customer Statement Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-CUST-1 | Customer statement | Select customer account | Shows customer invoices and payments | Chrome MCP | [ ] |
| STM-CUST-2 | Invoice entries | Check debits | Invoice amounts as debits | Chrome MCP | [ ] |
| STM-CUST-3 | Payment entries | Check credits | Payment amounts as credits | Chrome MCP | [ ] |

#### Partner Statement Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-PTR-1 | Partner statement | Select partner account | Shows partner transactions | Chrome MCP | [ ] |
| STM-PTR-2 | Commission breakdown | Check partner entries | Commission amounts visible | Chrome MCP | [ ] |
| STM-PTR-3 | Settlement entries | Check credits | Partner payments as credits | Chrome MCP | [ ] |

#### Export Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-EXP-1 | Export PDF button | Check actions | Export/Download PDF button visible | Chrome MCP | [ ] |
| STM-EXP-2 | Download PDF | Click export | PDF file downloads | Chrome MCP | [ ] |

#### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-i18n-1 | Page title translated | Check EN and AR | No raw translation keys | Chrome MCP | [ ] |
| STM-i18n-2 | Column headers translated | Check table headers | Date, Description, Debit, Credit, Balance | Chrome MCP | [ ] |
| STM-i18n-3 | Filter labels translated | Check filters | All labels proper | Chrome MCP | [ ] |

#### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STM-MOB-1 | Responsive layout | Set viewport 375x812 | Statement displays properly | Chrome MCP | [ ] |

### **HARD STOP** - Statements Module Complete
- [ ] Customer statements work
- [ ] Partner statements work
- [ ] PDF export works
- [ ] i18n is correct

---

## Module 4: Journal Entries (User Story 7)

### Page: /accounting/journal

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-UI-1 | Page loads | Navigate to /accounting/journal | Journal page renders | Chrome MCP | [ ] |
| JRN-UI-2 | Page title displays | Check header | "Journal Entries" or Arabic equivalent | Chrome MCP | [ ] |
| JRN-UI-3 | Date filter | Check filters | Date range picker visible | Chrome MCP | [ ] |
| JRN-UI-4 | Account filter | Check filters | Account selector visible | Chrome MCP | [ ] |
| JRN-UI-5 | Transaction type filter | Check filters | Type filter (Invoice/Payment/Expense) | Chrome MCP | [ ] |

#### Journal Table Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-TBL-1 | Entries display | Check table | Journal entries listed | Chrome MCP | [ ] |
| JRN-TBL-2 | Entry date shown | Check columns | Date column with dates | Chrome MCP | [ ] |
| JRN-TBL-3 | Entry number shown | Check columns | Entry/Reference number visible | Chrome MCP | [ ] |
| JRN-TBL-4 | Description shown | Check columns | Entry description visible | Chrome MCP | [ ] |
| JRN-TBL-5 | Debit/Credit shown | Check columns | Debit and Credit amounts | Chrome MCP | [ ] |
| JRN-TBL-6 | Account shown | Check columns | Account name visible | Chrome MCP | [ ] |

#### Filter Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-FLT-1 | Date filter works | Set date range | Only entries in range shown | Chrome MCP | [ ] |
| JRN-FLT-2 | Account filter works | Select account | Only entries for account shown | Chrome MCP | [ ] |
| JRN-FLT-3 | Clear filters | Clear all filters | All entries shown | Chrome MCP | [ ] |

#### Entry Detail Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-DET-1 | Click entry row | Click on entry | Detail view opens | Chrome MCP | [ ] |
| JRN-DET-2 | Entry details shown | Check detail | Full entry info with all lines | Chrome MCP | [ ] |
| JRN-DET-3 | Linked document | Check links | Link to invoice/payment | Chrome MCP | [ ] |

#### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-i18n-1 | Page title translated | Check EN and AR | No raw keys | Chrome MCP | [ ] |
| JRN-i18n-2 | Column headers translated | Check table | All headers translated | Chrome MCP | [ ] |
| JRN-i18n-3 | Filter labels translated | Check filters | All labels proper | Chrome MCP | [ ] |

#### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JRN-MOB-1 | Responsive layout | Set viewport 375x812 | Table displays properly | Chrome MCP | [ ] |

### **HARD STOP** - Journal Module Complete
- [ ] Journal entries display
- [ ] Filters work
- [ ] Entry details accessible
- [ ] i18n is correct

---

## Module 5: Expenses (User Story 8)

### Page: /accounting/expenses

#### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-UI-1 | Page loads | Navigate to /accounting/expenses | Expenses page renders | Chrome MCP | [ ] |
| EXP-UI-2 | Page title displays | Check header | "Expenses" or Arabic equivalent | Chrome MCP | [ ] |
| EXP-UI-3 | Create button visible | Look for add button | "Add Expense" button visible | Chrome MCP | [ ] |
| EXP-UI-4 | Expense list displays | Check list | Expenses shown with date, amount, category | Chrome MCP | [ ] |
| EXP-UI-5 | Empty state | Check when empty | Empty state message shown | Chrome MCP | [ ] |

#### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-i18n-1 | Page title translated | Check EN and AR | No raw translation keys | Chrome MCP | [ ] |
| EXP-i18n-2 | Category labels translated | Check categories | All categories proper | Chrome MCP | [ ] |
| EXP-i18n-3 | Form labels translated | Check form | All labels translated | Chrome MCP | [ ] |

#### CRUD Tests - Create
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-CR-1 | Navigate to create form | Click "Add Expense" | Create form opens | Chrome MCP | [ ] |
| EXP-CR-2 | Form fields present | Check form | Amount, Date, Category, Description, Payment method | Chrome MCP | [ ] |
| EXP-CR-3 | Create expense | Fill form → Submit | Expense created | Chrome MCP | [ ] |
| EXP-CR-4 | Validation errors | Submit empty form | Required field errors | Chrome MCP | [ ] |
| EXP-CR-5 | Attachment upload | Add receipt → Submit | Receipt attached to expense | Chrome MCP | [ ] |

#### CRUD Tests - Read
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-RD-1 | View expense detail | Click on expense | Detail view opens | Chrome MCP | [ ] |
| EXP-RD-2 | All fields displayed | Check detail | Amount, date, category, description visible | Chrome MCP | [ ] |
| EXP-RD-3 | Receipt displayed | Check attachments | Attached receipt visible | Chrome MCP | [ ] |

#### CRUD Tests - Update
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-UP-1 | Edit button visible | View expense detail | Edit button present | Chrome MCP | [ ] |
| EXP-UP-2 | Edit form pre-populated | Click edit | Form shows current values | Chrome MCP | [ ] |
| EXP-UP-3 | Update expense | Modify amount → Save | Amount updated | Chrome MCP | [ ] |

#### CRUD Tests - Delete
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-DL-1 | Delete button visible | View expense detail | Delete button present | Chrome MCP | [ ] |
| EXP-DL-2 | Delete confirmation | Click delete | Confirmation dialog shown | Chrome MCP | [ ] |
| EXP-DL-3 | Delete expense | Confirm delete | Expense removed, journal reversed | Chrome MCP | [ ] |

#### Accounting Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-ACC-1 | Journal entry created | Create expense | Journal entry generated | Chrome MCP | [ ] |
| EXP-ACC-2 | Expense account debited | Check journal | Expense account has debit | Chrome MCP | [ ] |
| EXP-ACC-3 | Cash/Bank credited | Check journal | Payment source has credit | Chrome MCP | [ ] |

#### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-MOB-1 | Responsive layout | Set viewport 375x812 | List displays properly | Chrome MCP | [ ] |
| EXP-MOB-2 | Form responsive | View create form on mobile | Form fields stack properly | Chrome MCP | [ ] |

### **HARD STOP** - Expenses Module Complete
- [ ] All CRUD operations work
- [ ] Journal entries created correctly
- [ ] i18n is correct

---

## Final Verification

### Cross-Module Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CROSS-1 | Invoice creates journal | Create and issue invoice | Journal entry in accounting | Chrome MCP | [ ] |
| CROSS-2 | Payment creates journal | Record customer payment | Journal entry in accounting | Chrome MCP | [ ] |
| CROSS-3 | Partner payment creates journal | Record partner payment | Journal entry in accounting | Chrome MCP | [ ] |
| CROSS-4 | Customer balance accurate | Check customer statement | Balance matches invoices - payments | Chrome MCP | [ ] |
| CROSS-5 | Partner balance accurate | Check partner statement | Balance matches commissions - payments | Chrome MCP | [ ] |

### Performance Criteria
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PERF-1 | Invoice creation < 5 min | Time invoice creation flow | Under 5 minutes | Manual | [ ] |
| PERF-2 | Payment recording < 1 min | Time payment recording | Under 1 minute | Manual | [ ] |
| PERF-3 | Statement generation < 30 sec | Time statement generation | Under 30 seconds | Manual | [ ] |

---

## Success Criteria

- All [ ] tests marked [x]
- All HARD STOPs verified
- All fixes committed with proper commit messages
- TEST-REPORT.md generated
- Screenshots saved for any failures
- Output `<promise>ALL_TESTS_COMPLETE</promise>` when done

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

backup_2:
  email: husameldeenh@gmail.com
  password: Hossam1990@
```

---

## Total Test Count

| Module | Tests |
|--------|-------|
| Authentication | 2 |
| Services | 25 |
| Invoices | 44 |
| Statements | 20 |
| Journal | 18 |
| Expenses | 24 |
| Cross-Module | 5 |
| Performance | 3 |
| **TOTAL** | **141** |
