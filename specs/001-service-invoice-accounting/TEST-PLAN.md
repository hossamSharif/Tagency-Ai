# TEST-PLAN: Service-Based Invoice & Accounting System

Generated: 2026-01-05 20:45
Spec Source: specs/001-service-invoice-accounting/spec.md
Executed By: Claude Code + Ralph Wiggum

---

## 🔧 Environment

| Setting | Value |
|---------|-------|
| App URL | http://localhost:3002 |
| Database | Firebase |
| Auth Account | hossamsharif1990@gmail.com |
| Viewports | Desktop (1920x1080), Mobile (375x812) |

---

## 🔐 Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool |
|----|------|-------|----------|------|
| AUTH-1 | Login | Navigate to /login → Enter hossamsharif1990@gmail.com / Hossam1990@ → Submit | Redirect to dashboard | Chrome MCP |
| AUTH-2 | Session | Refresh page | Stay logged in | Chrome MCP |

### **HARD STOP** - Authentication Checkpoint
- [x] Logged in successfully
- [x] Correct user role
- [x] Session persisted

---

## 📄 Page: /services (User Story 2)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-UI-1 | Page Load | Navigate to /services | Page renders, no errors | Chrome | [ ] |
| SVC-UI-2 | Elements | Check all elements | All visible: title, "Add Service" button, service list/table | Chrome | [ ] |
| SVC-UI-3 | Empty State | If no services exist | Empty state message displayed | Chrome | [ ] |
| SVC-UI-4 | Loading State | Refresh page | Loading indicator appears briefly | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-i18n-1 | Translations EN | Set locale to English, scan page text | No keys like "services.title" visible | Chrome | [ ] |
| SVC-i18n-2 | Translations AR | Set locale to Arabic, scan page text | No keys like "services.title" visible | Chrome | [ ] |
| SVC-i18n-3 | RTL EN | English locale | Left-to-right layout | Chrome | [ ] |
| SVC-i18n-4 | RTL AR | Arabic locale | Right-to-left layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-CRUD-1 | List Services | Load page with existing services | All services displayed with name, price, type | Chrome + Firebase | [ ] |
| SVC-CRUD-2 | Navigate to Create | Click "Add Service" button | Redirect to /services/new | Chrome | [ ] |
| SVC-CRUD-3 | Navigate to Edit | Click on a service card/row | Redirect to /services/[serviceId] | Chrome | [ ] |
| SVC-CRUD-4 | Delete Prevention | Attempt to delete service used in invoices | Warning shown, deletion prevented | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-MOB-1 | Layout | Set viewport 375x812 | Responsive layout, no horizontal scroll | Chrome | [ ] |
| SVC-MOB-2 | RTL Mobile | Arabic locale, 375x812 | Correct RTL alignment | Chrome | [ ] |

### **HARD STOP** - Services List Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] All CRUD verified in Firebase
- [ ] Mobile tested

---

## 📄 Page: /services/new (User Story 2)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-NEW-UI-1 | Page Load | Navigate to /services/new | Form renders with all fields | Chrome | [ ] |
| SVC-NEW-UI-2 | Form Fields | Check form | Name, price, type dropdown, provider option visible | Chrome | [ ] |
| SVC-NEW-UI-3 | Partner Fields | Select "Partner" provider | Commission percentage field appears | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-NEW-i18n-1 | Translations EN | English locale | All labels translated correctly | Chrome | [ ] |
| SVC-NEW-i18n-2 | Translations AR | Arabic locale | All labels translated correctly | Chrome | [ ] |
| SVC-NEW-i18n-3 | RTL AR | Arabic locale | Form labels right-aligned | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-NEW-CRUD-1 | Create Office Service | Fill name="Test Service", price=100, type="Visa", provider="Office" → Submit | New service created in Firebase, redirect to /services | Chrome + Firebase | [ ] |
| SVC-NEW-CRUD-2 | Create Partner Service | Fill form with partner provider, commission=10% → Submit | Service created with commission field | Chrome + Firebase | [ ] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-NEW-VAL-1 | Required Name | Leave name empty → Submit | Error: "Name is required" | Chrome | [ ] |
| SVC-NEW-VAL-2 | Required Price | Leave price empty → Submit | Error: "Price is required" | Chrome | [ ] |
| SVC-NEW-VAL-3 | Required Commission | Select partner without commission → Submit | Error: "Commission is required for partner services" | Chrome | [ ] |
| SVC-NEW-VAL-4 | Positive Price | Enter negative price → Submit | Error: "Price must be positive" | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-NEW-MOB-1 | Layout | Set viewport 375x812 | Form fields stack vertically | Chrome | [ ] |
| SVC-NEW-MOB-2 | RTL Mobile | Arabic locale, 375x812 | Correct RTL form layout | Chrome | [ ] |

### **HARD STOP** - Create Service Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Service creation works in Firebase
- [ ] Validation works correctly
- [ ] Mobile tested

---

## 📄 Page: /services/[serviceId] (User Story 2)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-EDIT-UI-1 | Page Load | Navigate to existing service detail | Form pre-filled with service data | Chrome | [ ] |
| SVC-EDIT-UI-2 | All Fields Editable | Check form | All fields editable | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-EDIT-i18n-1 | Translations EN | English locale | All labels translated | Chrome | [ ] |
| SVC-EDIT-i18n-2 | Translations AR | Arabic locale | All labels translated | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-EDIT-CRUD-1 | Update Service | Change price → Submit | Service updated in Firebase | Chrome + Firebase | [ ] |
| SVC-EDIT-CRUD-2 | Update Type | Change service type → Submit | Type updated in Firebase | Chrome + Firebase | [ ] |
| SVC-EDIT-CRUD-3 | Update Commission | Change commission % → Submit | Commission updated in Firebase | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SVC-EDIT-MOB-1 | Layout | Set viewport 375x812 | Responsive form layout | Chrome | [ ] |

### **HARD STOP** - Edit Service Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Service updates work in Firebase
- [ ] Mobile tested

---

## 📄 Page: /accounting/accounts (User Story 6)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-UI-1 | Page Load | Navigate to /accounting/accounts | Chart of accounts page renders | Chrome | [ ] |
| ACC-UI-2 | Default Accounts | Check account list | Default accounts exist: Cash, Bank, Expenses | Chrome | [ ] |
| ACC-UI-3 | Account Categories | Check display | Accounts grouped by category (Assets, Liabilities, Income, Expenses) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| ACC-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| ACC-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-CRUD-1 | View Accounts | Load page | All accounts displayed with name, type, balance | Chrome + Firebase | [ ] |
| ACC-CRUD-2 | Create Account | Click "Add Account", fill form → Submit | New account created in Firebase | Chrome + Firebase | [ ] |
| ACC-CRUD-3 | Customer Account Auto-Create | Create a new customer | Customer account automatically created in chart | Chrome + Firebase | [ ] |
| ACC-CRUD-4 | Partner Account Auto-Create | Create a new partner | Partner account automatically created in chart | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACC-MOB-1 | Layout | Set viewport 375x812 | Responsive account list | Chrome | [ ] |

### **HARD STOP** - Chart of Accounts Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Default accounts exist
- [ ] Auto-creation works
- [ ] Mobile tested

---

## 📄 Page: /invoices (User Story 1)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-UI-1 | Page Load | Navigate to /invoices | Invoices list page renders | Chrome | [ ] |
| INV-UI-2 | Elements | Check all elements | Title, "New Invoice" button, filter controls, invoice list visible | Chrome | [ ] |
| INV-UI-3 | Empty State | If no invoices exist | Empty state message displayed | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| INV-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| INV-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-CRUD-1 | List Invoices | Load page with existing invoices | All invoices displayed with number, customer, date, total, status | Chrome + Firebase | [ ] |
| INV-CRUD-2 | Filter by Status | Select status filter | Invoices filtered correctly | Chrome | [ ] |
| INV-CRUD-3 | Navigate to Create | Click "New Invoice" button | Redirect to /invoices/new | Chrome | [ ] |
| INV-CRUD-4 | Navigate to Detail | Click on an invoice | Redirect to /invoices/[invoiceId] | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-MOB-1 | Layout | Set viewport 375x812 | Responsive invoice list | Chrome | [ ] |

### **HARD STOP** - Invoices List Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Invoice listing works
- [ ] Mobile tested

---

## 📄 Page: /invoices/new (User Story 1)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-UI-1 | Page Load | Navigate to /invoices/new | Invoice form renders | Chrome | [ ] |
| INV-NEW-UI-2 | Form Fields | Check form | Customer dropdown, date picker, "Add Service" button visible | Chrome | [ ] |
| INV-NEW-UI-3 | Quick-Add Buttons | Check form | "+" buttons next to customer, partner, service dropdowns (US10) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-i18n-1 | Translations EN | English locale | All labels translated | Chrome | [ ] |
| INV-NEW-i18n-2 | Translations AR | Arabic locale | All labels translated | Chrome | [ ] |
| INV-NEW-i18n-3 | RTL AR | Arabic locale | Right-aligned form layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-CRUD-1 | Create Simple Invoice | Select customer, add 1 service → Submit | Invoice created in Firebase, redirect to detail | Chrome + Firebase | [ ] |
| INV-NEW-CRUD-2 | Create Multi-Service Invoice | Select customer, add 3 services → Submit | Invoice created with all 3 services | Chrome + Firebase | [ ] |
| INV-NEW-CRUD-3 | Add Beneficiary | Add service requiring beneficiary, fill beneficiary fields | Beneficiary data saved with service line item | Chrome + Firebase | [ ] |
| INV-NEW-CRUD-4 | Attach Document | Add service, upload document | Document uploaded to Firebase Storage, linked to service | Chrome + Firebase | [ ] |
| INV-NEW-CRUD-5 | Total Calculation | Add services with prices 100, 200, 50 | Total displays 350 | Chrome | [ ] |
| INV-NEW-CRUD-6 | Partner Service | Add partner-provided service | Partner selected, commission recorded | Chrome + Firebase | [ ] |
| INV-NEW-CRUD-7 | Journal Entry on Issue | Create and issue invoice | Journal entry created (DR: Customer, CR: Income) | Chrome + Firebase | [ ] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-VAL-1 | Required Customer | Leave customer empty → Submit | Error: "Customer is required" | Chrome | [ ] |
| INV-NEW-VAL-2 | Required Service | Try to submit without services | Error: "At least one service required" | Chrome | [ ] |

### Quick-Add Tests (User Story 10)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-QA-1 | Quick-Add Customer | Click "+" next to customer dropdown | Modal opens with customer form | Chrome | [ ] |
| INV-NEW-QA-2 | Quick-Add Customer Save | Fill customer form in modal → Save | Modal closes, new customer auto-selected | Chrome + Firebase | [ ] |
| INV-NEW-QA-3 | Quick-Add Partner | Click "+" next to partner dropdown | Modal opens with partner form | Chrome | [ ] |
| INV-NEW-QA-4 | Quick-Add Service | Click "+" next to service dropdown | Modal opens with service form | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-NEW-MOB-1 | Layout | Set viewport 375x812 | Responsive form layout | Chrome | [ ] |
| INV-NEW-MOB-2 | Service Line Items | Mobile view | Service line items stack vertically | Chrome | [ ] |

### **HARD STOP** - Create Invoice Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Invoice creation works in Firebase
- [ ] Journal entries created correctly
- [ ] Quick-add modals work
- [ ] Validation works
- [ ] Mobile tested

---

## 📄 Page: /invoices/[invoiceId] (User Story 1, 9)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DTL-UI-1 | Page Load | Navigate to existing invoice | Invoice detail renders with all data | Chrome | [ ] |
| INV-DTL-UI-2 | All Fields Display | Check display | Customer, date, services, beneficiaries, attachments, total shown | Chrome | [ ] |
| INV-DTL-UI-3 | Edit Mode | Click "Edit" button | Form becomes editable | Chrome | [ ] |
| INV-DTL-UI-4 | Cancel Button | Check for cancel button (US9) | "Cancel Invoice" button visible | Chrome | [ ] |
| INV-DTL-UI-5 | PDF Download | Check for PDF button | "Download PDF" button visible | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DTL-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| INV-DTL-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| INV-DTL-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DTL-CRUD-1 | View Invoice | Load invoice detail | All invoice data displays correctly | Chrome + Firebase | [ ] |
| INV-DTL-CRUD-2 | Edit Invoice | Change service quantity/price → Save | Invoice updated in Firebase | Chrome + Firebase | [ ] |
| INV-DTL-CRUD-3 | Status Display | Check status badge | Correct status (Draft, Issued, Paid, etc.) | Chrome | [ ] |
| INV-DTL-CRUD-4 | Cancel Invoice (US9) | Click "Cancel Invoice" → Confirm with reason | Invoice status = "Cancelled", balance reversed | Chrome + Firebase | [ ] |
| INV-DTL-CRUD-5 | Cancel with Payments (US9) | Cancel invoice with partial payments | Refund decision UI shown, handled correctly | Chrome + Firebase | [ ] |
| INV-DTL-CRUD-6 | Cancelled Display (US9) | View cancelled invoice | Clearly marked with cancellation date and reason | Chrome | [ ] |
| INV-DTL-CRUD-7 | PDF Generation | Click "Download PDF" | PDF generated and downloaded | Chrome | [ ] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DTL-VAL-1 | Optimistic Locking | Simulate concurrent edit (modify version in Firebase) → Save | Error: "Data Updated" dialog, reload prompt | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INV-DTL-MOB-1 | Layout | Set viewport 375x812 | Responsive invoice detail | Chrome | [ ] |

### **HARD STOP** - Invoice Detail Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Invoice viewing/editing works
- [ ] Cancel functionality works (US9)
- [ ] PDF generation works
- [ ] Optimistic locking works
- [ ] Mobile tested

---

## 📄 Page: /payments (User Story 3, 4)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-UI-1 | Page Load | Navigate to /payments | Payments page renders | Chrome | [ ] |
| PAY-UI-2 | Elements | Check all elements | "Record Payment" button, payment list, filters visible | Chrome | [ ] |
| PAY-UI-3 | Customer Payments Section | Check display | Customer payments section visible | Chrome | [ ] |
| PAY-UI-4 | Partner Payments Section | Check display | Partner payments section visible (US4) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| PAY-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| PAY-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests - Customer Payments (User Story 3)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-CUST-CRUD-1 | List Payments | Load page | All customer payments displayed | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-2 | Record Payment | Click "Record Payment", select customer, amount=100, method=Cash → Submit | Payment recorded, customer balance updated | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-3 | Balance Update | Record payment | Customer account credited, cash account debited | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-4 | Transaction Number | Record payment | Unique transaction number generated | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-5 | Attach Receipt | Record payment with attachment | Document stored with payment record | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-6 | Payment History | View customer payments | All payments listed with dates, amounts, methods, running balance | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-7 | Invoice Status Update | Pay full invoice amount | Invoice status changes to "Paid" | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-8 | Partial Payment | Pay partial amount | Invoice status changes to "Partially Paid" | Chrome + Firebase | [ ] |
| PAY-CUST-CRUD-9 | Journal Entry | Record payment | Journal entry created (DR: Cash/Bank, CR: Customer Account) | Chrome + Firebase | [ ] |

### CRUD Tests - Partner Payments (User Story 4)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-PART-CRUD-1 | View Outstanding | Navigate to partner payments | Outstanding amounts owed to each partner displayed | Chrome + Firebase | [ ] |
| PAY-PART-CRUD-2 | Record Partner Payment | Select partner, enter amount → Submit | Gross amount, commission, net payable shown | Chrome + Firebase | [ ] |
| PAY-PART-CRUD-3 | Commission Deduction | Record payment for partner with 10% commission on 1000 | Shows: Gross=1000, Commission=100, Net=900 | Chrome + Firebase | [ ] |
| PAY-PART-CRUD-4 | Account Updates | Record partner payment | Partner account credited, cash/bank account debited | Chrome + Firebase | [ ] |
| PAY-PART-CRUD-5 | Partner Statement | View partner statement | All transactions shown with commission breakdown | Chrome + Firebase | [ ] |
| PAY-PART-CRUD-6 | Commission Status | Pay partner for invoice | Invoice commission status updated | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-MOB-1 | Layout | Set viewport 375x812 | Responsive payment list | Chrome | [ ] |

### **HARD STOP** - Payments Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Customer payment recording works (US3)
- [ ] Partner payment recording works (US4)
- [ ] Journal entries created correctly
- [ ] Mobile tested

---

## 📄 Page: /payments/[paymentId] (User Story 3, 4)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-DTL-UI-1 | Page Load | Navigate to payment detail | Payment detail renders | Chrome | [ ] |
| PAY-DTL-UI-2 | All Fields Display | Check display | Amount, date, method, transaction number, attachments shown | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-DTL-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| PAY-DTL-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-DTL-CRUD-1 | View Payment | Load payment detail | All payment data displays correctly | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PAY-DTL-MOB-1 | Layout | Set viewport 375x812 | Responsive payment detail | Chrome | [ ] |

### **HARD STOP** - Payment Detail Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Payment viewing works
- [ ] Mobile tested

---

## 📄 Page: /statements (User Story 5)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STMT-UI-1 | Page Load | Navigate to /statements | Statements page renders | Chrome | [ ] |
| STMT-UI-2 | Elements | Check all elements | Account selector, date range filters, "Generate Statement" button visible | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STMT-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| STMT-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| STMT-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STMT-CRUD-1 | Generate Customer Statement | Select customer, set date range → Generate | Statement shows opening balance, transactions, closing balance | Chrome + Firebase | [ ] |
| STMT-CRUD-2 | Generate Partner Statement | Select partner, set date range → Generate | Statement shows transactions with commission breakdown | Chrome + Firebase | [ ] |
| STMT-CRUD-3 | Transaction Lines | Check statement content | Each line shows date, description, debit, credit, running balance | Chrome | [ ] |
| STMT-CRUD-4 | Export PDF | Click "Export PDF" | Statement downloaded as PDF in <30 seconds | Chrome | [ ] |
| STMT-CRUD-5 | Date Filter | Change date range → Regenerate | Only transactions in range shown | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STMT-MOB-1 | Layout | Set viewport 375x812 | Responsive statement view | Chrome | [ ] |

### **HARD STOP** - Statements Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Statement generation works
- [ ] PDF export works (<30 sec)
- [ ] Mobile tested

---

## 📄 Page: /accounting/journal (User Story 7)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JNL-UI-1 | Page Load | Navigate to /accounting/journal | Journal page renders | Chrome | [ ] |
| JNL-UI-2 | Elements | Check all elements | Journal entries table, filters (date, account, type) visible | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JNL-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| JNL-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| JNL-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JNL-CRUD-1 | List Entries | Load page | All journal entries listed chronologically | Chrome + Firebase | [ ] |
| JNL-CRUD-2 | Filter by Date | Set date range filter → Apply | Only entries in range shown | Chrome | [ ] |
| JNL-CRUD-3 | Filter by Account | Select account filter → Apply | Only entries affecting that account shown | Chrome | [ ] |
| JNL-CRUD-4 | Filter by Type | Select type filter → Apply | Only entries of that type shown | Chrome | [ ] |
| JNL-CRUD-5 | Entry Detail | Click on journal entry | Full details shown with linked invoice/payment | Chrome + Firebase | [ ] |
| JNL-CRUD-6 | Audit Trail | Check entries | All financial transactions visible (invoices, payments, expenses) | Chrome + Firebase | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| JNL-MOB-1 | Layout | Set viewport 375x812 | Responsive journal table | Chrome | [ ] |

### **HARD STOP** - Journal Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Journal listing works
- [ ] Filters work correctly
- [ ] Mobile tested

---

## 📄 Page: /accounting/expenses (User Story 8)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-UI-1 | Page Load | Navigate to /accounting/expenses | Expenses page renders | Chrome | [ ] |
| EXP-UI-2 | Elements | Check all elements | "Record Expense" button, expense list visible | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-i18n-1 | Translations EN | English locale | No translation keys visible | Chrome | [ ] |
| EXP-i18n-2 | Translations AR | Arabic locale | No translation keys visible | Chrome | [ ] |
| EXP-i18n-3 | RTL AR | Arabic locale | Right-aligned layout | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-CRUD-1 | List Expenses | Load page | All expenses displayed | Chrome + Firebase | [ ] |
| EXP-CRUD-2 | Record Expense | Click "Record Expense", fill form (amount=500, category="Rent", method=Cash) → Submit | Expense recorded in Firebase | Chrome + Firebase | [ ] |
| EXP-CRUD-3 | Attach Receipt | Record expense with attachment | Receipt stored with expense record | Chrome + Firebase | [ ] |
| EXP-CRUD-4 | Journal Entry | Record expense | Expense account debited, cash/bank credited | Chrome + Firebase | [ ] |
| EXP-CRUD-5 | Account Balance | Record cash expense | Cash account balance decreased | Chrome + Firebase | [ ] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-VAL-1 | Required Amount | Leave amount empty → Submit | Error: "Amount is required" | Chrome | [ ] |
| EXP-VAL-2 | Required Category | Leave category empty → Submit | Error: "Category is required" | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXP-MOB-1 | Layout | Set viewport 375x812 | Responsive expense list | Chrome | [ ] |

### **HARD STOP** - Expenses Page Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] Expense recording works
- [ ] Journal entries created
- [ ] Mobile tested

---

## 🚨 Blocked Protocol

If unable to proceed after 3 attempts on any test:

1. Mark test as BLOCKED
2. Document in this section:
   - Issue description
   - Error messages
   - Attempted solutions
3. Continue to next test
4. If >50% tests blocked: Output `<promise>BLOCKED</promise>`

### Blocked Issues
*(None yet)*

---

## ✅ Success Criteria

All must be true to output `<promise>ALL_TESTS_COMPLETE</promise>`:

- [ ] All test cases marked [x]
- [ ] All HARD STOPs passed
- [ ] All fixes committed to git
- [ ] TEST-REPORT.md generated
- [ ] Screenshots saved for failures

---

## 🔄 Ralph Wiggum Execution

Run this plan with:

```bash
/ralph-loop "Execute specs/001-service-invoice-accounting/TEST-PLAN.md autonomously.

RULES:
1. Read each test case in order
2. Execute using specified MCP tool
3. Mark [x] when passed
4. Fix failures immediately, commit with: git commit -m 'fix([scope]): [desc]'
5. Re-test after fix
6. Pause at HARD STOP markers for verification
7. Log console errors to report (don't stop)
8. Take screenshots on failure
9. After 3 failed fix attempts: mark BLOCKED, continue

OUTPUT:
- <promise>BLOCKED</promise> if >50% tests blocked
- <promise>ALL_TESTS_COMPLETE</promise> when all pass
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## 📊 Test Summary

| User Story | Pages | Total Tests |
|------------|-------|-------------|
| US2 - Services | /services, /services/new, /services/[serviceId] | 42 |
| US6 - Accounts | /accounting/accounts | 12 |
| US1 - Invoices | /invoices, /invoices/new, /invoices/[invoiceId] | 58 |
| US3 - Customer Payments | /payments, /payments/[paymentId] | 22 |
| US4 - Partner Payments | /payments | 12 |
| US5 - Statements | /statements | 15 |
| US7 - Journal | /accounting/journal | 18 |
| US8 - Expenses | /accounting/expenses | 16 |
| US9 - Cancel Invoice | /invoices/[invoiceId] | (included in US1) |
| US10 - Quick-Add | /invoices/new | (included in US1) |
| **Total** | **9 pages** | **195 tests** |

---

## 📝 Notes

- Auth checkpoint must pass before any other tests
- Each page has HARD STOP checkpoint - verify all tests pass before proceeding
- i18n tests check both English and Arabic with RTL verification
- CRUD tests verify Firebase data correctness
- Mobile tests check responsive design at 375x812
- Commission calculations must be 100% accurate (Success Criteria SC-009)
- Invoice creation target: <5 minutes (Success Criteria SC-001)
- Payment recording target: <1 minute (Success Criteria SC-002)
- Statement export target: <30 seconds (Success Criteria SC-004)
