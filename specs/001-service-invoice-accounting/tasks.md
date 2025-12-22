# Tasks: Service-Based Invoice & Accounting System

**Input**: Design documents from `/specs/001-service-invoice-accounting/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Tests**: Manual testing with Chrome MCP as per quickstart.md. No automated tests required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (Next.js App Router)
- **Types**: `frontend/src/types/models/`
- **Actions**: `frontend/src/app/actions/`
- **Pages**: `frontend/src/app/[locale]/(dashboard)/`
- **Components**: `frontend/src/components/features/`
- **Lib**: `frontend/src/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and base infrastructure for the accounting system

- [X] T001 [P] Create ServiceCatalogItem type in frontend/src/types/models/service-catalog.ts
- [X] T002 [P] Create Account type (Chart of Accounts) in frontend/src/types/models/account.ts
- [X] T003 [P] Create JournalEntry type in frontend/src/types/models/journal-entry.ts
- [X] T004 [P] Create Expense type in frontend/src/types/models/expense.ts
- [X] T005 [P] Extend Invoice type with beneficiary, version, lineItems in frontend/src/types/models/invoice.ts
- [X] T006 [P] Extend Payment type with partner payment fields in frontend/src/types/models/payment.ts
- [X] T007 [P] Create Zod schema for service catalog in frontend/src/lib/validations/services-catalog.ts
- [X] T008 [P] Create Zod schema for accounting in frontend/src/lib/validations/accounting.ts
- [X] T009 [P] Create Zod schema for expenses in frontend/src/lib/validations/expenses.ts
- [X] T010 Extend invoice validation schema in frontend/src/lib/validations/invoices.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core accounting infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Create journal entry helper utilities in frontend/src/lib/accounting/journal-entries.ts
- [X] T012 Create balance calculator utilities in frontend/src/lib/accounting/balance-calculator.ts
- [X] T013 Create sequential number generator utility in frontend/src/lib/accounting/number-generator.ts
- [X] T014 Create accounting server actions (getAccounts, createAccount, getJournalEntries) in frontend/src/app/actions/accounting.ts
- [X] T015 Add i18n messages for accounting/invoices/services in frontend/src/messages/en.json
- [X] T016 Add i18n messages for accounting/invoices/services in frontend/src/messages/ar.json

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Manage Predefined Services (Priority: P1) 🎯 MVP

**Goal**: Define and manage the catalog of services offered by the travel agency

**Independent Test**: Create, edit, and view services with all their attributes via Chrome MCP

**Why this comes first**: Services must exist before invoices can be created. This is foundational data for the invoicing system.

### Implementation for User Story 2

- [X] T017 [P] [US2] Create service catalog server actions (CRUD) in frontend/src/app/actions/services-catalog.ts
- [X] T018 [P] [US2] Create service-form component in frontend/src/components/features/services/service-form.tsx
- [X] T019 [P] [US2] Create service-list component in frontend/src/components/features/services/service-list.tsx
- [X] T020 [P] [US2] Create service-card component in frontend/src/components/features/services/service-card.tsx
- [X] T021 [US2] Create services list page in frontend/src/app/[locale]/(dashboard)/services/page.tsx
- [X] T022 [US2] Create service detail/edit page in frontend/src/app/[locale]/(dashboard)/services/[serviceId]/page.tsx
- [X] T023 [US2] Create new service page in frontend/src/app/[locale]/(dashboard)/services/new/page.tsx
- [X] T024 [US2] Add services navigation item to dashboard sidebar

**Checkpoint**: Service catalog is fully functional - staff can create, edit, and manage predefined services

---

## Phase 4: User Story 6 - Manage Chart of Accounts (Priority: P2)

**Goal**: Manage financial accounts including customer accounts, partner accounts, cash accounts, bank accounts, and expense accounts

**Independent Test**: Create accounts, view the chart of accounts, and verify default accounts exist via Chrome MCP

**Why this comes before invoicing**: Account structure is foundational for double-entry accounting. Default accounts must exist before invoices can create journal entries.

### Implementation for User Story 6

- [X] T025 [P] [US6] Create initializeDefaultAccounts function in frontend/src/lib/accounting/default-accounts.ts
- [X] T026 [P] [US6] Create account-list component in frontend/src/components/features/accounting/account-list.tsx
- [X] T027 [P] [US6] Create account-form component in frontend/src/components/features/accounting/account-form.tsx
- [X] T028 [US6] Extend accounting actions with account management in frontend/src/app/actions/accounting.ts
- [X] T029 [US6] Create chart of accounts page in frontend/src/app/[locale]/(dashboard)/accounting/accounts/page.tsx
- [X] T030 [US6] Add hook to create customer account when customer is created in frontend/src/app/actions/customers.ts
- [X] T031 [US6] Add hook to create partner account when partner is created in frontend/src/app/actions/partners.ts
- [X] T032 [US6] Add accounting navigation section to dashboard sidebar
- [X] T032.1 [US6] Integrate initializeDefaultAccounts into workspace creation/signup flow in frontend/src/app/actions/auth.ts

**Checkpoint**: ✅ Chart of accounts is functional - default accounts exist and auto-creation works for customers/partners

---

## Phase 5: User Story 1 - Create Service Invoice for Customer (Priority: P1) 🎯 MVP

**Goal**: Staff can create invoices by selecting customers and adding predefined services with beneficiary information and attachments

**Independent Test**: Create an invoice with multiple services for a customer and verify total calculation, document attachments, and beneficiary data are correctly stored via Chrome MCP

### Implementation for User Story 1

- [X] T033 [P] [US1] Create invoice-form component in frontend/src/components/features/invoices/invoice-form.tsx
- [X] T034 [P] [US1] Create service-line-item component in frontend/src/components/features/invoices/service-line-item.tsx
- [X] T035 [P] [US1] Create beneficiary-form component in frontend/src/components/features/invoices/beneficiary-form.tsx
- [X] T036 [P] [US1] Create attachment-uploader component in frontend/src/components/features/invoices/attachment-uploader.tsx
- [X] T037 [P] [US1] Create invoice-card component in frontend/src/components/features/invoices/invoice-card.tsx
- [X] T038 [P] [US1] Create invoice-detail component in frontend/src/components/features/invoices/invoice-detail.tsx
- [X] T039 [US1] Extend invoice server actions (create, update, issue) in frontend/src/app/actions/invoices.ts
- [X] T040 [US1] Add journal entry creation on invoice issue in frontend/src/app/actions/invoices.ts
- [X] T041 [US1] Create new invoice page in frontend/src/app/[locale]/(dashboard)/invoices/new/page.tsx
- [X] T042 [US1] Enhance invoice detail page in frontend/src/app/[locale]/(dashboard)/invoices/[invoiceId]/page.tsx
- [X] T043 [US1] Enhance invoice list page with filters in frontend/src/app/[locale]/(dashboard)/invoices/page.tsx
- [X] T044 [US1] Create invoice PDF generation in frontend/src/lib/pdf/invoice-template.tsx

**Checkpoint**: Invoice creation is fully functional - staff can create invoices with services, beneficiaries, and attachments ✅

---

## Phase 6: User Story 3 - Record Customer Payments (Priority: P1) 🎯 MVP

**Goal**: Staff can record payments received from customers against their outstanding balance

**Independent Test**: Record a payment from a customer, verify balance updates, and view payment history via Chrome MCP

### Implementation for User Story 3

- [ ] T045 [P] [US3] Create payment-form component in frontend/src/components/features/payments/customer-payment-form.tsx
- [ ] T046 [P] [US3] Create payment-list component in frontend/src/components/features/payments/payment-list.tsx
- [ ] T047 [P] [US3] Create payment-card component in frontend/src/components/features/payments/payment-card.tsx
- [ ] T048 [US3] Extend payment server actions (recordCustomerPayment, getCustomerBalance) in frontend/src/app/actions/payments.ts
- [ ] T049 [US3] Add journal entry creation on customer payment in frontend/src/app/actions/payments.ts
- [ ] T050 [US3] Update invoice status on payment (partial/paid) in frontend/src/app/actions/payments.ts
- [ ] T051 [US3] Enhance payments page for customer payments in frontend/src/app/[locale]/(dashboard)/payments/page.tsx
- [ ] T052 [US3] Create payment detail page in frontend/src/app/[locale]/(dashboard)/payments/[paymentId]/page.tsx

**Checkpoint**: Customer payment recording is fully functional - balance updates correctly and payment history is visible

---

## Phase 7: User Story 4 - Record Partner Payments (Priority: P2)

**Goal**: Staff can record payments made to partners for services they provided, with commission deduction

**Independent Test**: Record a payment to a partner, verify commission deduction, and view partner statement via Chrome MCP

### Implementation for User Story 4

- [ ] T053 [P] [US4] Create partner-payment-form component in frontend/src/components/features/payments/partner-payment-form.tsx
- [ ] T054 [P] [US4] Create partner-balance-card component in frontend/src/components/features/payments/partner-balance-card.tsx
- [ ] T055 [US4] Add recordPartnerPayment server action in frontend/src/app/actions/payments.ts
- [ ] T056 [US4] Add getPartnerBalance server action in frontend/src/app/actions/payments.ts
- [ ] T057 [US4] Add journal entry creation on partner payment in frontend/src/app/actions/payments.ts
- [ ] T058 [US4] Add partner payments section to payments page in frontend/src/app/[locale]/(dashboard)/payments/page.tsx
- [ ] T059 [US4] Update invoice commission status when partner is paid in frontend/src/app/actions/payments.ts

**Checkpoint**: Partner payment recording is fully functional - commission calculations work and partner balances are accurate

---

## Phase 8: User Story 5 - View Account Statements (Priority: P2)

**Goal**: Staff can view account statements for customers and partners with all transactions and running totals

**Independent Test**: Generate a statement for a customer or partner and verify all transactions appear correctly via Chrome MCP

### Implementation for User Story 5

- [ ] T060 [P] [US5] Create statement server actions in frontend/src/app/actions/statements.ts
- [ ] T061 [P] [US5] Create statement-view component in frontend/src/components/features/statements/statement-view.tsx
- [ ] T062 [P] [US5] Create statement-filters component in frontend/src/components/features/statements/statement-filters.tsx
- [ ] T063 [P] [US5] Create statement PDF template in frontend/src/lib/pdf/statement-template.tsx
- [ ] T064 [US5] Create statements page in frontend/src/app/[locale]/(dashboard)/statements/page.tsx
- [ ] T065 [US5] Add statement export functionality (PDF download) in frontend/src/components/features/statements/statement-view.tsx

**Checkpoint**: Account statements are fully functional - staff can view and export customer/partner statements

---

## Phase 9: User Story 7 - View Journal Entries and Transactions (Priority: P2)

**Goal**: Staff can view all financial transactions in a journal format with filters

**Independent Test**: Create various transactions and verify they appear in the journal with correct details via Chrome MCP

### Implementation for User Story 7

- [ ] T066 [P] [US7] Create journal-table component in frontend/src/components/features/accounting/journal-table.tsx
- [ ] T067 [P] [US7] Create journal-filters component in frontend/src/components/features/accounting/journal-filters.tsx
- [ ] T068 [P] [US7] Create journal-entry-detail component in frontend/src/components/features/accounting/journal-entry-detail.tsx
- [ ] T069 [US7] Add getJournalEntry server action in frontend/src/app/actions/accounting.ts
- [ ] T070 [US7] Create journal entries page in frontend/src/app/[locale]/(dashboard)/accounting/journal/page.tsx

**Checkpoint**: Journal view is fully functional - staff can view and filter all financial transactions

---

## Phase 10: User Story 8 - Record Business Expenses (Priority: P3)

**Goal**: Staff can record business expenses with categorization and documentation

**Independent Test**: Record an expense with attachments and verify it appears in the journal via Chrome MCP

### Implementation for User Story 8

- [ ] T071 [P] [US8] Create expense server actions in frontend/src/app/actions/expenses.ts
- [ ] T072 [P] [US8] Create expense-form component in frontend/src/components/features/expenses/expense-form.tsx
- [ ] T073 [P] [US8] Create expense-list component in frontend/src/components/features/expenses/expense-list.tsx
- [ ] T074 [P] [US8] Create expense-card component in frontend/src/components/features/expenses/expense-card.tsx
- [ ] T075 [US8] Create expenses page in frontend/src/app/[locale]/(dashboard)/accounting/expenses/page.tsx
- [ ] T076 [US8] Add journal entry creation on expense recording in frontend/src/app/actions/expenses.ts

**Checkpoint**: Business expense recording is fully functional - expenses create journal entries and update account balances

---

## Phase 11: User Story 9 - Cancel Invoice (Priority: P3)

**Goal**: Staff can cancel an invoice and reverse any financial entries

**Independent Test**: Cancel an invoice and verify the customer balance is reversed via Chrome MCP

### Implementation for User Story 9

- [ ] T077 [P] [US9] Create cancel-invoice-dialog component in frontend/src/components/features/invoices/cancel-invoice-dialog.tsx
- [ ] T078 [US9] Add cancelInvoice server action in frontend/src/app/actions/invoices.ts
- [ ] T079 [US9] Add reversal journal entry creation on cancel in frontend/src/app/actions/invoices.ts
- [ ] T080 [US9] Add cancellation UI to invoice detail page in frontend/src/app/[locale]/(dashboard)/invoices/[invoiceId]/page.tsx
- [ ] T081 [US9] Handle partial payments on cancellation (refund decision UI) in frontend/src/components/features/invoices/cancel-invoice-dialog.tsx

**Checkpoint**: Invoice cancellation is fully functional - financial entries are properly reversed

---

## Phase 12: User Story 10 - Quick-Add Entities from Invoice Page (Priority: P3)

**Goal**: Staff can quickly add new customers, partners, or services without navigating away from the invoice page

**Independent Test**: Open an invoice, click quick-add buttons, and verify new entities are created and selectable via Chrome MCP

### Implementation for User Story 10

- [ ] T082 [P] [US10] Create quick-add customer modal in frontend/src/components/features/invoices/quick-add-modals/customer-modal.tsx
- [ ] T083 [P] [US10] Create quick-add partner modal in frontend/src/components/features/invoices/quick-add-modals/partner-modal.tsx
- [ ] T084 [P] [US10] Create quick-add service modal in frontend/src/components/features/invoices/quick-add-modals/service-modal.tsx
- [ ] T085 [US10] Add quickAddCustomer server action in frontend/src/app/actions/customers.ts
- [ ] T086 [US10] Add quickAddPartner server action in frontend/src/app/actions/partners.ts
- [ ] T087 [US10] Add quickAddService server action in frontend/src/app/actions/services-catalog.ts
- [ ] T088 [US10] Integrate quick-add modals into invoice-form component in frontend/src/components/features/invoices/invoice-form.tsx

**Checkpoint**: Quick-add functionality is complete - staff can create entities without leaving the invoice page

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T089 [P] Implement optimistic locking error handling in invoice updates
- [ ] T090 [P] Add version conflict UI (reload prompt) across all forms
- [ ] T091 [P] Add loading states and error boundaries to all pages
- [ ] T092 [P] Add empty states for all list views
- [ ] T093 [P] Ensure RTL support for Arabic locale in all new components
- [ ] T094 [P] Add responsive design for mobile views
- [ ] T095 Validate all navigation links and breadcrumbs
- [ ] T096 Run quickstart.md validation checklist with Chrome MCP
- [ ] T097 Performance review - ensure invoice creation < 5 min, payment recording < 1 min

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational - Services must exist first
- **User Story 6 (Phase 4)**: Depends on Foundational - Accounts must exist for journal entries
- **User Story 1 (Phase 5)**: Depends on US2 (services) and US6 (accounts)
- **User Story 3 (Phase 6)**: Depends on US1 (invoices must exist) and US6 (accounts)
- **User Story 4 (Phase 7)**: Depends on US1 (invoices with partners) and US6 (accounts)
- **User Story 5 (Phase 8)**: Depends on US3 and US4 (transactions must exist)
- **User Story 7 (Phase 9)**: Depends on US1, US3, US4 (journal entries must exist)
- **User Story 8 (Phase 10)**: Depends on US6 (expense accounts)
- **User Story 9 (Phase 11)**: Depends on US1 and US3 (invoices and payments)
- **User Story 10 (Phase 12)**: Depends on US1 (invoice form must exist)
- **Polish (Phase 13)**: Depends on all user stories being complete

### User Story Priority Mapping

| Story | Priority | Phase | Description |
|-------|----------|-------|-------------|
| US2 | P1 | 3 | Manage Predefined Services |
| US6 | P2 | 4 | Manage Chart of Accounts |
| US1 | P1 | 5 | Create Service Invoice |
| US3 | P1 | 6 | Record Customer Payments |
| US4 | P2 | 7 | Record Partner Payments |
| US5 | P2 | 8 | View Account Statements |
| US7 | P2 | 9 | View Journal Entries |
| US8 | P3 | 10 | Record Business Expenses |
| US9 | P3 | 11 | Cancel Invoice |
| US10 | P3 | 12 | Quick-Add Entities |

### Within Each User Story

- Components can be created in parallel [P]
- Server actions must be created before pages that use them
- Pages depend on their components and actions

### Parallel Opportunities

- All Setup tasks (T001-T010) can run in parallel
- Foundational tasks T015-T016 (i18n) can run in parallel
- All component tasks within a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel once their dependencies are met

---

## Parallel Example: User Story 2 (Services)

```bash
# Launch all component tasks in parallel:
Task: "Create service-form component in frontend/src/components/features/services/service-form.tsx"
Task: "Create service-list component in frontend/src/components/features/services/service-list.tsx"
Task: "Create service-card component in frontend/src/components/features/services/service-card.tsx"
```

---

## Implementation Strategy

### MVP First (Services + Accounts + Invoices + Payments)

1. Complete Phase 1: Setup (types and validations)
2. Complete Phase 2: Foundational (accounting utilities)
3. Complete Phase 3: User Story 2 (service catalog)
4. Complete Phase 4: User Story 6 (chart of accounts)
5. Complete Phase 5: User Story 1 (invoice creation)
6. Complete Phase 6: User Story 3 (customer payments)
7. **STOP and VALIDATE**: Test core invoicing and payment flow
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US2 (Services) → Test independently → Service catalog usable
3. Add US6 (Accounts) → Test independently → Accounting foundation ready
4. Add US1 (Invoices) → Test independently → Can create invoices (MVP!)
5. Add US3 (Customer Payments) → Test independently → Revenue tracking (MVP complete!)
6. Add US4 (Partner Payments) → Test independently → Full payment cycle
7. Add remaining stories as needed

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual testing via Chrome MCP per quickstart.md
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All amounts use 2 decimal precision
- Single currency per workspace (from tenant settings)
