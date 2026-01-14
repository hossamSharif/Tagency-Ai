# Firestore Client-Side Hook Fix Pattern

## Overview

This document describes a recurring issue in the Travel Agency SaaS application where list pages show "No data found" despite data existing in the database. The root cause is that client-side Firestore hooks are blocked by Firestore security rules. This document provides the standardized fix pattern used across the application.

## The Problem

### Symptoms
- List pages (packages, customers, bookings) display empty state: "No packages found" / "لا توجد باقات"
- Data exists in Firestore database
- No error messages in the UI
- Console may show Firestore permission denied errors

### Root Cause

The application uses custom React hooks that call **client-side Firestore SDK functions**:

```typescript
// Problematic pattern - uses client-side Firestore
'use client';

export function usePackages() {
  const { user } = useAuth();           // Client-side auth
  const { tenant } = useTenant();       // Client-side tenant context

  useEffect(() => {
    // Client-side Firestore subscription - BLOCKED by security rules
    const unsubscribe = subscribeToCollection(
      tenant.id,
      'packages',
      constraints,
      setPackages,
      setError
    );
    return () => unsubscribe();
  }, [user, tenant]);
}
```

**Why this fails:**
1. Firestore security rules require authentication verification
2. Client-side SDK cannot properly authenticate with Firebase Admin credentials
3. Security rules block the read operations, returning empty results

### Affected Hooks
- `src/hooks/use-packages.ts` - Uses `subscribeToCollection()`, `useAuth()`, `useTenant()`
- `src/hooks/use-customers.ts` - Same pattern
- `src/hooks/use-bookings.ts` - Same pattern

---

## The Solution: Server Component Pattern

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Server Component (page.tsx)                   │
│  1. Authenticates user via session cookie                       │
│  2. Calls server action with Admin SDK (bypasses security rules)│
│  3. Serializes Firestore Timestamps to ISO strings              │
│  4. Passes serialized data to Client Component                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Client Component (*-list-client.tsx)            │
│  1. Receives pre-fetched, serialized data as props              │
│  2. Handles client-side filtering/search (in-memory)            │
│  3. Manages UI state (dropdowns, modals)                        │
│  4. Calls server actions for mutations (create, update, delete) │
│  5. NO client-side Firestore hooks                              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Server Action (already exists)

Location: `src/app/actions/{resource}.ts`

```typescript
// Server action using Admin SDK - bypasses Firestore security rules
export async function listPackagesAction(options?: {
  status?: PackageStatus;
  type?: string;
  limit?: number;
}): Promise<ActionResult<Record<string, unknown>[]>> {
  try {
    // Server-side authentication via session cookie
    const user = await requireAuthenticatedUser();

    // Use Admin SDK (bypasses security rules)
    const queryRef = adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('packages');

    const snapshot = await queryRef.get();

    let packages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // In-memory filtering (no composite index needed)
    if (status) {
      packages = packages.filter((pkg) => pkg.status === status);
    }

    // Serialize Timestamps for React Server Components
    return success(packages.map(serializePackage));
  } catch (err) {
    return error('Failed to list packages', ErrorCodes.INTERNAL_ERROR);
  }
}
```

#### 2. Timestamp Serialization

Firestore `Timestamp` objects cannot be passed from Server Components to Client Components. They must be serialized:

```typescript
function serializePackage(pkg: Record<string, unknown>): Record<string, unknown> {
  const serializeTimestamp = (ts: unknown): string | null => {
    if (!ts) return null;
    if (ts instanceof Timestamp) {
      return ts.toDate().toISOString();
    }
    if (typeof ts === 'string') {
      return ts;
    }
    return null;
  };

  return {
    ...pkg,
    startDate: serializeTimestamp(pkg.startDate),
    endDate: serializeTimestamp(pkg.endDate),
    createdAt: serializeTimestamp(pkg.createdAt),
    updatedAt: serializeTimestamp(pkg.updatedAt),
    publishedAt: serializeTimestamp(pkg.publishedAt),
  };
}
```

#### 3. Server Component Page

Location: `src/app/[locale]/(dashboard)/{resource}/page.tsx`

```typescript
// Packages list page - Server Component
import { requireAuth } from '@/lib/auth/require-role';
import { PackageListClient } from '@/components/features/packages/package-list-client';
import { listPackagesAction } from '@/app/actions/packages';
import { Package } from '@/types/models/package';

export default async function PackagesPage({ params }: PackagesPageProps) {
  const { locale } = await params;

  // Server-side authentication
  await requireAuth(locale);

  // Fetch data using Admin SDK (bypasses security rules)
  const packagesResult = await listPackagesAction();

  const packages = (packagesResult.success && packagesResult.data
    ? packagesResult.data
    : []) as Package[];

  // Pass serialized data to Client Component
  return <PackageListClient packages={packages} locale={locale} />;
}
```

#### 4. Client Component

Location: `src/components/features/{resource}/{resource}-list-client.tsx`

```typescript
'use client';

// NO Firestore hooks - receives data as props
interface PackageListClientProps {
  packages: Package[];  // Serialized data from server
  locale: string;
}

export function PackageListClient({
  packages: initialPackages,
  locale,
}: PackageListClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');

  // Client-side filtering (in-memory, no Firestore calls)
  const filteredPackages = useMemo(() => {
    return initialPackages.filter((pkg) => {
      if (search) {
        const matchesSearch = pkg.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all' && pkg.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [initialPackages, search, statusFilter]);

  // Render UI with filtered data
  return (
    <div>
      {/* Search and filter controls */}
      {/* Grid of cards */}
    </div>
  );
}
```

---

## Applied Fixes

### 1. Customers List
- **Before:** `CustomerList` used `useCustomers()` hook with client-side Firestore
- **After:** `CustomerListClient` receives data from `listCustomersAction()`
- **Files Modified:**
  - `src/app/[locale]/(dashboard)/customers/page.tsx`
  - `src/components/features/customers/customer-list-client.tsx` (new)

### 2. Bookings List
- **Before:** `BookingList` used `useBookings()` hook with client-side Firestore
- **After:** `BookingListClient` receives data from `listBookingsAction()`
- **Files Modified:**
  - `src/app/[locale]/(dashboard)/bookings/page.tsx`
  - `src/components/features/bookings/booking-list-client.tsx` (new)

### 3. Packages List
- **Before:** `PackageList` used `usePackages()` hook with client-side Firestore
- **After:** `PackageListClient` receives data from `listPackagesAction()`
- **Files Modified:**
  - `src/app/[locale]/(dashboard)/packages/page.tsx`
  - `src/components/features/packages/package-list-client.tsx` (new)

---

## Checklist for Future Fixes

When encountering "No data found" issues on list pages:

- [ ] **Identify the problematic hook** - Check if the component uses hooks like `usePackages()`, `useCustomers()`, etc.
- [ ] **Verify server action exists** - Check `src/app/actions/{resource}.ts` for a `list{Resource}Action`
- [ ] **Check serialization** - Ensure Timestamps are serialized to ISO strings
- [ ] **Create Client Component** - Create `{resource}-list-client.tsx` that accepts data as props
- [ ] **Update Page Component** - Fetch data server-side and pass to Client Component
- [ ] **Test both languages** - Verify Arabic and English versions work correctly

---

## Why This Pattern Works

1. **Server-side Authentication**: Uses session cookies and `requireAuthenticatedUser()` for secure auth
2. **Admin SDK Access**: Firebase Admin SDK bypasses Firestore security rules entirely
3. **Timestamp Serialization**: Converts Firestore-specific types to JSON-serializable formats
4. **Client-side Filtering**: In-memory filtering avoids additional Firestore queries
5. **Clean Separation**: Server handles data fetching, client handles UI interactions

---

## Related Files

### Server Actions
- `src/app/actions/packages.ts` - `listPackagesAction()`, `serializePackage()`
- `src/app/actions/customers.ts` - `listCustomersAction()`, `serializeCustomer()`
- `src/app/actions/bookings.ts` - `listBookingsAction()`, `serializeBooking()`

### Client Components (Fixed)
- `src/components/features/packages/package-list-client.tsx`
- `src/components/features/customers/customer-list-client.tsx`
- `src/components/features/bookings/booking-list-client.tsx`

### Server Pages (Fixed)
- `src/app/[locale]/(dashboard)/packages/page.tsx`
- `src/app/[locale]/(dashboard)/customers/page.tsx`
- `src/app/[locale]/(dashboard)/bookings/page.tsx`

### Legacy Hooks (Still exist but not used for list pages)
- `src/hooks/use-packages.ts` - May still be used for real-time updates in detail pages
- `src/hooks/use-customers.ts`
- `src/hooks/use-bookings.ts`

---

## Date: December 21, 2025
