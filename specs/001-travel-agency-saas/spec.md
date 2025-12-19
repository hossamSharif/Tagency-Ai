# Feature Specification: Travel Agency SaaS Platform

**Feature Branch**: `001-travel-agency-saas`
**Created**: 2025-12-19
**Status**: Draft
**Input**: Build a SaaS web application for travel agencies to manage tourism packages, services, customers, and partner offices. The app must be mobile responsive, support Arabic (default) and English, and include dark/light themes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Office Admin Creates Tourism Package (Priority: P1)

A travel office administrator creates a new tourism package (e.g., Hajj pilgrimage package) by defining the package details, adding services (flights, hotels, visas), setting pricing, and marking services as either in-house or outsourced to partner offices.

**Why this priority**: Package creation is the core business function - without packages, the entire system has no purpose. This enables the primary revenue-generating activity.

**Independent Test**: Can be fully tested by creating a complete package with multiple services and verifying all details are saved and displayed correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in office admin, **When** they create a new package with name, description, type (Hajj/Umrah/Honeymoon/Custom), and date range, **Then** the package is saved as draft status
2. **Given** a draft package, **When** admin adds services with pricing, descriptions, and marks them as in-house or outsourced, **Then** services are associated with the package and total price is calculated
3. **Given** a package with outsourced services, **When** admin assigns a partner office and commission percentage, **Then** the commission split is recorded and visible
4. **Given** a complete package, **When** admin changes status to "active", **Then** the package becomes available for customer booking
5. **Given** an active package, **When** admin edits any detail, **Then** changes are tracked in audit log with timestamp and user

---

### User Story 2 - Customer Books Package and Manages Documents (Priority: P1)

A customer browses available packages, selects one, uploads required documents (passport scans via camera or PDF), and completes the booking with payment information.

**Why this priority**: Customer booking is the revenue event - this directly enables the business to generate income and is essential for the core value proposition.

**Independent Test**: Can be fully tested by simulating a complete customer journey from package selection through document upload and booking confirmation.

**Acceptance Scenarios**:

1. **Given** a customer viewing available packages, **When** they select a package, **Then** they see complete details including all services, pricing breakdown, and required documents
2. **Given** a package selection, **When** customer uploads passport via camera capture, **Then** system extracts data (name, passport number, expiry date, nationality) using OCR
3. **Given** a package selection, **When** customer uploads passport as PDF, **Then** system extracts the same data automatically
4. **Given** all required documents uploaded, **When** customer proceeds to payment, **Then** they see invoice with itemized services and total
5. **Given** successful payment, **When** booking is confirmed, **Then** customer receives confirmation notification via email and in-app

---

### User Story 3 - Office Admin Manages Customer Accounts and Invoices (Priority: P1)

An office administrator views customer accounts, tracks payments and balances, generates invoices, and manages payment statuses.

**Why this priority**: Financial management is critical for business operations - offices need to track money flow, outstanding balances, and generate proper invoices.

**Independent Test**: Can be fully tested by creating invoices, recording payments, and verifying balance calculations.

**Acceptance Scenarios**:

1. **Given** a customer with bookings, **When** admin views their account, **Then** they see all invoices, payments made, pending amounts, and current balance
2. **Given** a booking, **When** admin generates an invoice, **Then** it shows itemized services, identifies outsourced services with commission deductions, and calculates final total
3. **Given** an outstanding invoice, **When** customer makes partial payment, **Then** the balance is updated and payment history reflects the transaction
4. **Given** an outsourced service on an invoice, **When** viewing the invoice, **Then** the commission amount owed to partner office is clearly displayed

---

### User Story 4 - Partner Office Commission Management (Priority: P2)

Partner offices view services assigned to them, track commissions earned, and manage settlement status with the primary office.

**Why this priority**: Partner relationships enable service scalability - offices can offer more services than they can deliver in-house, expanding their business capability.

**Independent Test**: Can be fully tested by assigning services to partners and verifying commission calculations and settlement tracking.

**Acceptance Scenarios**:

1. **Given** a partner office user, **When** they log in, **Then** they see dashboard with pending services, earned commissions, and settlement history
2. **Given** outsourced services completed, **When** primary office marks them as delivered, **Then** partner office commission is calculated based on agreed percentage
3. **Given** accumulated commissions, **When** settlement is processed, **Then** both offices see updated records with settlement date and amount
4. **Given** commission disputes, **When** either party flags an issue, **Then** notification is sent and item is marked for resolution

---

### User Story 5 - Subscription and Payment Management (Priority: P2)

Travel office owners sign up for the platform, start with free trial, and manage their subscription including upgrading to paid plans and handling payment methods.

**Why this priority**: Subscription management is the SaaS revenue model - this enables the platform itself to generate revenue and sustain operations.

**Independent Test**: Can be fully tested by completing signup, using trial period, and processing subscription payment.

**Acceptance Scenarios**:

1. **Given** a new user on landing page, **When** they sign up with email and office details, **Then** they receive 1-week free trial access
2. **Given** trial is active, **When** user accesses the platform, **Then** they see trial days remaining prominently displayed
3. **Given** trial ending, **When** user chooses to subscribe, **Then** they can pay via Stripe (credit/debit card) or submit bank transfer proof
4. **Given** bank transfer payment, **When** user uploads proof document with transaction number, **Then** payment enters pending status awaiting admin approval
5. **Given** pending bank transfer, **When** platform admin approves, **Then** subscription is activated and user is notified

---

### User Story 6 - Multi-tenant Workspace Management (Priority: P2)

Each travel office operates in an isolated workspace with their own data, users, and configurations, ensuring complete data separation.

**Why this priority**: Multi-tenancy is essential for SaaS scalability and data security - offices must not see each other's data.

**Independent Test**: Can be fully tested by creating multiple offices and verifying complete data isolation.

**Acceptance Scenarios**:

1. **Given** Office A and Office B accounts, **When** Office A admin views packages, **Then** they only see packages created by Office A
2. **Given** an office admin, **When** they invite staff members, **Then** staff are added to that office's workspace only
3. **Given** multiple offices, **When** platform reports are generated, **Then** each office's data is aggregated separately

---

### User Story 7 - User Authentication and Role Management (Priority: P2)

Users sign up, log in, reset passwords, and are assigned roles (admin, staff, customer, partner office) that control their access to features.

**Why this priority**: Authentication and authorization are foundational security requirements that all other features depend on.

**Independent Test**: Can be fully tested by creating users with different roles and verifying appropriate access restrictions.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they complete signup with email verification, **Then** account is created and they can log in
2. **Given** a forgotten password, **When** user requests reset, **Then** they receive email with secure reset link valid for 24 hours
3. **Given** an office admin, **When** they assign staff role to a user, **Then** that user can only access staff-level features
4. **Given** a customer role, **When** they attempt to access admin features, **Then** they are denied with appropriate message

---

### User Story 8 - Bilingual Interface with Theme Support (Priority: P3)

Users switch between Arabic and English languages, with Arabic as default. Users also toggle between dark and light themes according to preference.

**Why this priority**: Localization and theming improve user experience but are not critical to core business functions.

**Independent Test**: Can be fully tested by switching languages and themes and verifying UI updates correctly.

**Acceptance Scenarios**:

1. **Given** first-time user, **When** they access the platform, **Then** interface displays in Arabic by default with RTL layout
2. **Given** Arabic interface, **When** user switches to English, **Then** all text, labels, and formatting change to English LTR
3. **Given** light theme active, **When** user toggles to dark theme, **Then** entire interface updates to dark color scheme
4. **Given** user preferences saved, **When** they log in again, **Then** their language and theme preferences persist

---

### User Story 9 - Notifications and Alerts (Priority: P3)

Users receive timely notifications via in-app messages and email for important events like payment status, package updates, document requests, and commission settlements.

**Why this priority**: Notifications improve engagement and reduce missed actions but the system functions without them.

**Independent Test**: Can be fully tested by triggering notification events and verifying delivery via both channels.

**Acceptance Scenarios**:

1. **Given** a payment is approved, **When** event occurs, **Then** user receives both in-app notification and email
2. **Given** a package is updated, **When** customer is subscribed to that package, **Then** they receive notification of changes
3. **Given** documents are requested, **When** office admin requests from customer, **Then** customer receives notification with document list
4. **Given** commission settlement completed, **When** partner office is paid, **Then** they receive notification with settlement details
5. **Given** user notification preferences, **When** they opt out of email, **Then** they only receive in-app notifications

---

### User Story 10 - Landing Page and Marketing Site (Priority: P3)

Potential customers visit the public landing page to learn about features, view pricing, start free trial signup, and contact support.

**Why this priority**: Marketing site drives customer acquisition but can be simplified initially.

**Independent Test**: Can be fully tested by navigating all public pages and completing the signup flow.

**Acceptance Scenarios**:

1. **Given** visitor on landing page, **When** they browse, **Then** they see feature overview, pricing (monthly plan), and free trial offer
2. **Given** pricing page, **When** visitor views plans, **Then** they see clear comparison of trial vs paid features
3. **Given** interest in signup, **When** visitor clicks "Start Free Trial", **Then** they are taken to registration flow
4. **Given** questions about platform, **When** visitor submits contact form, **Then** inquiry is received and acknowledged

---

### User Story 11 - Reporting and Analytics Dashboard (Priority: P3)

Office admins view dashboards with sales reports, commission summaries, customer activity metrics, and financial overviews.

**Why this priority**: Analytics provide business insights but the core operations function without them initially.

**Independent Test**: Can be fully tested by generating reports with sample data and verifying accuracy.

**Acceptance Scenarios**:

1. **Given** office admin on dashboard, **When** they view sales report, **Then** they see bookings by period, revenue, and popular packages
2. **Given** commission data, **When** admin views commission report, **Then** they see totals by partner, pending settlements, and history
3. **Given** customer data, **When** admin views activity report, **Then** they see new customers, repeat bookings, and engagement metrics
4. **Given** financial overview, **When** admin views finance dashboard, **Then** they see receivables, payables, and cash flow summary

---

### User Story 12 - Audit Logging and Compliance (Priority: P3)

System tracks all significant changes to packages, invoices, payments, and user actions for compliance and troubleshooting.

**Why this priority**: Audit trails are important for compliance but not critical for MVP launch.

**Independent Test**: Can be fully tested by performing actions and verifying log entries are created with correct details.

**Acceptance Scenarios**:

1. **Given** any change to a package, **When** change is saved, **Then** audit log records who, what, when, and before/after values
2. **Given** invoice modification, **When** admin edits invoice, **Then** change is logged with full details
3. **Given** payment recording, **When** payment status changes, **Then** audit trail captures the transition
4. **Given** audit log access, **When** admin searches logs, **Then** they can filter by date, user, entity type, and action

---

### Edge Cases

- What happens when a user's trial expires mid-booking? System should allow completing in-progress bookings but prevent new ones
- How does system handle passport OCR failure? Display manual entry form with extracted fields pre-filled where possible
- What happens when partner office is deactivated with pending commissions? Commissions remain payable, services can be reassigned
- How does system handle concurrent edits to same package? Last-save-wins with conflict notification to other editor
- What happens when Stripe payment fails? Display clear error, allow retry, and log attempt for troubleshooting
- How does system handle Arabic text in passport OCR? Support Arabic character recognition and transliteration where needed
- What happens when bank transfer proof is rejected? User is notified with reason and can resubmit with correct documentation
- What happens when a booking is cancelled after partial payment? All payments are non-refundable; booking is marked cancelled and payment history is retained for records

## Requirements *(mandatory)*

### Functional Requirements

#### User & Account Management
- **FR-001**: System MUST allow new users to sign up with email, password, and office details
- **FR-002**: System MUST verify email addresses before activating accounts
- **FR-003**: System MUST allow users to reset passwords via secure email link
- **FR-004**: System MUST support four user roles: admin, staff, customer, partner office
- **FR-005**: System MUST enforce role-based access control for all features
- **FR-006**: System MUST allow users to manage their profile information and uploaded documents
- **FR-007**: System MUST isolate each office's data in separate tenant workspaces

#### Packages & Services
- **FR-008**: System MUST allow admins to create, edit, and delete tourism packages
- **FR-009**: System MUST support package types including Hajj, Umrah, honeymoon, and custom trips
- **FR-010**: System MUST allow adding services to packages with pricing and descriptions
- **FR-011**: System MUST allow marking services as "in-house" or "outsourced"
- **FR-012**: System MUST track commission percentages for outsourced services
- **FR-013**: System MUST support document attachments for packages and services
- **FR-014**: System MUST track package status (draft, active, completed)
- **FR-015**: System MUST calculate total package pricing including all services

#### Passport Scanning
- **FR-016**: System MUST support passport capture via device camera
- **FR-017**: System MUST support passport upload via PDF file
- **FR-018**: System MUST extract passport data (name, number, expiry, nationality) using OCR
- **FR-019**: System MUST allow manual correction of OCR-extracted data

#### Customers & Partner Offices
- **FR-020**: System MUST maintain customer accounts with invoice and payment history
- **FR-021**: System MUST display customer balance (amount owed or credit)
- **FR-022**: System MUST maintain partner office accounts with commission tracking
- **FR-023**: System MUST allow assigning services to partner offices
- **FR-024**: System MUST calculate and track commission splits automatically
- **FR-025**: System MUST support commission settlement management and history

#### Invoices & Finance
- **FR-026**: System MUST generate invoices with itemized services
- **FR-027**: System MUST identify outsourced services on invoices with commission deductions
- **FR-028**: System MUST track payment status (paid, partial, pending)
- **FR-029**: System MUST maintain payment history for all transactions
- **FR-030**: System MUST provide admin dashboard for financial overview

#### Subscription & Payments
- **FR-031**: System MUST provide 1-week free trial for new offices
- **FR-032**: System MUST support monthly subscription plan
- **FR-033**: System MUST integrate with Stripe for card payments
- **FR-034**: System MUST support offline bank transfer with proof upload
- **FR-035**: System MUST provide admin workflow to approve bank transfer payments
- **FR-036**: System MUST restrict access when subscription expires or trial ends

#### Notifications
- **FR-037**: System MUST send in-app notifications for key events
- **FR-038**: System MUST send email notifications for key events
- **FR-039**: System MUST notify users of payment status changes
- **FR-040**: System MUST notify users of package updates
- **FR-041**: System MUST notify users of document requests
- **FR-042**: System MUST notify partner offices of commission settlements

#### UI/UX Requirements
- **FR-043**: System MUST be mobile responsive across all screen sizes
- **FR-044**: System MUST support Arabic language with RTL layout as default
- **FR-045**: System MUST support English language with LTR layout
- **FR-046**: System MUST allow users to toggle between languages
- **FR-047**: System MUST support dark and light themes
- **FR-048**: System MUST persist user language and theme preferences

#### Landing Page
- **FR-049**: System MUST provide public landing page with feature overview
- **FR-050**: System MUST display pricing information with monthly plan details
- **FR-051**: System MUST provide free trial signup flow from landing page
- **FR-052**: System MUST provide contact form for inquiries

#### Enhancements
- **FR-053**: System MUST maintain audit logs for packages, invoices, and payments
- **FR-054**: System MUST provide sales and commission reports
- **FR-055**: System MUST provide customer activity analytics
- **FR-056**: System SHOULD expose API endpoints for external system integration

### Key Entities

- **Office (Tenant)**: A travel agency business that subscribes to the platform. Has subscription status, workspace settings, and owns all associated data. Relationships: has many users, packages, customers, partner relationships.

- **User**: A person who accesses the system. Has role (admin/staff/customer/partner), profile info, contact details, authentication credentials. Relationships: belongs to office, may have uploaded documents.

- **Package**: A tourism product offered by an office. Has name, type, description, date range, status, total price. Relationships: belongs to office, has many services, has many bookings.

- **Service**: An individual component of a package (flight, hotel, visa, etc.). Has name, description, price, in-house/outsourced flag, commission percentage. Relationships: belongs to package, may be assigned to partner office.

- **Customer**: A person who books packages. Has personal info, passport details, document uploads. Relationships: belongs to office, has many bookings, has many invoices.

- **Partner Office**: An external office that delivers outsourced services. Has contact info, commission rates, settlement history. Relationships: connected to primary office, receives service assignments.

- **Booking**: A customer's reservation of a package. Has status, dates, associated documents. Relationships: belongs to customer, references package, has invoice.

- **Invoice**: A billing document for a booking. Has itemized services, amounts, payment status, commission calculations. Relationships: belongs to booking/customer, has many payments.

- **Payment**: A monetary transaction. Has amount, method, status, date, proof document (for bank transfers). Relationships: belongs to invoice.

- **Document**: An uploaded file (passport scan, proof of payment, etc.). Has file reference, type, upload date, extracted data. Relationships: belongs to user/customer/payment.

- **Subscription**: An office's platform access plan. Has plan type, status, start/end dates, payment history. Relationships: belongs to office.

- **Notification**: A message to a user about system events. Has type, content, read status, delivery channel. Relationships: belongs to user.

- **Audit Log**: A record of system changes. Has entity type, action, before/after values, timestamp, actor. Relationships: references any entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Office admins can create a complete package with 5 services in under 10 minutes
- **SC-002**: Customers can complete passport upload and data extraction in under 2 minutes
- **SC-003**: 90% of passport OCR extractions require no manual corrections
- **SC-004**: Invoice generation completes in under 5 seconds regardless of number of services
- **SC-005**: System supports 500 concurrent users per tenant without performance degradation
- **SC-006**: Page load times remain under 3 seconds on mobile devices with standard connectivity
- **SC-007**: Users successfully complete primary tasks (create package, book package, process payment) on first attempt 85% of the time
- **SC-008**: Language switching between Arabic and English completes instantly with no page reload
- **SC-009**: 95% of notifications are delivered within 1 minute of triggering event
- **SC-010**: Bank transfer payment approval workflow completes within 24 hours of proof submission
- **SC-011**: Commission calculations are 100% accurate with zero discrepancies in partner settlements
- **SC-012**: Trial-to-paid conversion rate tracking is available for business analysis
- **SC-013**: System maintains 99.5% uptime during business hours
- **SC-014**: Data isolation between tenants is complete with zero cross-tenant data leakage
- **SC-015**: All user actions on sensitive data are logged in audit trail within 1 second

## Clarifications

### Session 2025-12-19

- Q: What level of data protection compliance must the platform meet for handling personal data? → A: Basic (standard encryption, password hashing, HTTPS only)
- Q: What currency model should the platform support for pricing and payments? → A: Single currency per tenant, including SDG (Sudanese Pound)
- Q: Which OCR approach should be used for passport data extraction? → A: Self-hosted Tesseract (open-source, no API costs)
- Q: What should happen when a booking is cancelled after partial payment? → A: No refunds (payments are non-refundable)
- Q: What is the preferred technology stack? → A: Next.js connected directly to Firebase, shadcn/ui for components

## Assumptions

- Technology stack: Next.js (React full-stack framework) connected directly to Firebase (Firestore for database, Firebase Auth for authentication, Firebase Storage for documents), shadcn/ui for UI components
- Security posture: Basic data protection with standard encryption at rest and in transit, secure password hashing, and HTTPS enforcement (no GDPR consent tracking or PCI-DSS certification required for MVP)
- Currency model: Single currency per tenant configured at signup; supported currencies include USD, SAR, EUR, SDG (Sudanese Pound), and other common currencies
- Standard email/password authentication with email verification is sufficient (no SSO required for MVP)
- Monthly subscription billing cycle aligns with standard SaaS practices
- Stripe is available in target markets for card payment processing
- OCR for passport scanning: Self-hosted Tesseract OCR engine (open-source, no external API costs); manual correction UI required given lower accuracy compared to cloud services
- Standard web security practices (HTTPS, secure sessions, encrypted storage) are assumed
- Mobile responsive design targets smartphones and tablets, not dedicated mobile apps
- Email delivery via standard transactional email service (specific provider to be determined)
- Arabic language content and translations will be provided during implementation
- Audit logs are retained for 2 years per standard business compliance
- File storage for documents uses secure cloud storage with encryption at rest

## Out of Scope

- Native mobile applications (iOS/Android) - web responsive only for MVP
- Integration with external booking systems (GDS, airline APIs) - manual entry only
- Real-time chat or messaging between offices and customers
- Multi-currency conversion - each tenant operates in a single configured currency (no real-time exchange rates)
- Advanced revenue forecasting or predictive analytics
- White-labeling or custom branding per tenant
- Offline mode functionality
- SMS notifications - email and in-app only
- Integration with accounting software (QuickBooks, Xero, etc.)
- Customer self-service portal for document management outside booking flow
