# Research: Travel Agency SaaS Platform

**Date**: 2025-12-19
**Status**: Complete

## Research Areas

### 1. Next.js App Router with Firebase Integration

**Decision**: Use Next.js 14+ App Router with Firebase SDK v9+ (modular)

**Rationale**:
- App Router provides server components for initial data fetching
- Firebase modular SDK supports tree-shaking for smaller bundles
- Server Actions can handle sensitive operations (Stripe webhooks)
- Client components for real-time Firestore subscriptions

**Alternatives Considered**:
- Pages Router: Rejected - older pattern, less optimal for streaming/suspense
- Separate Express backend: Rejected - adds complexity, Firebase SDK works directly
- Supabase: Rejected - spec explicitly requires Firebase

**Implementation Pattern**:
```typescript
// Server component for initial load
async function PackagesPage() {
  const packages = await getPackages(tenantId); // Server-side fetch
  return <PackageList initialData={packages} />;
}

// Client component for real-time updates
'use client';
function PackageList({ initialData }) {
  const packages = useFirestoreSubscription('packages', initialData);
  // Real-time updates
}
```

---

### 2. Multi-Tenant Data Architecture in Firestore

**Decision**: Tenant ID prefix in document paths with security rules

**Rationale**:
- Simple path structure: `tenants/{tenantId}/packages/{packageId}`
- Security rules enforce tenant isolation at database level
- No cross-tenant queries possible by design
- Scales well with Firestore's hierarchical model

**Alternatives Considered**:
- Separate Firestore projects per tenant: Rejected - operational complexity, cost
- Root-level collections with tenantId field: Rejected - requires composite indexes, security rule complexity
- Firebase Multi-tenancy (Identity Platform): Rejected - overkill for MVP, additional cost

**Data Structure**:
```
tenants/{tenantId}/
├── packages/{packageId}
├── services/{serviceId}
├── customers/{customerId}
├── bookings/{bookingId}
├── invoices/{invoiceId}
├── payments/{paymentId}
├── partnerOffices/{partnerId}
├── users/{userId}
├── notifications/{notificationId}
└── auditLogs/{logId}

// Root-level for platform admin
subscriptions/{tenantId}
platformSettings/config
```

**Security Rules Pattern**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tenants/{tenantId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.tenantId == tenantId;
    }
  }
}
```

---

### 3. RTL Layout Strategy with Tailwind CSS

**Decision**: Tailwind RTL plugin with `dir="rtl"` attribute and logical properties

**Rationale**:
- Tailwind CSS 3.3+ has built-in RTL support via `rtl:` variant
- Logical properties (start/end vs left/right) work automatically
- shadcn/ui components are RTL-compatible with minimal customization
- Single codebase handles both directions

**Alternatives Considered**:
- Separate RTL stylesheet: Rejected - maintenance burden, duplication
- CSS-in-JS with dynamic styles: Rejected - runtime overhead, complexity
- PostCSS RTL plugin: Rejected - Tailwind's built-in support is sufficient

**Implementation Pattern**:
```tsx
// Layout wrapper sets direction based on locale
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

// Components use logical properties automatically
<div className="ps-4 pe-2 ms-auto"> // start/end instead of left/right

// Explicit RTL overrides when needed
<Icon className="rtl:rotate-180" /> // Flip arrows for RTL
```

**Font Configuration**:
```typescript
// next.config.js - Google Fonts optimization
import { Noto_Kufi_Arabic, Inter } from 'next/font/google';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});
```

---

### 4. Tesseract.js Passport OCR Integration

**Decision**: Client-side Tesseract.js with server-side fallback for complex cases

**Rationale**:
- No API costs (self-hosted)
- Works offline after initial model load
- Arabic + English language support
- Manual correction UI handles accuracy gaps (spec accepts this)

**Alternatives Considered**:
- Google Cloud Vision: Rejected - API costs, external dependency
- AWS Textract: Rejected - API costs, not specified in requirements
- Server-only processing: Rejected - client-side provides faster UX

**Implementation Pattern**:
```typescript
import Tesseract from 'tesseract.js';

async function extractPassportData(imageFile: File): Promise<PassportData> {
  const worker = await Tesseract.createWorker(['eng', 'ara']);

  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();

  // Parse MRZ (Machine Readable Zone) if detected
  const mrzData = parseMRZ(text);

  // Fallback to field extraction
  return mrzData || extractFieldsFromText(text);
}

// MRZ parsing for passport bottom lines
function parseMRZ(text: string): PassportData | null {
  const mrzRegex = /P[A-Z<]{1}[A-Z]{3}[A-Z<]{39}\n[A-Z0-9<]{44}/;
  // Standard passport MRZ format parsing
}
```

**Accuracy Mitigation**:
- Pre-fill extracted fields for user verification
- Highlight low-confidence fields
- Allow manual override for all fields
- Store both OCR result and user-corrected values

---

### 5. Stripe Integration for Subscriptions and Payments

**Decision**: Stripe Checkout for subscriptions, Stripe Elements for customer payments

**Rationale**:
- Stripe Checkout handles subscription lifecycle (trials, billing)
- Stripe Elements for in-app payment collection
- Webhooks for async payment status updates
- Customer Portal for subscription management

**Alternatives Considered**:
- Custom payment form: Rejected - PCI compliance burden
- Stripe Payment Links: Rejected - less integrated experience
- PayPal: Rejected - not specified, Stripe is explicit requirement

**Implementation Pattern**:
```typescript
// Subscription checkout (office signup)
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_monthly_plan', quantity: 1 }],
  subscription_data: {
    trial_period_days: 7,
    metadata: { tenantId },
  },
  success_url: '/dashboard?subscription=success',
  cancel_url: '/pricing?subscription=cancelled',
});

// Customer payment (booking payment)
const paymentIntent = await stripe.paymentIntents.create({
  amount: invoiceTotal,
  currency: tenantCurrency,
  metadata: { invoiceId, tenantId },
});
```

**Webhook Events**:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Handle plan changes
- `customer.subscription.deleted` - Deactivate access
- `invoice.payment_failed` - Notify admin
- `payment_intent.succeeded` - Update invoice status

---

### 6. Bank Transfer Payment Flow

**Decision**: Manual approval workflow with document upload

**Rationale**:
- Required for markets where card payments are limited
- Platform admin reviews proof documents
- Simple state machine: pending → approved/rejected
- Integrates with existing notification system

**Implementation Pattern**:
```typescript
// Payment states
type BankTransferStatus = 'pending' | 'approved' | 'rejected';

interface BankTransferPayment {
  id: string;
  invoiceId: string;
  amount: number;
  proofDocumentUrl: string;
  transactionReference: string;
  status: BankTransferStatus;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Admin approval workflow
async function approveBankTransfer(paymentId: string, adminId: string) {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminId,
  });

  // Activate subscription or update invoice
  await activateSubscription(payment.tenantId);

  // Send notification
  await sendNotification(payment.userId, 'payment_approved');
}
```

---

### 7. i18n Strategy with next-intl

**Decision**: Use `next-intl` for App Router internationalization

**Rationale**:
- Native App Router support with server/client components
- Message format compatible with ICU standards
- Middleware for locale detection and routing
- Works with `[locale]` route parameter

**Alternatives Considered**:
- next-i18next: Rejected - primarily for Pages Router
- react-intl: Rejected - less Next.js-specific integration
- Custom solution: Rejected - unnecessary complexity

**Implementation Pattern**:
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

// messages/ar.json
{
  "packages": {
    "title": "باقات السفر",
    "create": "إنشاء باقة جديدة",
    "status": {
      "draft": "مسودة",
      "active": "نشط",
      "completed": "مكتمل"
    }
  }
}

// Component usage
import { useTranslations } from 'next-intl';

function PackagesPage() {
  const t = useTranslations('packages');
  return <h1>{t('title')}</h1>;
}
```

---

### 8. Theme System (Dark/Light Mode)

**Decision**: next-themes with CSS variables and Tailwind dark mode

**Rationale**:
- next-themes handles SSR hydration correctly
- System preference detection built-in
- Persists preference to localStorage
- Works seamlessly with shadcn/ui

**Implementation Pattern**:
```typescript
// providers.tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}

// globals.css - CSS variables for theme
:root {
  --primary: 30 64% 23%;     /* Saudi Deep Green */
  --accent: 43 68% 52%;       /* Muted Gold */
  --background: 0 0% 100%;
  --muted: 210 20% 98%;       /* Warm Light Grey */
}

.dark {
  --primary: 30 64% 33%;      /* Lighter green for dark */
  --accent: 43 68% 62%;       /* Lighter gold for dark */
  --background: 222 47% 11%;
  --muted: 217 33% 17%;
}
```

---

### 9. Email Notification Service

**Decision**: Firebase Extensions with SendGrid or Resend

**Rationale**:
- Firebase Trigger Email extension integrates with Firestore
- Write to `mail` collection triggers email send
- Template support for transactional emails
- Minimal code, serverless operation

**Alternatives Considered**:
- Nodemailer with SMTP: Rejected - requires server, more maintenance
- AWS SES: Rejected - not in Firebase ecosystem
- Custom Cloud Functions: Rejected - extension handles this

**Implementation Pattern**:
```typescript
// Trigger email by writing to Firestore
await addDoc(collection(db, 'mail'), {
  to: [customer.email],
  template: {
    name: 'booking-confirmation',
    data: {
      customerName: customer.name,
      packageName: booking.packageName,
      totalAmount: formatCurrency(invoice.total, tenant.currency),
    },
  },
});

// Email templates stored in Firestore
// templates/booking-confirmation
{
  subject: 'تأكيد الحجز - {{packageName}}',
  html: '<h1>شكراً {{customerName}}</h1>...'
}
```

---

### 10. Commission Calculation Logic

**Decision**: Calculate at invoice generation, track separately for settlements

**Rationale**:
- Commission percentages stored per service assignment
- Calculated when invoice is created (immutable record)
- Separate settlement tracking for partner payouts
- Audit trail for all commission changes

**Implementation Pattern**:
```typescript
interface ServiceAssignment {
  serviceId: string;
  partnerOfficeId: string;
  commissionPercentage: number; // e.g., 15
}

interface InvoiceLineItem {
  serviceId: string;
  serviceName: string;
  price: number;
  isOutsourced: boolean;
  partnerOfficeId?: string;
  commissionAmount?: number; // Calculated at invoice time
}

function calculateCommission(price: number, percentage: number): number {
  return Math.round(price * (percentage / 100) * 100) / 100; // Round to 2 decimals
}

// Generate invoice with commission calculations
function generateInvoice(booking: Booking, services: Service[]): Invoice {
  const lineItems = services.map(service => {
    const assignment = getServiceAssignment(service.id);
    const commissionAmount = assignment
      ? calculateCommission(service.price, assignment.commissionPercentage)
      : 0;

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      isOutsourced: !!assignment,
      partnerOfficeId: assignment?.partnerOfficeId,
      commissionAmount,
    };
  });

  return {
    bookingId: booking.id,
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.price, 0),
    totalCommissions: lineItems.reduce((sum, item) => sum + (item.commissionAmount || 0), 0),
  };
}
```

---

## Summary

All technical decisions have been resolved. Key patterns:

1. **Architecture**: Next.js App Router + Firebase direct connection (serverless)
2. **Multi-tenancy**: Firestore path-based isolation with security rules
3. **RTL**: Tailwind logical properties + `dir` attribute
4. **OCR**: Client-side Tesseract.js with manual correction fallback
5. **Payments**: Stripe for subscriptions, manual flow for bank transfers
6. **i18n**: next-intl with Arabic default
7. **Theming**: next-themes with CSS variables
8. **Email**: Firebase Trigger Email extension
9. **Commissions**: Calculate at invoice time, immutable record
