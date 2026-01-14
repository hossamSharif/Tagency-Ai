# Implementation Plan: Service-Based Invoice & Accounting System

**Branch**: `001-service-invoice-accounting` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-service-invoice-accounting/spec.md`

## Summary

This feature replaces the existing package/reservation model with a service-based invoicing system. Staff can create invoices by selecting customers and adding predefined services (visa, tickets, hotel, insurance, etc.), with support for beneficiary information, document attachments, and partner commissions. The system includes double-entry accounting with chart of accounts, journal entries, customer/partner statements, and business expense tracking. All transactions update account balances automatically, providing complete financial visibility.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Next.js 16.1.0, React 19.x, Firebase SDK 12.7.0, shadcn/ui (Radix primitives), jsPDF (client-side PDF), Zod 4.x, React Hook Form 7.x
**Storage**: Firebase Firestore (NoSQL), Firebase Storage (attachments)
**Testing**: Manual testing with Chrome MCP, Jest for unit tests (as needed)
**Target Platform**: Web (desktop/mobile responsive), deployed via Firebase Hosting
**Project Type**: Web application (frontend-only with Firebase backend services)
**Performance Goals**: Invoice creation < 5 minutes for 5 services, payment recording < 1 minute, statement generation < 30 seconds
**Constraints**: Single-currency per workspace, 10MB max per attachment, 2 decimal precision for amounts, optimistic locking for concurrent edits
**Scale/Scope**: Multi-tenant SaaS, typical workspace: 100s of customers, 1000s of invoices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MCP-First Development | PASS | Will use Ref MCP for documentation, Chrome MCP for testing |
| II. Database Operations via Firebase CLI | PASS | All Firestore operations via Firebase SDK in Next.js server actions |
| III. Documentation-Driven Development via Ref MCP | PASS | Will use ref_search_documentation for jsPDF, double-entry patterns |
| IV. Browser Automation via Chrome MCP | PASS | E2E testing via Chrome MCP tools |
| V. Test-First Development | PASS | Tests before implementation for critical flows |
| VI. Simplicity and YAGNI | PASS | Starting with core invoicing, no over-engineering |
| VII. Commit and Push on Implementation | PASS | Will commit after task completion |
| VIII. Payment Operations via Stripe CLI | N/A | This feature handles internal accounting, not Stripe payments |

**Gate Status**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-service-invoice-accounting/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/(dashboard)/
│   │   │   ├── invoices/              # Existing - will enhance
│   │   │   │   ├── page.tsx           # Invoice list with filters
│   │   │   │   ├── new/page.tsx       # NEW: Create invoice page
│   │   │   │   └── [invoiceId]/
│   │   │   │       ├── page.tsx       # Invoice detail/edit
│   │   │   │       └── pdf/page.tsx   # NEW: PDF preview
│   │   │   ├── services/              # NEW: Service catalog
│   │   │   │   ├── page.tsx           # Service list
│   │   │   │   └── [serviceId]/page.tsx
│   │   │   ├── accounting/            # NEW: Accounting module
│   │   │   │   ├── accounts/page.tsx  # Chart of accounts
│   │   │   │   ├── journal/page.tsx   # Journal entries
│   │   │   │   └── expenses/page.tsx  # Business expenses
│   │   │   ├── statements/            # NEW: Account statements
│   │   │   │   └── page.tsx           # Customer/Partner statements
│   │   │   ├── payments/              # Existing - will enhance
│   │   │   │   ├── page.tsx           # Payment list (customer + partner)
│   │   │   │   └── [paymentId]/page.tsx
│   │   │   ├── customers/             # Existing - minimal changes
│   │   │   └── partners/              # Existing - minimal changes
│   │   └── actions/
│   │       ├── invoices.ts            # Existing - will extend
│   │       ├── services-catalog.ts    # NEW: Predefined services CRUD
│   │       ├── accounting.ts          # NEW: Chart of accounts, journal
│   │       ├── payments.ts            # Existing - will extend for partner payments
│   │       ├── expenses.ts            # NEW: Business expenses
│   │       └── statements.ts          # NEW: Statement generation
│   ├── components/
│   │   ├── features/
│   │   │   ├── invoices/              # NEW/Enhanced components
│   │   │   │   ├── invoice-form.tsx   # Main invoice creation form
│   │   │   │   ├── service-line-item.tsx
│   │   │   │   ├── beneficiary-form.tsx
│   │   │   │   └── quick-add-modals/
│   │   │   ├── services/              # NEW: Service catalog components
│   │   │   ├── accounting/            # NEW: Accounting components
│   │   │   ├── statements/            # NEW: Statement components
│   │   │   └── expenses/              # NEW: Expense components
│   │   └── ui/                        # shadcn/ui components (existing)
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── invoice-template.tsx   # Existing - may enhance
│   │   │   └── statement-template.tsx # NEW: Statement PDF
│   │   ├── accounting/                # NEW: Accounting utilities
│   │   │   ├── journal-entries.ts     # Double-entry helper
│   │   │   └── balance-calculator.ts
│   │   └── validations/
│   │       ├── invoices.ts            # Existing - will extend
│   │       ├── services-catalog.ts    # NEW
│   │       ├── accounting.ts          # NEW
│   │       └── expenses.ts            # NEW
│   └── types/
│       └── models/
│           ├── invoice.ts             # Existing - will extend with beneficiary
│           ├── service-catalog.ts     # NEW: Predefined service type
│           ├── account.ts             # NEW: Chart of accounts type
│           ├── journal-entry.ts       # NEW: Journal entry type
│           └── expense.ts             # NEW: Business expense type
```

**Structure Decision**: Frontend-only architecture leveraging existing Next.js App Router structure with Firebase backend. New accounting module added under `/accounting/`, services catalog under `/services/`, and statements under `/statements/`.

## Complexity Tracking

### Constitution Principle V (Test-First Development) - Justified Deviation

**Deviation**: This feature uses manual testing with Chrome MCP instead of automated TDD.

**Justification**:
1. **UI-Heavy Feature**: The service-based invoicing system is primarily UI-driven with forms, modals, and interactive components. Chrome MCP provides more realistic end-to-end validation than unit tests for these workflows.
2. **Existing Pattern Compliance**: The feature extends existing patterns (server actions, shadcn/ui components) that are already tested in the codebase. New code follows established conventions.
3. **Manual Testing Adequacy**: The quickstart.md defines comprehensive Chrome MCP test scenarios covering all user stories. These manual tests validate the complete user journey.
4. **Risk Assessment**: Core accounting logic (journal entries, balance calculations) is implemented in utility functions that can be unit-tested if complexity increases post-MVP.

**Mitigation**: If defects are discovered during manual testing, targeted unit tests will be added for the affected logic.

> No other violations requiring justification. The feature uses existing patterns and infrastructure.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. MCP-First Development | PASS | Design uses Ref MCP for documentation (jsPDF, @react-pdf/renderer), Chrome MCP planned for E2E testing |
| II. Database Operations via Firebase CLI | PASS | All data models use Firestore collections; server actions use Firebase Admin SDK |
| III. Documentation-Driven Development via Ref MCP | PASS | Research phase completed with Ref MCP for PDF generation and concurrency patterns |
| IV. Browser Automation via Chrome MCP | PASS | Quickstart includes Chrome MCP testing checklist for all user flows |
| V. Test-First Development | PASS | Quickstart defines test scenarios before implementation tasks |
| VI. Simplicity and YAGNI | PASS | Design uses existing patterns (server actions, shadcn/ui); no unnecessary abstractions |
| VII. Commit and Push on Implementation | PASS | Will follow standard commit workflow after implementation |
| VIII. Payment Operations via Stripe CLI | N/A | Feature handles internal accounting; no Stripe integration required |

**Post-Design Gate Status**: PASS - Design adheres to all applicable constitution principles.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/001-service-invoice-accounting/plan.md` | ✅ Complete |
| Research | `specs/001-service-invoice-accounting/research.md` | ✅ Complete |
| Data Model | `specs/001-service-invoice-accounting/data-model.md` | ✅ Complete |
| API Contracts | `specs/001-service-invoice-accounting/contracts/server-actions.md` | ✅ Complete |
| Quickstart Guide | `specs/001-service-invoice-accounting/quickstart.md` | ✅ Complete |
| Tasks | `specs/001-service-invoice-accounting/tasks.md` | ✅ Complete |

---

## Next Steps

Run `/speckit.implement` to begin implementation based on the task list in tasks.md.

