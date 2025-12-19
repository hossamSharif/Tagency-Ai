# Implementation Plan: Travel Agency SaaS Platform

**Branch**: `001-travel-agency-saas` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-travel-agency-saas/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a multi-tenant SaaS web application for travel agencies to manage tourism packages (Hajj, Umrah, honeymoon, custom trips), services, customers, and partner offices. The platform features Arabic-first RTL design with English support, dark/light themes, passport OCR scanning, Stripe payment integration with bank transfer fallback, commission tracking for partner offices, and a 1-week free trial subscription model. Built with Next.js + Firebase + shadcn/ui stack.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js, Firebase SDK, shadcn/ui, Stripe SDK, Tesseract.js (OCR)
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (documents/images)
**Authentication**: Firebase Authentication (email/password with verification)
**Testing**: Jest + React Testing Library, Playwright for E2E
**Target Platform**: Web (responsive for desktop, tablet, mobile browsers)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: <3s page load on mobile, 500 concurrent users per tenant, <5s invoice generation
**Constraints**: RTL-first layout, offline-capable passport OCR (Tesseract.js), single currency per tenant
**Scale/Scope**: Multi-tenant SaaS, 12 user stories, ~30 screens, 13 key entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Note**: Project constitution template not yet populated. Gates derived from planPrompt.md requirements.

### MCP Tool Requirements (from planPrompt.md)
| Requirement | Status | Notes |
|-------------|--------|-------|
| ref MCP tool for documentation/code references | PASS | Will use for design files, PDFs, docs |
| Stripe MCP tool for payments/subscriptions | PASS | All Stripe operations via MCP |
| shadcn/ui MCP tool for UI components | PASS | Modern design, RTL support |
| Chrome MCP tool for manual testing | PASS | RTL verification, user flows |
| Firebase CLI for database operations | PASS | Firestore, Auth, Storage |
| Stripe CLI for payment integration | PASS | Testing, webhook setup |
| No custom-coded integrations | PASS | MCP tools for all operations |

### Visual Identity Gates (from planPrompt.md)
| Requirement | Status | Notes |
|-------------|--------|-------|
| Modern Minimalist, Professional aesthetic | PASS | shadcn/ui aligns with this |
| Strict RTL for Arabic layout | PASS | Tailwind RTL utilities + Next.js |
| Noto Kufi Arabic font (Google Fonts) | PASS | Next.js font optimization |
| Color: Saudi Deep Green (#1E5631) | PASS | CSS variables |
| Color: Muted Gold accent (#D4AF37) | PASS | CSS variables |
| Backgrounds: White + Warm Light Grey (#F9FAFB) | PASS | CSS variables |

### Technical Gates
| Requirement | Status | Notes |
|-------------|--------|-------|
| Next.js App Router architecture | PASS | Modern React patterns |
| Firebase direct connection (no backend) | PASS | Serverless architecture |
| Multi-tenant data isolation | PASS | Firestore security rules |
| Tesseract.js for client-side OCR | PASS | No API costs |

## Project Structure

### Documentation (this feature)

```text
specs/001-travel-agency-saas/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js App Router Structure (Full-Stack Web Application)
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n route groups (ar, en)
│   │   ├── (auth)/               # Auth layout group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/          # Authenticated dashboard layout
│   │   │   ├── packages/
│   │   │   ├── customers/
│   │   │   ├── invoices/
│   │   │   ├── partners/
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   ├── (public)/             # Public pages layout
│   │   │   ├── page.tsx          # Landing page
│   │   │   └── pricing/
│   │   └── layout.tsx
│   ├── api/                      # API routes (webhooks, server actions)
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   └── ocr/                  # Server-side OCR processing
│   └── globals.css
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components (nav, sidebar)
│   └── features/                 # Feature-specific components
│       ├── packages/
│       ├── customers/
│       ├── invoices/
│       ├── passport-scanner/
│       └── subscriptions/
├── lib/                          # Utility libraries
│   ├── firebase/                 # Firebase config and helpers
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── stripe/                   # Stripe integration
│   ├── ocr/                      # Tesseract.js wrapper
│   ├── i18n/                     # Internationalization
│   └── utils/                    # General utilities
├── hooks/                        # Custom React hooks
├── contexts/                     # React context providers
├── types/                        # TypeScript type definitions
│   ├── models/                   # Entity types
│   └── api/                      # API types
└── messages/                     # i18n translation files
    ├── ar.json
    └── en.json

tests/
├── unit/                         # Unit tests (Jest)
├── integration/                  # Integration tests
└── e2e/                          # E2E tests (Playwright)

public/
├── locales/                      # Static translation assets
└── fonts/                        # Local font files (if needed)
```

**Structure Decision**: Next.js App Router with route groups for auth/dashboard/public layouts. Locale-based routing (`[locale]`) for Arabic/English i18n. Firebase SDK connects directly from client and server components (no separate backend). shadcn/ui components in `components/ui/`. Feature components organized by domain.

## Constitution Check - Post Design Review

*Completed after Phase 1 design artifacts generated.*

### Design Artifacts Generated
| Artifact | Status | Location |
|----------|--------|----------|
| research.md | COMPLETE | `specs/001-travel-agency-saas/research.md` |
| data-model.md | COMPLETE | `specs/001-travel-agency-saas/data-model.md` |
| quickstart.md | COMPLETE | `specs/001-travel-agency-saas/quickstart.md` |
| API Contracts | COMPLETE | `specs/001-travel-agency-saas/contracts/` |

### Post-Design Gate Review
| Gate | Status | Evidence |
|------|--------|----------|
| MCP Tools specified | PASS | Research documents tool usage patterns |
| Data model aligns with spec | PASS | All 13 entities from spec defined in data-model.md |
| API contracts cover user stories | PASS | Contracts for packages, bookings, invoices, customers, partners, subscriptions |
| Visual identity documented | PASS | CSS variables, fonts, colors in quickstart.md |
| Multi-tenancy designed | PASS | Firestore path-based isolation with security rules |
| RTL support planned | PASS | Tailwind RTL utilities, next-intl, locale routing |

### Complexity Tracking

> No constitution violations requiring justification. Design follows specified constraints.

| Aspect | Complexity Level | Justification |
|--------|-----------------|---------------|
| Multi-tenancy | Moderate | Required by spec - path-based Firestore isolation is simplest viable approach |
| i18n (AR/EN) | Low | next-intl is standard solution, RTL handled by Tailwind |
| Payment integration | Moderate | Required - Stripe + bank transfer both specified in requirements |
| OCR | Low | Tesseract.js client-side is simpler than cloud APIs |

## Generated Artifacts Summary

### Phase 0 Outputs
- `research.md` - Technical decisions for Next.js/Firebase integration, RTL strategy, OCR, payments, i18n, theming, commissions

### Phase 1 Outputs
- `data-model.md` - 13 Firestore entities with TypeScript types, validation rules, indexes, security rules
- `contracts/` - OpenAPI specs for auth, packages, bookings, invoices, customers, partners, subscriptions, webhooks
- `quickstart.md` - Project setup guide with Firebase, Stripe, i18n, theming configuration

### Next Phase
Run `/speckit.tasks` to generate tasks.md with implementation tasks.
