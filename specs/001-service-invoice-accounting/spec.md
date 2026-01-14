# Feature Specification: Service-Based Invoice & Accounting System

**Feature Branch**: `001-service-invoice-accounting`
**Created**: 2024-12-22
**Status**: Draft
**Input**: User description: "New approach replacing packages/reservations with service-based invoicing, including accounting, payments, partner commissions, and financial management for travel agency"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Service Invoice for Customer (Priority: P1)

A travel agency staff member needs to create an invoice for a customer who wants to book multiple travel services. The staff member selects or creates a customer, adds predefined services (visa, tickets, etc.) to the invoice, attaches relevant documents (passports, IDs), and adds beneficiary information for each service.

**Why this priority**: This is the core business transaction - without invoicing, no revenue can be generated. All other features depend on invoices existing.

**Independent Test**: Can be fully tested by creating an invoice with multiple services for a customer and verifying the total calculation, document attachments, and beneficiary data are correctly stored.

**Acceptance Scenarios**:

1. **Given** a logged-in staff member, **When** they navigate to create invoice, **Then** they see a form with customer selection, date, and service addition capabilities
2. **Given** the invoice form is open, **When** the staff member clicks "Add Customer" button next to customer dropdown, **Then** a modal opens to create a new customer without leaving the invoice page
3. **Given** the invoice form has a customer selected, **When** the staff member adds a service, **Then** they can select from predefined services and the price auto-populates
4. **Given** a service is added to the invoice, **When** the service type requires beneficiary information (ticket, visa), **Then** optional fields appear for name, ID, phone, and relationship to customer
5. **Given** a service is added, **When** the staff member clicks "Attach Document", **Then** they can upload PDF or image files (passport, ID, etc.)
6. **Given** multiple services are added, **When** viewing the invoice, **Then** the total is calculated as sum of all service prices minus any discounts
7. **Given** a service is provided by a partner, **When** selecting that service, **Then** the partner is selected and commission is recorded for calculations

---

### User Story 2 - Manage Predefined Services (Priority: P1)

An office administrator needs to define and manage the catalog of services offered by the travel agency, including prices, types, and whether they are provided directly or through partners.

**Why this priority**: Services must exist before invoices can be created. This is foundational data for the invoicing system.

**Independent Test**: Can be fully tested by creating, editing, and viewing services with all their attributes.

**Acceptance Scenarios**:

1. **Given** a logged-in administrator, **When** they navigate to Services page, **Then** they see a list of all predefined services with name, price, and type
2. **Given** the services list is displayed, **When** clicking "Add Service", **Then** a form appears with fields for name, price, type (visa, ticket, hotel, insurance, etc.), and provider option (office direct or partner)
3. **Given** a service is being created with partner provision, **When** partner is selected, **Then** a commission percentage field becomes required
4. **Given** existing services exist, **When** editing a service, **Then** all fields are editable and changes persist
5. **Given** a service is in use on invoices, **When** attempting to delete it, **Then** system prevents deletion and shows warning

---

### User Story 3 - Record Customer Payments (Priority: P1)

A staff member needs to record payments received from customers against their outstanding balance, tracking the payment method (cash or bank), amount, date, and transaction reference.

**Why this priority**: Revenue collection is critical for business operations. Without payment recording, financial tracking is impossible.

**Independent Test**: Can be fully tested by recording a payment from a customer, verifying balance updates, and viewing payment history.

**Acceptance Scenarios**:

1. **Given** a customer with outstanding balance, **When** staff navigates to payments, **Then** they can record a payment specifying amount, date, and payment method (cash/bank account)
2. **Given** a payment is being recorded, **When** the payment is saved, **Then** the customer's account balance is credited and the selected cash/bank account is updated
3. **Given** a payment is recorded, **When** staff attaches a receipt or proof, **Then** the document is stored with the payment record
4. **Given** payment is recorded, **When** the transaction is saved, **Then** a unique transaction number is generated
5. **Given** multiple payments exist, **When** viewing customer's payment history, **Then** all payments are listed with dates, amounts, methods, and running balance

---

### User Story 4 - Record Partner Payments (Priority: P2)

A staff member needs to record payments made to partners for services they provided, deducting the office commission and tracking the payment.

**Why this priority**: Partner relationships and payables management is essential but secondary to customer-facing transactions.

**Independent Test**: Can be fully tested by recording a payment to a partner, verifying commission deduction, and viewing partner statement.

**Acceptance Scenarios**:

1. **Given** services were provided by a partner, **When** staff navigates to partner payments, **Then** they see outstanding amounts owed to each partner
2. **Given** a partner payment is being recorded, **When** staff enters payment details, **Then** the system shows the gross amount, office commission, and net payable
3. **Given** a partner payment is recorded, **When** saved, **Then** the partner's account is credited and the office cash/bank account is debited
4. **Given** a partner payment has been made, **When** viewing partner statement, **Then** all transactions show with commission breakdown

---

### User Story 5 - View Account Statements (Priority: P2)

A staff member needs to view account statements for customers and partners showing all transactions, balances, and a running total over a specified period.

**Why this priority**: Financial visibility is essential for business management but depends on invoicing and payment recording being in place.

**Independent Test**: Can be fully tested by generating a statement for a customer or partner and verifying all transactions appear correctly.

**Acceptance Scenarios**:

1. **Given** a customer or partner account, **When** staff requests a statement, **Then** they can specify a date range for the report
2. **Given** statement parameters are set, **When** generating the statement, **Then** it shows opening balance, all transactions (invoices, payments), and closing balance
3. **Given** a statement is generated, **When** viewing it, **Then** each line shows date, description, debit, credit, and running balance
4. **Given** a statement is displayed, **When** staff clicks export, **Then** the statement can be downloaded as PDF

---

### User Story 6 - Manage Chart of Accounts (Priority: P2)

An administrator needs to manage financial accounts including customer accounts, partner accounts, cash accounts, bank accounts, and expense accounts.

**Why this priority**: Account structure is foundational for accounting but can initially use default accounts.

**Independent Test**: Can be fully tested by creating accounts, viewing the chart of accounts, and verifying default accounts exist.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** workspace is created, **Then** default accounts are automatically created (Cash, Bank, Expenses)
2. **Given** a new customer is created, **When** saved, **Then** a corresponding customer account is automatically created in the chart of accounts
3. **Given** a new partner is created, **When** saved, **Then** a corresponding partner account is automatically created
4. **Given** administrator views chart of accounts, **When** displayed, **Then** all accounts are listed by category (Assets, Liabilities, Income, Expenses)
5. **Given** administrator needs a new account, **When** creating one, **Then** they specify name, type, and parent category

---

### User Story 7 - View Journal Entries and Transactions (Priority: P2)

A staff member needs to view all financial transactions in a journal format, filterable by date range, account, or transaction type.

**Why this priority**: Audit trail and financial reporting are important but secondary to transaction recording.

**Independent Test**: Can be fully tested by creating various transactions and verifying they appear in the journal with correct details.

**Acceptance Scenarios**:

1. **Given** financial transactions have occurred, **When** staff views the journal, **Then** all entries are listed chronologically
2. **Given** the journal is displayed, **When** filtering by date range, **Then** only entries within that period appear
3. **Given** the journal is displayed, **When** filtering by account, **Then** only entries affecting that account appear
4. **Given** a journal entry is viewed, **When** clicking on it, **Then** full details are shown including linked invoice/payment

---

### User Story 8 - Record Business Expenses (Priority: P3)

A staff member needs to record business expenses (rent, utilities, supplies, etc.) with categorization and documentation.

**Why this priority**: Expense tracking is important for profitability but not critical for core invoicing operations.

**Independent Test**: Can be fully tested by recording an expense with attachments and verifying it appears in the journal.

**Acceptance Scenarios**:

1. **Given** an expense needs recording, **When** staff navigates to expenses, **Then** they can create a new expense entry
2. **Given** expense form is open, **When** entering details, **Then** they specify amount, date, category, description, and payment method
3. **Given** an expense is recorded, **When** saved, **Then** the appropriate expense account is debited and cash/bank account is credited
4. **Given** expense has supporting documents, **When** attaching them, **Then** receipts or invoices are stored with the record

---

### User Story 9 - Cancel Invoice (Priority: P3)

A staff member needs to cancel an invoice when services are no longer required, reversing any financial entries.

**Why this priority**: Cancellation is an exception flow that should be available but is not part of normal operations.

**Independent Test**: Can be fully tested by canceling an invoice and verifying the customer balance is reversed.

**Acceptance Scenarios**:

1. **Given** an existing invoice, **When** staff selects cancel, **Then** a confirmation dialog appears with reason field
2. **Given** cancellation is confirmed, **When** processed, **Then** the invoice status changes to "Cancelled" and customer balance is adjusted
3. **Given** an invoice has partial payments, **When** cancelling, **Then** the system shows the payment status and requires decision on refund handling
4. **Given** an invoice is cancelled, **When** viewing it, **Then** it is clearly marked as cancelled with cancellation date and reason

---

### User Story 10 - Quick-Add Entities from Invoice Page (Priority: P3)

A staff member creating an invoice needs to quickly add a new customer, partner, or service without navigating away from the invoice page.

**Why this priority**: UX improvement that enhances productivity but core functionality works without it.

**Independent Test**: Can be fully tested by opening an invoice, clicking quick-add buttons, and verifying new entities are created and selectable.

**Acceptance Scenarios**:

1. **Given** the invoice form is open, **When** staff clicks the "+" button next to customer dropdown, **Then** a modal opens with customer creation form
2. **Given** customer creation modal is open, **When** saving a new customer, **Then** the modal closes and the new customer is auto-selected in the invoice
3. **Given** the invoice form is open, **When** staff clicks "+" next to partner dropdown in a service line, **Then** partner creation modal opens
4. **Given** the invoice form is open, **When** staff clicks "+" next to service dropdown, **Then** service creation modal opens

---

### Edge Cases

- What happens when a customer has a negative balance (overpayment)?
  - System allows overpayment, shows credit balance, and can be applied to future invoices
- What happens when recording a payment larger than the outstanding balance?
  - System accepts payment and creates a credit balance for the customer
- What happens when a partner is deleted but has outstanding payables?
  - System prevents deletion until all payables are settled
- What happens when service price changes after being added to unpaid invoices?
  - Existing invoices retain the original price; only new additions use the updated price
- What happens when attachment upload fails?
  - User is notified, invoice can still be saved, and attachment can be retried
- What happens when cash/bank account balance goes negative?
  - System warns but allows (for overdraft or accounting adjustments)
- What happens when two users edit the same invoice simultaneously?
  - Optimistic locking is used; the second user to save receives an error and must reload to see latest changes before editing

## Requirements *(mandatory)*

### Functional Requirements

#### Invoice Management
- **FR-001**: System MUST allow users to create invoices with customer selection, date, and optional attachments
- **FR-002**: System MUST allow adding multiple services to a single invoice
- **FR-003**: System MUST calculate invoice total as sum of service prices minus discounts
- **FR-004**: System MUST track commission totals from partner-provided services
- **FR-005**: System MUST support invoice statuses: Draft, Issued, Partially Paid, Paid, Cancelled
- **FR-006**: System MUST allow invoice cancellation with reason tracking and balance reversal
- **FR-007**: System MUST generate unique invoice numbers automatically
- **FR-008**: System MUST allow attaching documents (PDF, images) to invoices

#### Service Management
- **FR-009**: System MUST allow defining services with name, price, and type (visa, ticket, hotel, insurance, other)
- **FR-010**: System MUST allow specifying if service is provided by office or partner
- **FR-011**: System MUST require commission percentage when service is partner-provided
- **FR-012**: System MUST prevent deletion of services that are referenced in invoices
- **FR-013**: Each service added to an invoice MUST support optional beneficiary fields: name, ID number, phone, relationship to customer
- **FR-014**: Each service in an invoice MUST support a comments field
- **FR-015**: Each service in an invoice MUST support document attachments

#### Payment Management
- **FR-016**: System MUST allow recording payments received from customers
- **FR-017**: System MUST allow recording payments made to partners
- **FR-018**: System MUST generate unique transaction numbers for all payments
- **FR-019**: System MUST allow attaching documents to payment records
- **FR-020**: System MUST support payment methods: cash account and bank account selection
- **FR-021**: System MUST update account balances when payments are recorded

#### Accounting
- **FR-022**: System MUST automatically create customer accounts when customers are added
- **FR-023**: System MUST automatically create partner accounts when partners are added
- **FR-024**: System MUST create default accounts (Cash, Bank, Expenses) when workspace is created
- **FR-025**: System MUST allow creating custom accounts with name, type, and category
- **FR-026**: System MUST record all transactions as journal entries
- **FR-027**: System MUST support viewing journal entries filtered by date range, account, and type
- **FR-028**: System MUST calculate and display account balances

#### Statements and Reporting
- **FR-029**: System MUST generate account statements for customers showing all transactions and running balance
- **FR-030**: System MUST generate account statements for partners with commission breakdown
- **FR-031**: System MUST allow filtering statements by date range
- **FR-032**: System MUST allow exporting statements as PDF

#### Expense Management
- **FR-033**: System MUST allow recording business expenses with amount, date, category, and description
- **FR-034**: System MUST allow attaching receipts to expense records
- **FR-035**: System MUST debit appropriate expense account and credit payment source when expense is recorded

#### User Experience
- **FR-036**: System MUST provide quick-add modals for creating customers without leaving invoice page
- **FR-037**: System MUST provide quick-add modals for creating partners without leaving invoice page
- **FR-038**: System MUST provide quick-add modals for creating services without leaving invoice page
- **FR-039**: System MUST auto-select newly created entities in the invoice form after quick-add

### Key Entities

- **Invoice**: Represents a billable document for a customer containing services, with total amount, status, date, attachments, and discount
- **Invoice Line Item**: A service added to an invoice, including beneficiary information, attachments, comments, and the service price at time of addition
- **Service**: A predefined service offering with name, price, type, provider type (office/partner), and commission rate if partner-provided
- **Payment**: A financial transaction recording money received from customers or paid to partners, with amount, date, method, attachments, and transaction number
- **Account**: A financial account in the chart of accounts (customer, partner, cash, bank, expense, income types) with name, type, and balance
- **Journal Entry**: A double-entry accounting record showing debits and credits for each financial transaction
- **Beneficiary**: Person information associated with a service (name, ID, phone, relationship to customer)
- **Attachment**: A document (PDF or image) linked to invoices, services, or payments

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can create a complete invoice with 5 services in under 5 minutes
- **SC-002**: Staff can record a customer payment in under 1 minute
- **SC-003**: Quick-add modals allow entity creation without page navigation (measured by: users can complete invoice with new customer/service without browser back navigation)
- **SC-004**: Account statements can be generated and exported in under 30 seconds
- **SC-005**: All financial transactions are recorded with complete audit trail within the system
- **SC-006**: Customer and partner balances are always accurate and reconcilable with transaction history
- **SC-007**: System supports uploading documents up to 10MB per attachment
- **SC-008**: Users can complete core workflows (invoice creation, payment recording) without assistance after initial training (validated via Chrome MCP walkthrough of all user stories)
- **SC-009**: Commission calculations are 100% accurate based on predefined service rates
- **SC-010**: Journal entries provide complete visibility into all financial movements on a daily basis

## Assumptions

- **A-001**: The system is single-currency (no multi-currency support required initially)
- **A-002**: Document attachments will be stored securely with access limited to authorized workspace users
- **A-003**: Default service types (visa, ticket, hotel, insurance, other) are sufficient; custom types can be added later
- **A-004**: Double-entry accounting principles will be followed for all financial transactions
- **A-005**: The existing customer and partner management sections will be enhanced to support the new accounting integration
- **A-006**: All amounts are stored and calculated with 2 decimal precision
- **A-007**: Invoice numbering follows workspace-specific sequential pattern
- **A-008**: Beneficiary relationship types include: Self, Spouse, Child, Parent, Sibling, Other
- **A-009**: All authenticated staff members have equal permissions for all operations (no role-based restrictions for financial operations)
- **A-010**: Document attachments are stored in Firebase Storage with workspace-scoped access control
- **A-011**: Invoices can be edited at any status; edits to issued invoices will trigger journal entry adjustments to maintain accounting accuracy
- **A-012**: PDF generation for invoices and statements is handled client-side using jsPDF

## Clarifications

### Session 2025-12-22

- Q: Who should have permission to cancel invoices and record payments? → A: Any authenticated staff member can perform all operations
- Q: Where should document attachments be stored? → A: Firebase Storage (integrated with existing Firebase setup)
- Q: Can an invoice be edited after it has been issued? → A: Invoices can be freely edited at any status (full flexibility)
- Q: What should happen if two staff members try to edit the same invoice simultaneously? → A: Optimistic locking - second user sees error and must reload before editing
- Q: How should PDF generation for invoices and statements be handled? → A: Client-side PDF generation (browser-based with jsPDF or similar)
