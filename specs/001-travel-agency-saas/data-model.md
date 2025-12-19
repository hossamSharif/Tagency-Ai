# Data Model: Travel Agency SaaS Platform

**Date**: 2025-12-19
**Database**: Firebase Firestore (NoSQL)
**Storage**: Firebase Storage (documents, images)

## Overview

This document defines the Firestore data model for the multi-tenant Travel Agency SaaS platform. All tenant data is isolated under `tenants/{tenantId}/` path prefix.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   Subscription  │───────│     Tenant      │
│  (root level)   │   1:1 │   (workspace)   │
└─────────────────┘       └────────┬────────┘
                                   │ 1:N
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐      ┌─────────────────┐
│      User       │     │     Package     │      │  PartnerOffice  │
│  (staff/admin)  │     │                 │      │                 │
└────────┬────────┘     └────────┬────────┘      └────────┬────────┘
         │                       │ 1:N                    │
         │                       ▼                        │
         │              ┌─────────────────┐               │
         │              │     Service     │───────────────┘
         │              │                 │    assignment
         │              └────────┬────────┘
         │                       │
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Customer     │ │     Booking     │ │    Document     │
│                 │◄│                 │ │                 │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         │                   │ 1:1
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│  PassportData   │ │     Invoice     │
│                 │ │                 │
└─────────────────┘ └────────┬────────┘
                             │ 1:N
                             ▼
                    ┌─────────────────┐
                    │     Payment     │
                    │                 │
                    └─────────────────┘
```

---

## Entities

### 1. Tenant (Office/Workspace)

**Collection**: `tenants/{tenantId}`

The root entity for multi-tenancy. Each travel agency is a tenant with isolated data.

```typescript
interface Tenant {
  // Identity
  id: string;                    // Firestore doc ID
  name: string;                  // Office/agency name
  slug: string;                  // URL-friendly identifier

  // Contact
  email: string;                 // Primary contact email
  phone?: string;                // Contact phone
  address?: Address;             // Physical address

  // Settings
  currency: CurrencyCode;        // 'USD' | 'SAR' | 'EUR' | 'SDG' | etc.
  timezone: string;              // IANA timezone
  language: 'ar' | 'en';         // Default language

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Status
  status: TenantStatus;          // 'active' | 'suspended' | 'trial'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Address {
  street?: string;
  city: string;
  country: string;
  postalCode?: string;
}

type CurrencyCode = 'USD' | 'SAR' | 'EUR' | 'SDG' | 'AED' | 'EGP' | 'GBP';
type TenantStatus = 'active' | 'suspended' | 'trial';
```

**Indexes**:
- `slug` (unique) - for URL lookups
- `status` - for admin filtering

---

### 2. Subscription

**Collection**: `subscriptions/{tenantId}` (root level for platform admin access)

Tracks the tenant's platform subscription status.

```typescript
interface Subscription {
  // Identity
  id: string;                    // Same as tenantId
  tenantId: string;              // Reference to tenant

  // Plan
  plan: SubscriptionPlan;        // 'trial' | 'monthly'
  status: SubscriptionStatus;    // 'active' | 'past_due' | 'cancelled' | 'expired'

  // Dates
  trialStartedAt?: Timestamp;
  trialEndsAt?: Timestamp;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;

  // Stripe
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Bank transfer
  pendingBankTransfer?: {
    paymentId: string;
    submittedAt: Timestamp;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type SubscriptionPlan = 'trial' | 'monthly';
type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending_payment';
```

**Indexes**:
- `status` - for admin dashboard filtering
- `trialEndsAt` - for expiration jobs
- `currentPeriodEnd` - for renewal processing

---

### 3. User

**Collection**: `tenants/{tenantId}/users/{userId}`

Users belong to a tenant and have roles determining access.

```typescript
interface User {
  // Identity
  id: string;                    // Firebase Auth UID
  email: string;
  displayName: string;

  // Role
  role: UserRole;                // 'owner' | 'admin' | 'staff' | 'customer' | 'partner'

  // Profile
  phone?: string;
  avatar?: string;               // Storage URL

  // Preferences
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;

  // For partner role
  partnerOfficeId?: string;      // If role is 'partner'

  // Status
  status: UserStatus;            // 'active' | 'suspended' | 'pending_verification'
  emailVerified: boolean;
  lastLoginAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type UserRole = 'owner' | 'admin' | 'staff' | 'customer' | 'partner';
type UserStatus = 'active' | 'suspended' | 'pending_verification';
```

**Indexes**:
- `email` - for lookups
- `role` - for filtering
- `status` - for admin management

**Validation Rules**:
- Email must be unique within tenant
- Owner role limited to 1 per tenant
- Partner role requires partnerOfficeId

---

### 4. Package

**Collection**: `tenants/{tenantId}/packages/{packageId}`

Tourism packages offered by the agency.

```typescript
interface Package {
  // Identity
  id: string;
  name: string;                  // e.g., "باقة الحج المميزة"
  slug: string;                  // URL-friendly

  // Type
  type: PackageType;             // 'hajj' | 'umrah' | 'honeymoon' | 'custom'

  // Description
  description: string;           // Rich text
  highlights?: string[];         // Key selling points

  // Dates
  startDate: Timestamp;
  endDate: Timestamp;
  duration: number;              // Days

  // Pricing
  basePrice: number;             // Base price before services
  totalPrice: number;            // Calculated from services
  currency: CurrencyCode;        // Inherited from tenant

  // Media
  coverImage?: string;           // Storage URL
  gallery?: string[];            // Additional images

  // Documents
  requiredDocuments: DocumentType[];  // What customers need to upload

  // Status
  status: PackageStatus;         // 'draft' | 'active' | 'completed' | 'cancelled'
  publishedAt?: Timestamp;

  // Capacity
  maxCapacity?: number;          // Max bookings
  currentBookings: number;       // Counter

  // Metadata
  createdBy: string;             // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type PackageType = 'hajj' | 'umrah' | 'honeymoon' | 'custom';
type PackageStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type DocumentType = 'passport' | 'visa' | 'photo' | 'vaccination' | 'other';
```

**Indexes**:
- `status` + `type` - for catalog filtering
- `startDate` - for date-based queries
- `slug` - for URL lookups

**State Transitions**:
```
draft → active (on publish)
active → completed (after end date)
active → cancelled (manual)
draft → cancelled (manual)
```

---

### 5. Service

**Collection**: `tenants/{tenantId}/packages/{packageId}/services/{serviceId}`

Individual services within a package.

```typescript
interface Service {
  // Identity
  id: string;
  name: string;                  // e.g., "تذكرة طيران - جدة"
  description?: string;

  // Type
  category: ServiceCategory;     // 'flight' | 'hotel' | 'visa' | 'transport' | 'guide' | 'other'

  // Pricing
  price: number;
  currency: CurrencyCode;

  // Dates (optional)
  serviceDate?: Timestamp;
  duration?: number;             // Hours or days

  // Sourcing
  isOutsourced: boolean;
  partnerOfficeId?: string;      // If outsourced
  commissionPercentage?: number; // Partner commission (e.g., 15 = 15%)

  // Details
  provider?: string;             // Hotel name, airline, etc.
  details?: Record<string, any>; // Flexible additional data

  // Order
  displayOrder: number;          // For UI ordering

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ServiceCategory = 'flight' | 'hotel' | 'visa' | 'transport' | 'guide' | 'meal' | 'other';
```

**Indexes**:
- `isOutsourced` + `partnerOfficeId` - for partner queries
- `category` - for filtering
- `displayOrder` - for ordering

---

### 6. Customer

**Collection**: `tenants/{tenantId}/customers/{customerId}`

Customers who book packages.

```typescript
interface Customer {
  // Identity
  id: string;
  userId?: string;               // If registered user

  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Nationality
  nationality: string;           // Country code
  nationalId?: string;           // Optional local ID

  // Passport (extracted from scan or manual)
  passport?: PassportData;

  // Address
  address?: Address;

  // Communication
  preferredLanguage: 'ar' | 'en';

  // Financial
  balance: number;               // Positive = credit, Negative = owes

  // Documents
  documents?: CustomerDocument[];

  // Metadata
  notes?: string;                // Admin notes
  tags?: string[];               // For categorization
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PassportData {
  passportNumber: string;
  fullName: string;              // As on passport
  dateOfBirth: Timestamp;
  expiryDate: Timestamp;
  nationality: string;
  gender: 'M' | 'F';
  issuingCountry: string;

  // OCR metadata
  extractedAt?: Timestamp;
  extractionConfidence?: number; // 0-100
  manuallyVerified: boolean;
}

interface CustomerDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;                   // Storage URL
  uploadedAt: Timestamp;
}
```

**Indexes**:
- `email` - for lookups
- `phone` - for lookups
- `passport.passportNumber` - for duplicate detection

---

### 7. PartnerOffice

**Collection**: `tenants/{tenantId}/partnerOffices/{partnerId}`

External offices that provide outsourced services.

```typescript
interface PartnerOffice {
  // Identity
  id: string;
  name: string;
  code: string;                  // Short code for reference

  // Contact
  contactPerson: string;
  email: string;
  phone: string;
  address?: Address;

  // Financial
  defaultCommissionPercentage: number;  // Default commission rate
  bankDetails?: BankDetails;

  // Relationship
  status: PartnerStatus;         // 'active' | 'suspended' | 'pending'
  contractStartDate?: Timestamp;
  contractEndDate?: Timestamp;

  // Users (partners can log in)
  userIds: string[];             // Users with 'partner' role

  // Metadata
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  iban?: string;
  swiftCode?: string;
}

type PartnerStatus = 'active' | 'suspended' | 'pending';
```

**Indexes**:
- `status` - for filtering
- `code` - for quick reference

---

### 8. Booking

**Collection**: `tenants/{tenantId}/bookings/{bookingId}`

A customer's reservation of a package.

```typescript
interface Booking {
  // Identity
  id: string;
  bookingNumber: string;         // Human-readable (e.g., "BK-2024-0001")

  // References
  customerId: string;
  packageId: string;
  packageSnapshot: PackageSnapshot;  // Frozen copy at booking time

  // Travelers
  travelers: Traveler[];         // Can book for multiple people

  // Status
  status: BookingStatus;         // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  paymentStatus: PaymentStatus;  // 'unpaid' | 'partial' | 'paid'

  // Dates
  bookingDate: Timestamp;
  travelDate: Timestamp;         // Package start for this booking

  // Financial
  totalAmount: number;
  paidAmount: number;
  balance: number;               // totalAmount - paidAmount
  currency: CurrencyCode;

  // Invoice
  invoiceId?: string;

  // Documents
  requiredDocuments: RequiredDocument[];

  // Metadata
  notes?: string;
  source?: 'web' | 'walk-in' | 'phone';
  createdBy: string;             // User who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PackageSnapshot {
  name: string;
  type: PackageType;
  services: ServiceSnapshot[];
  totalPrice: number;
}

interface ServiceSnapshot {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  isOutsourced: boolean;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  commissionPercentage?: number;
}

interface Traveler {
  firstName: string;
  lastName: string;
  passport?: PassportData;
  isPrimary: boolean;            // Primary contact
}

interface RequiredDocument {
  type: DocumentType;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  documentId?: string;           // Reference to uploaded doc
  rejectionReason?: string;
}

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
```

**Indexes**:
- `customerId` - for customer history
- `packageId` - for package analytics
- `status` - for management
- `bookingNumber` - for lookups
- `createdAt` - for date filtering

**State Transitions**:
```
pending → confirmed (on payment/approval)
pending → cancelled (customer or admin)
confirmed → in_progress (travel date reached)
in_progress → completed (travel ended)
confirmed → cancelled (before travel)
```

---

### 9. Invoice

**Collection**: `tenants/{tenantId}/invoices/{invoiceId}`

Billing document for a booking.

```typescript
interface Invoice {
  // Identity
  id: string;
  invoiceNumber: string;         // e.g., "INV-2024-0001"

  // References
  bookingId: string;
  customerId: string;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;              // Before any adjustments
  discount: number;              // Total discounts
  tax: number;                   // If applicable
  total: number;                 // Final amount
  currency: CurrencyCode;

  // Commission Summary
  totalCommissions: number;      // Sum of partner commissions
  commissionsByPartner: CommissionSummary[];

  // Status
  status: InvoiceStatus;         // 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled'
  paidAmount: number;
  balance: number;

  // Dates
  issueDate: Timestamp;
  dueDate: Timestamp;

  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface InvoiceLineItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;

  // Outsourcing
  isOutsourced: boolean;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;     // Calculated: total * (commission / 100)
}

interface CommissionSummary {
  partnerOfficeId: string;
  partnerOfficeName: string;
  totalAmount: number;
  status: 'pending' | 'settled';
  settlementId?: string;
}

type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled' | 'overdue';
```

**Indexes**:
- `bookingId` - for booking lookup
- `customerId` - for customer history
- `status` - for management
- `invoiceNumber` - for search
- `dueDate` + `status` - for overdue processing

---

### 10. Payment

**Collection**: `tenants/{tenantId}/payments/{paymentId}`

Individual payment transactions.

```typescript
interface Payment {
  // Identity
  id: string;
  paymentNumber: string;         // e.g., "PAY-2024-0001"

  // References
  invoiceId: string;
  customerId: string;

  // Amount
  amount: number;
  currency: CurrencyCode;

  // Method
  method: PaymentMethod;         // 'stripe' | 'bank_transfer' | 'cash'

  // Status
  status: PaymentStatus;         // 'pending' | 'completed' | 'failed' | 'refunded'

  // Stripe (if applicable)
  stripePaymentIntentId?: string;
  stripeChargeId?: string;

  // Bank Transfer (if applicable)
  bankTransfer?: {
    transactionReference: string;
    proofDocumentUrl: string;
    bankName?: string;
    reviewedBy?: string;
    reviewedAt?: Timestamp;
    rejectionReason?: string;
  };

  // Dates
  paymentDate: Timestamp;
  processedAt?: Timestamp;

  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash';
type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
```

**Indexes**:
- `invoiceId` - for invoice payments
- `customerId` - for customer history
- `status` - for processing
- `method` + `status` - for bank transfer approvals

---

### 11. CommissionSettlement

**Collection**: `tenants/{tenantId}/commissionSettlements/{settlementId}`

Tracks commission payouts to partner offices.

```typescript
interface CommissionSettlement {
  // Identity
  id: string;
  settlementNumber: string;      // e.g., "SET-2024-0001"

  // Partner
  partnerOfficeId: string;
  partnerOfficeName: string;

  // Invoices included
  invoiceIds: string[];
  lineItemIds: string[];         // Specific line items settled

  // Amount
  totalAmount: number;
  currency: CurrencyCode;

  // Status
  status: SettlementStatus;      // 'pending' | 'approved' | 'paid' | 'disputed'

  // Payment details
  paymentMethod?: 'bank_transfer' | 'cash' | 'other';
  paymentReference?: string;
  paidAt?: Timestamp;

  // Dispute (if applicable)
  dispute?: {
    raisedBy: string;
    raisedAt: Timestamp;
    reason: string;
    resolvedAt?: Timestamp;
    resolution?: string;
  };

  // Metadata
  periodStart: Timestamp;        // Settlement period
  periodEnd: Timestamp;
  createdBy: string;
  approvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type SettlementStatus = 'pending' | 'approved' | 'paid' | 'disputed';
```

**Indexes**:
- `partnerOfficeId` + `status` - for partner dashboard
- `status` - for admin processing
- `periodEnd` - for date-based queries

---

### 12. Notification

**Collection**: `tenants/{tenantId}/notifications/{notificationId}`

In-app notifications for users.

```typescript
interface Notification {
  // Identity
  id: string;
  userId: string;                // Recipient

  // Content
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;    // Additional context

  // Action
  actionUrl?: string;            // Where to navigate

  // Status
  read: boolean;
  readAt?: Timestamp;

  // Delivery
  emailSent: boolean;
  emailSentAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
}

type NotificationType =
  | 'payment_received'
  | 'payment_approved'
  | 'payment_rejected'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'document_requested'
  | 'document_verified'
  | 'document_rejected'
  | 'package_updated'
  | 'commission_settled'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'trial_ending';
```

**Indexes**:
- `userId` + `read` - for unread count
- `userId` + `createdAt` - for notification list

---

### 13. AuditLog

**Collection**: `tenants/{tenantId}/auditLogs/{logId}`

Tracks changes to important entities.

```typescript
interface AuditLog {
  // Identity
  id: string;

  // Actor
  userId: string;
  userEmail: string;
  userRole: UserRole;

  // Action
  action: AuditAction;           // 'create' | 'update' | 'delete' | 'status_change'
  entityType: AuditEntityType;
  entityId: string;

  // Changes
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Context
  description?: string;
  ipAddress?: string;
  userAgent?: string;

  // Metadata
  timestamp: Timestamp;
}

type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'view' | 'export';
type AuditEntityType =
  | 'package'
  | 'service'
  | 'booking'
  | 'invoice'
  | 'payment'
  | 'customer'
  | 'user'
  | 'partner_office'
  | 'settlement';
```

**Indexes**:
- `entityType` + `entityId` - for entity history
- `userId` - for user activity
- `timestamp` - for date filtering
- `action` - for filtering

---

## Email Collection (Firebase Extension)

**Collection**: `mail/{mailId}` (root level)

Used by Firebase Trigger Email extension.

```typescript
interface MailDocument {
  to: string[];
  cc?: string[];
  bcc?: string[];
  template: {
    name: string;
    data: Record<string, any>;
  };
  // Added by extension
  delivery?: {
    state: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
    attempts: number;
    error?: string;
    endTime?: Timestamp;
  };
}
```

---

## Firestore Security Rules (Summary)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Platform-level (admin only)
    match /subscriptions/{tenantId} {
      allow read: if isPlatformAdmin() || isOwnerOf(tenantId);
      allow write: if isPlatformAdmin();
    }

    // Tenant data isolation
    match /tenants/{tenantId}/{document=**} {
      allow read: if belongsToTenant(tenantId);
      allow write: if belongsToTenant(tenantId) && hasWriteRole();
    }

    // Partner access (limited)
    match /tenants/{tenantId}/bookings/{bookingId} {
      allow read: if isPartnerWithAccess(tenantId, resource.data);
    }

    // Customer access (own data only)
    match /tenants/{tenantId}/customers/{customerId} {
      allow read, write: if isOwnCustomerRecord(customerId);
    }

    // Helper functions
    function belongsToTenant(tenantId) {
      return request.auth != null
        && request.auth.token.tenantId == tenantId;
    }

    function hasWriteRole() {
      return request.auth.token.role in ['owner', 'admin', 'staff'];
    }

    function isPlatformAdmin() {
      return request.auth.token.platformAdmin == true;
    }
  }
}
```

---

## Storage Structure

```
tenants/{tenantId}/
├── packages/{packageId}/
│   ├── cover.jpg
│   └── gallery/
│       ├── 1.jpg
│       └── 2.jpg
├── customers/{customerId}/
│   └── documents/
│       ├── passport.pdf
│       └── visa.jpg
├── payments/{paymentId}/
│   └── bank-transfer-proof.pdf
└── users/{userId}/
    └── avatar.jpg
```

---

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| Tenant | currency | Must be valid CurrencyCode |
| User | email | Unique within tenant |
| User | role=partner | Requires partnerOfficeId |
| Package | endDate | Must be after startDate |
| Package | totalPrice | Sum of service prices |
| Service | commissionPercentage | 0-100, required if outsourced |
| Booking | balance | totalAmount - paidAmount |
| Invoice | balance | total - paidAmount |
| Payment | amount | > 0 |
| Settlement | totalAmount | Sum of commission amounts |
