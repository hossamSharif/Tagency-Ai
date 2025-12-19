# Tasks: Travel Agency SaaS Platform

**Input**: Design documents from `/specs/001-travel-agency-saas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic Next.js/Firebase structure

- [X] T001 Create Next.js 14+ project with TypeScript, Tailwind, App Router using `npx create-next-app@latest` with --typescript --tailwind --eslint --app --src-dir flags
- [X] T002 Install core dependencies (firebase, firebase-admin, next-intl, next-themes, react-hook-form, @hookform/resolvers, zod, stripe, @stripe/stripe-js, tesseract.js, date-fns, @react-pdf/renderer)
- [X] T003 [P] Initialize shadcn/ui with `npx shadcn@latest init` and add components (button, card, input, label, form, dialog, dropdown-menu, table, tabs, avatar, badge, calendar, checkbox, select, separator, sheet, skeleton, toast)
- [X] T004 [P] Configure Tailwind for RTL support with logical properties in tailwind.config.ts
- [X] T005 [P] Setup CSS variables for Saudi Deep Green (#1E5631) and Muted Gold (#D4AF37) theme colors in src/app/globals.css
- [X] T006 [P] Configure Google Fonts (Noto Kufi Arabic, Inter) in src/app/[locale]/layout.tsx
- [X] T007 Create Firebase project configuration in src/lib/firebase/config.ts
- [X] T008 [P] Create .env.local template with Firebase and Stripe environment variables
- [X] T009 [P] Setup ESLint and Prettier configuration with tailwindcss plugin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Authentication & Authorization Foundation

- [X] T010 Create Firebase Auth helper functions in src/lib/firebase/auth.ts (signIn, signUp, signOut, resetPassword, getCurrentUser)
- [X] T011 Create Firebase Admin SDK initialization in src/lib/firebase/admin.ts for server-side operations
- [X] T012 Create custom claims types for multi-tenancy in src/types/auth.ts (tenantId, role, partnerOfficeId, platformAdmin)
- [X] T013 Implement authentication context provider in src/contexts/auth-context.tsx
- [X] T014 Create useAuth hook in src/hooks/use-auth.ts for client components

### Multi-tenancy Foundation

- [X] T015 Create Tenant type definition in src/types/models/tenant.ts per data-model.md
- [X] T016 Create Subscription type definition in src/types/models/subscription.ts per data-model.md
- [X] T017 Create User type definition in src/types/models/user.ts per data-model.md
- [X] T018 Implement tenant context provider in src/contexts/tenant-context.tsx
- [X] T019 Create useTenant hook in src/hooks/use-tenant.ts

### Firestore & Security Rules

- [X] T020 Create Firestore helper functions in src/lib/firebase/firestore.ts (getDoc, setDoc, updateDoc, deleteDoc with tenant path prefix)
- [X] T021 Create Firebase Storage helper functions in src/lib/firebase/storage.ts (uploadFile, getDownloadUrl, deleteFile)
- [X] T022 Write Firestore security rules in firestore.rules with tenant isolation
- [X] T023 Write Storage security rules in storage.rules with tenant isolation and file type restrictions

### Internationalization Foundation

- [X] T024 Create next-intl configuration in src/i18n.ts
- [X] T025 Create middleware for locale routing in src/middleware.ts (ar default, en supported)
- [X] T026 Create Arabic translation file in src/messages/ar.json with common, auth, packages, customers, invoices sections
- [X] T027 [P] Create English translation file in src/messages/en.json with same structure

### Theme & Layout Foundation

- [X] T028 Create ThemeProvider wrapper in src/components/providers/theme-provider.tsx using next-themes
- [X] T029 Create Providers wrapper combining all providers in src/components/providers/index.tsx
- [X] T030 Create root layout with locale support in src/app/[locale]/layout.tsx
- [X] T031 Create auth layout group in src/app/[locale]/(auth)/layout.tsx
- [X] T032 [P] Create dashboard layout with sidebar in src/app/[locale]/(dashboard)/layout.tsx
- [X] T033 [P] Create public layout in src/app/[locale]/(public)/layout.tsx

### Shared UI Components

- [X] T034 Create Sidebar navigation component in src/components/layout/sidebar.tsx with RTL support
- [X] T035 [P] Create Header component with language/theme toggles in src/components/layout/header.tsx
- [X] T036 [P] Create LanguageSwitcher component in src/components/layout/language-switcher.tsx
- [X] T037 [P] Create ThemeSwitcher component in src/components/layout/theme-switcher.tsx
- [X] T038 Create DataTable component with sorting/pagination in src/components/ui/data-table.tsx
- [X] T039 [P] Create LoadingSpinner component in src/components/ui/loading-spinner.tsx
- [X] T040 [P] Create EmptyState component in src/components/ui/empty-state.tsx

### Server Actions Foundation

- [X] T041 Create action state types and helpers in src/lib/actions/types.ts
- [X] T042 Create validation schemas base in src/lib/validations/index.ts using Zod
- [X] T043 Create audit log helper function in src/lib/audit/create-log.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 7 - User Authentication and Role Management (Priority: P2, but BLOCKING)

**Goal**: Users sign up, log in, reset passwords, and are assigned roles that control access

**Independent Test**: Create users with different roles and verify appropriate access restrictions

**Note**: Although P2, Authentication must come before P1 stories since all require authenticated users

### Implementation for User Story 7

- [X] T044 [US7] Create signup validation schema in src/lib/validations/auth.ts
- [X] T045 [US7] Implement signupAction server action in src/app/actions/auth.ts (creates tenant, user, starts trial)
- [X] T046 [US7] Implement loginAction server action in src/app/actions/auth.ts
- [X] T047 [US7] Implement resetPasswordAction server action in src/app/actions/auth.ts
- [X] T048 [US7] Implement updatePasswordAction server action in src/app/actions/auth.ts
- [X] T049 [US7] Implement updateProfileAction server action in src/app/actions/auth.ts
- [X] T050 [US7] Implement inviteUserAction server action in src/app/actions/auth.ts
- [X] T051 [P] [US7] Create signup page in src/app/[locale]/(auth)/signup/page.tsx
- [X] T052 [P] [US7] Create login page in src/app/[locale]/(auth)/login/page.tsx
- [X] T053 [P] [US7] Create reset-password page in src/app/[locale]/(auth)/reset-password/page.tsx
- [X] T054 [US7] Create SignupForm component in src/components/forms/signup-form.tsx
- [X] T055 [P] [US7] Create LoginForm component in src/components/forms/login-form.tsx
- [X] T056 [P] [US7] Create ResetPasswordForm component in src/components/forms/reset-password-form.tsx
- [X] T057 [US7] Create protected route middleware/wrapper for role-based access in src/lib/auth/require-role.ts
- [X] T058 [US7] Create settings page with profile/password update in src/app/[locale]/(dashboard)/settings/page.tsx
- [X] T059 [US7] Create team management page for inviting users in src/app/[locale]/(dashboard)/settings/team/page.tsx

**Checkpoint**: User Story 7 - Authentication system is fully functional and testable

---

## Phase 4: User Story 1 - Office Admin Creates Tourism Package (Priority: P1) 🎯 MVP

**Goal**: Admin creates tourism packages with services, pricing, and partner assignments

**Independent Test**: Create a complete package with multiple services and verify all details are saved and displayed correctly

### Type Definitions for User Story 1

- [X] T060 [P] [US1] Create Package type definition in src/types/models/package.ts per data-model.md
- [X] T061 [P] [US1] Create Service type definition in src/types/models/service.ts per data-model.md
- [X] T062 [P] [US1] Create PartnerOffice type definition in src/types/models/partner-office.ts per data-model.md

### Validation Schemas for User Story 1

- [X] T063 [US1] Create package validation schemas in src/lib/validations/packages.ts (createPackage, updatePackage, addService)

### Server Actions for User Story 1

- [X] T064 [US1] Implement createPackageAction in src/app/actions/packages.ts
- [X] T065 [US1] Implement updatePackageAction in src/app/actions/packages.ts
- [X] T066 [US1] Implement updatePackageStatusAction in src/app/actions/packages.ts (draft → active → completed)
- [X] T067 [US1] Implement deletePackageAction in src/app/actions/packages.ts
- [X] T068 [US1] Implement addServiceAction in src/app/actions/packages.ts (recalculates totalPrice)
- [X] T069 [US1] Implement updateServiceAction in src/app/actions/packages.ts
- [X] T070 [US1] Implement deleteServiceAction in src/app/actions/packages.ts
- [X] T071 [US1] Implement reorderServicesAction in src/app/actions/packages.ts
- [X] T072 [US1] Implement duplicatePackageAction in src/app/actions/packages.ts

### Hooks for User Story 1

- [X] T073 [US1] Create usePackages hook with Firestore subscription in src/hooks/use-packages.ts
- [X] T074 [P] [US1] Create usePackage hook for single package with services in src/hooks/use-package.ts

### UI Components for User Story 1

- [X] T075 [US1] Create PackageForm component in src/components/forms/package-form.tsx
- [X] T076 [P] [US1] Create PackageCard component in src/components/features/packages/package-card.tsx
- [X] T077 [P] [US1] Create PackageStatusBadge component (integrated in package-card.tsx)
- [X] T078 [US1] Create ServiceForm component in src/components/forms/service-form.tsx
- [X] T079 [P] [US1] Create ServiceList component (integrated in package-details.tsx)
- [X] T080 [P] [US1] Create ServiceCard component (integrated in package-details.tsx)
- [X] T081 [US1] Create PartnerOfficeSelect component (integrated in service-form.tsx)

### Pages for User Story 1

- [X] T082 [US1] Create packages list page in src/app/[locale]/(dashboard)/packages/page.tsx
- [X] T083 [US1] Create package create page in src/app/[locale]/(dashboard)/packages/new/page.tsx
- [X] T084 [US1] Create package detail page in src/app/[locale]/(dashboard)/packages/[packageId]/page.tsx
- [X] T085 [US1] Create package edit page in src/app/[locale]/(dashboard)/packages/[packageId]/edit/page.tsx

**Checkpoint**: User Story 1 - Package creation is fully functional and testable independently

---

## Phase 5: User Story 2 - Customer Books Package and Manages Documents (Priority: P1)

**Goal**: Customer browses packages, uploads passport with OCR, completes booking

**Independent Test**: Complete customer journey from package selection through document upload and booking confirmation

### Type Definitions for User Story 2

- [ ] T086 [P] [US2] Create Customer type definition in src/types/models/customer.ts per data-model.md
- [ ] T087 [P] [US2] Create Booking type definition in src/types/models/booking.ts per data-model.md
- [ ] T088 [P] [US2] Create PassportData type definition in src/types/models/passport.ts per data-model.md

### OCR Integration for User Story 2

- [ ] T089 [US2] Create Tesseract.js wrapper in src/lib/ocr/tesseract.ts
- [ ] T090 [US2] Implement passport data extraction logic in src/lib/ocr/passport-parser.ts (MRZ parsing)
- [ ] T091 [US2] Create OCR API route in src/app/api/ocr/passport/route.ts

### Validation Schemas for User Story 2

- [ ] T092 [US2] Create customer validation schemas in src/lib/validations/customers.ts
- [ ] T093 [P] [US2] Create booking validation schemas in src/lib/validations/bookings.ts

### Server Actions for User Story 2

- [ ] T094 [US2] Implement createCustomerAction in src/app/actions/customers.ts
- [ ] T095 [US2] Implement updateCustomerAction in src/app/actions/customers.ts
- [ ] T096 [US2] Implement updateCustomerPassportAction in src/app/actions/customers.ts
- [ ] T097 [US2] Implement uploadCustomerDocumentAction in src/app/actions/customers.ts
- [ ] T098 [US2] Implement createBookingAction in src/app/actions/bookings.ts (creates package snapshot, booking number)
- [ ] T099 [US2] Implement updateBookingAction in src/app/actions/bookings.ts
- [ ] T100 [US2] Implement updateBookingStatusAction in src/app/actions/bookings.ts
- [ ] T101 [US2] Implement uploadBookingDocumentAction in src/app/actions/bookings.ts
- [ ] T102 [US2] Implement updateTravelerPassportAction in src/app/actions/bookings.ts

### Hooks for User Story 2

- [ ] T103 [US2] Create useCustomers hook in src/hooks/use-customers.ts
- [ ] T104 [P] [US2] Create useCustomer hook in src/hooks/use-customer.ts
- [ ] T105 [P] [US2] Create useBookings hook in src/hooks/use-bookings.ts
- [ ] T106 [P] [US2] Create useBooking hook in src/hooks/use-booking.ts

### UI Components for User Story 2

- [ ] T107 [US2] Create PassportScanner component with camera capture in src/components/features/passport-scanner/passport-scanner.tsx
- [ ] T108 [P] [US2] Create PassportPreview component in src/components/features/passport-scanner/passport-preview.tsx
- [ ] T109 [P] [US2] Create PassportDataForm for manual correction in src/components/features/passport-scanner/passport-data-form.tsx
- [ ] T110 [US2] Create CustomerForm component in src/components/features/customers/customer-form.tsx
- [ ] T111 [P] [US2] Create CustomerCard component in src/components/features/customers/customer-card.tsx
- [ ] T112 [US2] Create BookingForm component in src/components/features/bookings/booking-form.tsx
- [ ] T113 [P] [US2] Create BookingCard component in src/components/features/bookings/booking-card.tsx
- [ ] T114 [P] [US2] Create BookingStatusBadge component in src/components/features/bookings/booking-status-badge.tsx
- [ ] T115 [US2] Create TravelerForm component in src/components/features/bookings/traveler-form.tsx
- [ ] T116 [P] [US2] Create DocumentUploader component in src/components/features/bookings/document-uploader.tsx
- [ ] T117 [P] [US2] Create DocumentList component in src/components/features/bookings/document-list.tsx

### Pages for User Story 2

- [ ] T118 [US2] Create customers list page in src/app/[locale]/(dashboard)/customers/page.tsx
- [ ] T119 [US2] Create customer create page in src/app/[locale]/(dashboard)/customers/new/page.tsx
- [ ] T120 [US2] Create customer detail page in src/app/[locale]/(dashboard)/customers/[customerId]/page.tsx
- [ ] T121 [US2] Create bookings list page in src/app/[locale]/(dashboard)/bookings/page.tsx
- [ ] T122 [US2] Create booking create page in src/app/[locale]/(dashboard)/bookings/new/page.tsx
- [ ] T123 [US2] Create booking detail page in src/app/[locale]/(dashboard)/bookings/[bookingId]/page.tsx

**Checkpoint**: User Story 2 - Customer booking with OCR is fully functional and testable independently

---

## Phase 6: User Story 3 - Office Admin Manages Customer Accounts and Invoices (Priority: P1)

**Goal**: Admin views customer accounts, generates invoices, tracks payments and balances

**Independent Test**: Create invoices, record payments, verify balance calculations

### Type Definitions for User Story 3

- [ ] T124 [P] [US3] Create Invoice type definition in src/types/models/invoice.ts per data-model.md
- [ ] T125 [P] [US3] Create Payment type definition in src/types/models/payment.ts per data-model.md

### Validation Schemas for User Story 3

- [ ] T126 [US3] Create invoice validation schemas in src/lib/validations/invoices.ts
- [ ] T127 [P] [US3] Create payment validation schemas in src/lib/validations/payments.ts

### Server Actions for User Story 3

- [ ] T128 [US3] Implement generateInvoiceAction in src/app/actions/invoices.ts (creates from booking with commission calculations)
- [ ] T129 [US3] Implement updateInvoiceAction in src/app/actions/invoices.ts
- [ ] T130 [US3] Implement issueInvoiceAction in src/app/actions/invoices.ts (draft → issued)
- [ ] T131 [US3] Implement cancelInvoiceAction in src/app/actions/invoices.ts
- [ ] T132 [US3] Implement createPaymentAction in src/app/actions/payments.ts (cash/bank transfer)
- [ ] T133 [US3] Implement createStripeCheckoutAction in src/app/actions/payments.ts
- [ ] T134 [US3] Implement uploadBankTransferProofAction in src/app/actions/payments.ts
- [ ] T135 [US3] Implement approveBankTransferAction in src/app/actions/payments.ts
- [ ] T136 [US3] Implement rejectBankTransferAction in src/app/actions/payments.ts

### PDF Generation for User Story 3

- [ ] T137 [US3] Create invoice PDF template in src/lib/pdf/invoice-template.tsx using @react-pdf/renderer
- [ ] T138 [US3] Create invoice PDF API route in src/app/api/invoices/[invoiceId]/pdf/route.ts

### Hooks for User Story 3

- [ ] T139 [US3] Create useInvoices hook in src/hooks/use-invoices.ts
- [ ] T140 [P] [US3] Create useInvoice hook in src/hooks/use-invoice.ts
- [ ] T141 [P] [US3] Create usePayments hook in src/hooks/use-payments.ts
- [ ] T142 [P] [US3] Create useCustomerBalance hook in src/hooks/use-customer-balance.ts

### UI Components for User Story 3

- [ ] T143 [US3] Create InvoiceForm component in src/components/features/invoices/invoice-form.tsx
- [ ] T144 [P] [US3] Create InvoiceCard component in src/components/features/invoices/invoice-card.tsx
- [ ] T145 [P] [US3] Create InvoiceStatusBadge component in src/components/features/invoices/invoice-status-badge.tsx
- [ ] T146 [P] [US3] Create InvoiceLineItems component in src/components/features/invoices/invoice-line-items.tsx
- [ ] T147 [US3] Create PaymentForm component in src/components/features/invoices/payment-form.tsx
- [ ] T148 [P] [US3] Create PaymentList component in src/components/features/invoices/payment-list.tsx
- [ ] T149 [P] [US3] Create BankTransferProofUploader in src/components/features/invoices/bank-transfer-proof-uploader.tsx
- [ ] T150 [P] [US3] Create CustomerBalanceSummary component in src/components/features/customers/customer-balance-summary.tsx

### Pages for User Story 3

- [ ] T151 [US3] Create invoices list page in src/app/[locale]/(dashboard)/invoices/page.tsx
- [ ] T152 [US3] Create invoice detail page in src/app/[locale]/(dashboard)/invoices/[invoiceId]/page.tsx
- [ ] T153 [US3] Create payments management page in src/app/[locale]/(dashboard)/payments/page.tsx
- [ ] T154 [US3] Add financial summary to customer detail page integration

**Checkpoint**: User Story 3 - Invoice and payment management is fully functional and testable independently

---

## Phase 7: User Story 4 - Partner Office Commission Management (Priority: P2)

**Goal**: Partner offices view services, track commissions, manage settlements

**Independent Test**: Assign services to partners and verify commission calculations and settlement tracking

### Type Definitions for User Story 4

- [ ] T155 [P] [US4] Create CommissionSettlement type definition in src/types/models/commission-settlement.ts per data-model.md

### Validation Schemas for User Story 4

- [ ] T156 [US4] Create partner validation schemas in src/lib/validations/partners.ts
- [ ] T157 [P] [US4] Create settlement validation schemas in src/lib/validations/settlements.ts

### Server Actions for User Story 4

- [ ] T158 [US4] Implement createPartnerAction in src/app/actions/partners.ts
- [ ] T159 [US4] Implement updatePartnerAction in src/app/actions/partners.ts
- [ ] T160 [US4] Implement updatePartnerStatusAction in src/app/actions/partners.ts
- [ ] T161 [US4] Implement invitePartnerUserAction in src/app/actions/partners.ts
- [ ] T162 [US4] Implement createSettlementAction in src/app/actions/settlements.ts
- [ ] T163 [US4] Implement approveSettlementAction in src/app/actions/settlements.ts
- [ ] T164 [US4] Implement markSettlementPaidAction in src/app/actions/settlements.ts
- [ ] T165 [US4] Implement disputeSettlementAction in src/app/actions/settlements.ts
- [ ] T166 [US4] Implement resolveDisputeAction in src/app/actions/settlements.ts

### Hooks for User Story 4

- [ ] T167 [US4] Create usePartners hook in src/hooks/use-partners.ts
- [ ] T168 [P] [US4] Create usePartner hook in src/hooks/use-partner.ts
- [ ] T169 [P] [US4] Create usePartnerCommissions hook in src/hooks/use-partner-commissions.ts
- [ ] T170 [P] [US4] Create useSettlements hook in src/hooks/use-settlements.ts

### UI Components for User Story 4

- [ ] T171 [US4] Create PartnerForm component in src/components/features/partners/partner-form.tsx
- [ ] T172 [P] [US4] Create PartnerCard component in src/components/features/partners/partner-card.tsx
- [ ] T173 [P] [US4] Create PartnerStatusBadge component in src/components/features/partners/partner-status-badge.tsx
- [ ] T174 [US4] Create CommissionSummary component in src/components/features/partners/commission-summary.tsx
- [ ] T175 [P] [US4] Create SettlementForm component in src/components/features/partners/settlement-form.tsx
- [ ] T176 [P] [US4] Create SettlementList component in src/components/features/partners/settlement-list.tsx
- [ ] T177 [P] [US4] Create SettlementStatusBadge component in src/components/features/partners/settlement-status-badge.tsx

### Pages for User Story 4

- [ ] T178 [US4] Create partners list page in src/app/[locale]/(dashboard)/partners/page.tsx
- [ ] T179 [US4] Create partner create page in src/app/[locale]/(dashboard)/partners/new/page.tsx
- [ ] T180 [US4] Create partner detail page with commissions in src/app/[locale]/(dashboard)/partners/[partnerId]/page.tsx
- [ ] T181 [US4] Create settlements management page in src/app/[locale]/(dashboard)/settlements/page.tsx
- [ ] T182 [US4] Create partner dashboard for partner role users in src/app/[locale]/(dashboard)/partner-dashboard/page.tsx

**Checkpoint**: User Story 4 - Partner and commission management is fully functional and testable independently

---

## Phase 8: User Story 5 - Subscription and Payment Management (Priority: P2)

**Goal**: Office owners sign up, manage trial, subscribe with Stripe or bank transfer

**Independent Test**: Complete signup, use trial period, process subscription payment

### Stripe Integration for User Story 5

- [ ] T183 [US5] Create Stripe client configuration in src/lib/stripe/config.ts
- [ ] T184 [US5] Implement Stripe webhook handler in src/app/api/webhooks/stripe/route.ts
- [ ] T185 [US5] Create webhook event handlers in src/lib/stripe/webhook-handlers.ts (checkout.session.completed, subscription.updated, etc.)

### Validation Schemas for User Story 5

- [ ] T186 [US5] Create subscription validation schemas in src/lib/validations/subscriptions.ts

### Server Actions for User Story 5

- [ ] T187 [US5] Implement getSubscriptionAction in src/app/actions/subscriptions.ts
- [ ] T188 [US5] Implement createSubscriptionCheckoutAction in src/app/actions/subscriptions.ts
- [ ] T189 [US5] Implement createBillingPortalAction in src/app/actions/subscriptions.ts
- [ ] T190 [US5] Implement initiateBankTransferAction in src/app/actions/subscriptions.ts
- [ ] T191 [US5] Implement uploadSubscriptionPaymentProofAction in src/app/actions/subscriptions.ts
- [ ] T192 [US5] Implement cancelSubscriptionAction in src/app/actions/subscriptions.ts
- [ ] T193 [US5] Implement reactivateSubscriptionAction in src/app/actions/subscriptions.ts

### Platform Admin Actions for User Story 5

- [ ] T194 [US5] Implement approveSubscriptionPaymentAction in src/app/actions/admin/subscriptions.ts
- [ ] T195 [US5] Implement rejectSubscriptionPaymentAction in src/app/actions/admin/subscriptions.ts
- [ ] T196 [US5] Implement extendTrialAction in src/app/actions/admin/subscriptions.ts
- [ ] T197 [US5] Implement suspendTenantAction in src/app/actions/admin/subscriptions.ts

### Hooks for User Story 5

- [ ] T198 [US5] Create useSubscription hook in src/hooks/use-subscription.ts
- [ ] T199 [P] [US5] Create useSubscriptionStatus hook for access control in src/hooks/use-subscription-status.ts

### UI Components for User Story 5

- [ ] T200 [US5] Create SubscriptionStatus component in src/components/features/subscriptions/subscription-status.tsx
- [ ] T201 [P] [US5] Create TrialBanner component in src/components/features/subscriptions/trial-banner.tsx
- [ ] T202 [P] [US5] Create SubscriptionCard component in src/components/features/subscriptions/subscription-card.tsx
- [ ] T203 [US5] Create PaymentMethodSelector component in src/components/features/subscriptions/payment-method-selector.tsx
- [ ] T204 [P] [US5] Create BankTransferInstructions component in src/components/features/subscriptions/bank-transfer-instructions.tsx
- [ ] T205 [P] [US5] Create SubscriptionPaymentHistory component in src/components/features/subscriptions/subscription-payment-history.tsx

### Pages for User Story 5

- [ ] T206 [US5] Create subscription management page in src/app/[locale]/(dashboard)/settings/subscription/page.tsx
- [ ] T207 [US5] Create subscription checkout success page in src/app/[locale]/(dashboard)/subscription/success/page.tsx
- [ ] T208 [US5] Create subscription checkout cancel page in src/app/[locale]/(dashboard)/subscription/cancelled/page.tsx

### Subscription Access Control

- [ ] T209 [US5] Create subscription guard middleware in src/lib/auth/require-subscription.ts
- [ ] T210 [US5] Integrate subscription check in dashboard layout with trial/expired handling

**Checkpoint**: User Story 5 - Subscription management is fully functional and testable independently

---

## Phase 9: User Story 6 - Multi-tenant Workspace Management (Priority: P2)

**Goal**: Each office operates in isolated workspace with their own data

**Independent Test**: Create multiple offices and verify complete data isolation

### Server Actions for User Story 6

- [X] T211 [US6] Implement getTenantAction in src/app/actions/tenants.ts
- [X] T212 [US6] Implement updateTenantAction in src/app/actions/tenants.ts (office name, currency, settings)
- [X] T213 [US6] Implement getTenantUsersAction in src/app/actions/tenants.ts

### UI Components for User Story 6

- [X] T214 [US6] Create TenantSettings component in src/components/features/settings/tenant-settings.tsx
- [X] T215 [P] [US6] Create CurrencyDisplay component in src/components/ui/currency-display.tsx (uses tenant currency)
- [X] T216 [P] [US6] Create TenantBranding component in src/components/features/settings/tenant-branding.tsx

### Pages for User Story 6

- [X] T217 [US6] Create workspace settings page in src/app/[locale]/(dashboard)/settings/workspace/page.tsx

### Data Isolation Verification

- [X] T218 [US6] Add tenant ID to all Firestore queries in hooks (verify isolation)
- [X] T219 [US6] Update all server actions to verify tenant context from auth claims

**Checkpoint**: User Story 6 - Multi-tenant isolation is fully functional and testable independently

---

## Phase 10: User Story 8 - Bilingual Interface with Theme Support (Priority: P3)

**Goal**: Users switch between Arabic/English and dark/light themes

**Independent Test**: Switch languages and themes, verify UI updates correctly

### Implementation for User Story 8

- [X] T220 [US8] Complete Arabic translations in src/messages/ar.json for all features
- [X] T221 [P] [US8] Complete English translations in src/messages/en.json for all features
- [X] T222 [US8] Implement language preference persistence in user profile
- [X] T223 [P] [US8] Implement theme preference persistence in user profile
- [X] T224 [US8] Create RTL-aware icon components for directional icons in src/components/ui/rtl-icon.tsx
- [X] T225 [US8] Verify all components handle RTL layout correctly
- [X] T226 [P] [US8] Test dark theme across all components

**Checkpoint**: User Story 8 - Bilingual and theme support is fully functional and testable independently

---

## Phase 11: User Story 9 - Notifications and Alerts (Priority: P3)

**Goal**: Users receive in-app and email notifications for important events

**Independent Test**: Trigger notification events and verify delivery via both channels

### Type Definitions for User Story 9

- [ ] T227 [US9] Create Notification type definition in src/types/models/notification.ts per data-model.md

### Email Integration for User Story 9

- [ ] T228 [US9] Setup Firebase Trigger Email extension configuration
- [ ] T229 [US9] Create email templates collection in Firestore for transactional emails
- [ ] T230 [US9] Create email helper functions in src/lib/email/send-email.ts

### Server Actions for User Story 9

- [ ] T231 [US9] Implement createNotificationAction in src/app/actions/notifications.ts
- [ ] T232 [US9] Implement markNotificationReadAction in src/app/actions/notifications.ts
- [ ] T233 [US9] Implement updateNotificationPreferencesAction in src/app/actions/notifications.ts

### Notification Triggers

- [ ] T234 [US9] Add notification triggers to payment actions (payment_received, payment_approved, payment_rejected)
- [ ] T235 [P] [US9] Add notification triggers to booking actions (booking_confirmed, booking_cancelled)
- [ ] T236 [P] [US9] Add notification triggers to document actions (document_requested, document_verified, document_rejected)
- [ ] T237 [P] [US9] Add notification triggers to commission actions (commission_settled)
- [ ] T238 [P] [US9] Add notification triggers to subscription actions (subscription_expiring, trial_ending)

### Hooks for User Story 9

- [ ] T239 [US9] Create useNotifications hook with real-time subscription in src/hooks/use-notifications.ts
- [ ] T240 [P] [US9] Create useUnreadCount hook in src/hooks/use-unread-count.ts

### UI Components for User Story 9

- [ ] T241 [US9] Create NotificationBell component in src/components/features/notifications/notification-bell.tsx
- [ ] T242 [P] [US9] Create NotificationList component in src/components/features/notifications/notification-list.tsx
- [ ] T243 [P] [US9] Create NotificationItem component in src/components/features/notifications/notification-item.tsx
- [ ] T244 [US9] Create NotificationPreferences component in src/components/features/notifications/notification-preferences.tsx

### Pages for User Story 9

- [ ] T245 [US9] Create notifications page in src/app/[locale]/(dashboard)/notifications/page.tsx
- [ ] T246 [US9] Add notification preferences to settings page

**Checkpoint**: User Story 9 - Notification system is fully functional and testable independently

---

## Phase 12: User Story 10 - Landing Page and Marketing Site (Priority: P3)

**Goal**: Public landing page with features, pricing, and free trial signup

**Independent Test**: Navigate all public pages and complete signup flow

### UI Components for User Story 10

- [ ] T247 [P] [US10] Create HeroSection component in src/components/features/landing/hero-section.tsx
- [ ] T248 [P] [US10] Create FeaturesSection component in src/components/features/landing/features-section.tsx
- [ ] T249 [P] [US10] Create PricingSection component in src/components/features/landing/pricing-section.tsx
- [ ] T250 [P] [US10] Create TestimonialsSection component in src/components/features/landing/testimonials-section.tsx
- [ ] T251 [P] [US10] Create ContactForm component in src/components/features/landing/contact-form.tsx
- [ ] T252 [P] [US10] Create Footer component in src/components/layout/footer.tsx
- [ ] T253 [P] [US10] Create PublicHeader component in src/components/layout/public-header.tsx

### Server Actions for User Story 10

- [ ] T254 [US10] Implement submitContactFormAction in src/app/actions/contact.ts
- [ ] T255 [P] [US10] Implement getPricingAction in src/app/actions/pricing.ts

### Pages for User Story 10

- [ ] T256 [US10] Create landing page in src/app/[locale]/(public)/page.tsx
- [ ] T257 [US10] Create pricing page in src/app/[locale]/(public)/pricing/page.tsx
- [ ] T258 [US10] Create contact page in src/app/[locale]/(public)/contact/page.tsx

**Checkpoint**: User Story 10 - Landing page is fully functional and testable independently

---

## Phase 13: User Story 11 - Reporting and Analytics Dashboard (Priority: P3)

**Goal**: Office admins view dashboards with sales reports, commission summaries, financial overviews

**Independent Test**: Generate reports with sample data and verify accuracy

### Server Actions for User Story 11

- [ ] T259 [US11] Implement getFinanceDashboardAction in src/app/actions/reports.ts
- [ ] T260 [US11] Implement getSalesReportAction in src/app/actions/reports.ts
- [ ] T261 [US11] Implement getCommissionReportAction in src/app/actions/reports.ts
- [ ] T262 [US11] Implement getCustomerActivityReportAction in src/app/actions/reports.ts

### Hooks for User Story 11

- [ ] T263 [US11] Create useFinanceDashboard hook in src/hooks/use-finance-dashboard.ts
- [ ] T264 [P] [US11] Create useSalesReport hook in src/hooks/use-sales-report.ts
- [ ] T265 [P] [US11] Create useCommissionReport hook in src/hooks/use-commission-report.ts

### UI Components for User Story 11

- [ ] T266 [US11] Create DashboardStats component in src/components/features/reports/dashboard-stats.tsx
- [ ] T267 [P] [US11] Create RevenueChart component in src/components/features/reports/revenue-chart.tsx
- [ ] T268 [P] [US11] Create BookingsChart component in src/components/features/reports/bookings-chart.tsx
- [ ] T269 [P] [US11] Create CommissionSummaryChart component in src/components/features/reports/commission-summary-chart.tsx
- [ ] T270 [P] [US11] Create TopPackagesTable component in src/components/features/reports/top-packages-table.tsx
- [ ] T271 [P] [US11] Create RecentActivityFeed component in src/components/features/reports/recent-activity-feed.tsx

### Pages for User Story 11

- [ ] T272 [US11] Create main dashboard page in src/app/[locale]/(dashboard)/page.tsx (home)
- [ ] T273 [US11] Create reports page in src/app/[locale]/(dashboard)/reports/page.tsx
- [ ] T274 [US11] Create sales report page in src/app/[locale]/(dashboard)/reports/sales/page.tsx
- [ ] T275 [US11] Create commissions report page in src/app/[locale]/(dashboard)/reports/commissions/page.tsx

**Checkpoint**: User Story 11 - Reporting dashboard is fully functional and testable independently

---

## Phase 14: User Story 12 - Audit Logging and Compliance (Priority: P3)

**Goal**: System tracks all significant changes for compliance and troubleshooting

**Independent Test**: Perform actions and verify log entries are created with correct details

### Type Definitions for User Story 12

- [ ] T276 [US12] Create AuditLog type definition in src/types/models/audit-log.ts per data-model.md

### Audit Logging Infrastructure

- [ ] T277 [US12] Enhance createAuditLog helper in src/lib/audit/create-log.ts with before/after value tracking
- [ ] T278 [US12] Add audit logging to all package actions (create, update, delete, status change)
- [ ] T279 [P] [US12] Add audit logging to all invoice actions
- [ ] T280 [P] [US12] Add audit logging to all payment actions
- [ ] T281 [P] [US12] Add audit logging to all booking actions
- [ ] T282 [P] [US12] Add audit logging to user management actions

### Hooks for User Story 12

- [ ] T283 [US12] Create useAuditLogs hook with filtering in src/hooks/use-audit-logs.ts
- [ ] T284 [P] [US12] Create useEntityHistory hook in src/hooks/use-entity-history.ts

### UI Components for User Story 12

- [ ] T285 [US12] Create AuditLogTable component in src/components/features/audit/audit-log-table.tsx
- [ ] T286 [P] [US12] Create AuditLogFilters component in src/components/features/audit/audit-log-filters.tsx
- [ ] T287 [P] [US12] Create AuditLogDetail component in src/components/features/audit/audit-log-detail.tsx
- [ ] T288 [P] [US12] Create EntityHistoryTimeline component in src/components/features/audit/entity-history-timeline.tsx

### Pages for User Story 12

- [ ] T289 [US12] Create audit logs page in src/app/[locale]/(dashboard)/audit-logs/page.tsx

**Checkpoint**: User Story 12 - Audit logging is fully functional and testable independently

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Error Handling & Loading States

- [ ] T290 [P] Create global error boundary in src/app/[locale]/error.tsx
- [ ] T291 [P] Create loading states for all pages in src/app/[locale]/(dashboard)/*/loading.tsx
- [ ] T292 [P] Create not-found page in src/app/[locale]/not-found.tsx

### Performance Optimization

- [ ] T293 Implement data caching strategy with React Query or SWR
- [ ] T294 [P] Optimize Firestore queries with proper indexes
- [ ] T295 [P] Implement image optimization for package cover images

### Security Hardening

- [ ] T296 Review and finalize Firestore security rules
- [ ] T297 [P] Review and finalize Storage security rules
- [ ] T298 [P] Add rate limiting to API routes
- [ ] T299 Add CSRF protection to server actions

### Final Validation

- [ ] T300 Run quickstart.md validation checklist
- [ ] T301 [P] Verify RTL layout across all pages
- [ ] T302 [P] Verify dark theme across all components
- [ ] T303 [P] Verify responsive design on mobile/tablet
- [ ] T304 Final accessibility audit (keyboard navigation, ARIA labels)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 7 (Phase 3)**: Depends on Foundational - BLOCKS other user stories (auth required)
- **User Stories 1-3 (Phases 4-6)**: All depend on US7 completion - P1 stories for MVP
- **User Stories 4-6 (Phases 7-9)**: All depend on US7 completion - P2 stories
- **User Stories 8-12 (Phases 10-14)**: Can start after respective dependencies - P3 stories
- **Polish (Phase 15)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 7 (Auth)**: Can start after Foundational (Phase 2) - BLOCKING for all others
- **User Story 1 (Packages)**: Depends on US7 - No dependencies on other stories
- **User Story 2 (Bookings)**: Depends on US7 + US1 (needs packages to book)
- **User Story 3 (Invoices)**: Depends on US7 + US2 (needs bookings to invoice)
- **User Story 4 (Partners)**: Depends on US7 + US1 (partners assigned to services)
- **User Story 5 (Subscriptions)**: Depends on US7 - Independent of business stories
- **User Story 6 (Multi-tenant)**: Built into foundation, enhancements in Phase 9
- **User Story 8 (i18n/Theme)**: Foundation in Phase 2, polish in Phase 10
- **User Story 9 (Notifications)**: Depends on US7 - Can add triggers incrementally
- **User Story 10 (Landing)**: Independent - Can be built anytime
- **User Story 11 (Reports)**: Depends on US1-3 (needs data to report on)
- **User Story 12 (Audit)**: Depends on US7 - Can add logging incrementally

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once US7 completes, US1 and US5 can start in parallel
- Once US1 completes, US2 and US4 can start in parallel
- US10 (Landing Page) can be built in parallel with any other story
- Within each story, all tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Packages)

```bash
# Launch all type definitions for User Story 1 together:
Task: "Create Package type definition in src/types/models/package.ts"
Task: "Create Service type definition in src/types/models/service.ts"
Task: "Create PartnerOffice type definition in src/types/models/partner-office.ts"

# After types, launch parallel UI components:
Task: "Create PackageCard component in src/components/features/packages/package-card.tsx"
Task: "Create PackageStatusBadge component in src/components/features/packages/package-status-badge.tsx"
Task: "Create ServiceCard component in src/components/features/packages/service-card.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 7, 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 7 (Authentication)
4. Complete Phase 4: User Story 1 (Package Creation)
5. Complete Phase 5: User Story 2 (Customer Booking)
6. Complete Phase 6: User Story 3 (Invoice Management)
7. **STOP and VALIDATE**: Test all P1 stories independently
8. Deploy/demo MVP

### Incremental Delivery

1. Complete Setup + Foundational + US7 → Authentication ready
2. Add User Story 1 → Package management ready (demo!)
3. Add User Story 2 → Booking with OCR ready (demo!)
4. Add User Story 3 → Invoice & payments ready (MVP complete!)
5. Add User Story 5 → Subscription billing active
6. Add User Story 4 → Partner commissions active
7. Add remaining P3 stories as needed

### Parallel Team Strategy

With multiple developers after US7 is complete:

1. Team completes Setup + Foundational + US7 together
2. Once US7 is done:
   - Developer A: User Story 1 (Packages)
   - Developer B: User Story 5 (Subscriptions) + User Story 10 (Landing)
3. Once US1 is done:
   - Developer A: User Story 2 (Bookings)
   - Developer C: User Story 4 (Partners)
4. Continue parallelization based on dependencies

---

## Summary

| Phase | User Story | Priority | Tasks | Key Deliverables |
|-------|-----------|----------|-------|------------------|
| 1 | Setup | - | T001-T009 | Project structure, dependencies |
| 2 | Foundational | - | T010-T043 | Auth, multi-tenancy, i18n foundation |
| 3 | US7: Authentication | P2 (BLOCKING) | T044-T059 | Login, signup, roles |
| 4 | US1: Packages | P1 | T060-T085 | Package & service management |
| 5 | US2: Bookings | P1 | T086-T123 | Customer booking with OCR |
| 6 | US3: Invoices | P1 | T124-T154 | Invoice & payment management |
| 7 | US4: Partners | P2 | T155-T182 | Commission tracking |
| 8 | US5: Subscriptions | P2 | T183-T210 | Stripe + bank transfer billing |
| 9 | US6: Multi-tenant | P2 | T211-T219 | Workspace isolation |
| 10 | US8: i18n/Theme | P3 | T220-T226 | Arabic/English, dark/light |
| 11 | US9: Notifications | P3 | T227-T246 | In-app + email alerts |
| 12 | US10: Landing | P3 | T247-T258 | Marketing site |
| 13 | US11: Reports | P3 | T259-T275 | Analytics dashboard |
| 14 | US12: Audit | P3 | T276-T289 | Change tracking |
| 15 | Polish | - | T290-T304 | Error handling, security, validation |

**Total Tasks**: 304
**MVP Tasks (US7, US1, US2, US3 + Foundation)**: ~154 tasks
**Suggested MVP Scope**: Phases 1-6 (Authentication + Package + Booking + Invoice management)

---

## Notes

- [P] tasks = different files, no dependencies within the same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
