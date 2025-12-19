# API Contracts Overview

**Date**: 2025-12-19
**Architecture**: Next.js App Router (Server Actions + API Routes)

## Overview

This Travel Agency SaaS uses a hybrid approach:

1. **Server Actions** - For mutations (create, update, delete) with form handling
2. **API Routes** - For webhooks (Stripe) and external integrations
3. **Firestore Client SDK** - For real-time subscriptions in client components

## Contract Files

| File | Description |
|------|-------------|
| [auth.yaml](./auth.yaml) | Authentication flows (signup, login, password reset) |
| [packages.yaml](./packages.yaml) | Package and service management |
| [bookings.yaml](./bookings.yaml) | Booking lifecycle |
| [invoices.yaml](./invoices.yaml) | Invoice and payment operations |
| [customers.yaml](./customers.yaml) | Customer management |
| [partners.yaml](./partners.yaml) | Partner office and commission operations |
| [subscriptions.yaml](./subscriptions.yaml) | Subscription and billing |
| [webhooks.yaml](./webhooks.yaml) | External webhook endpoints |

## Server Actions Pattern

Server Actions are defined in `src/app/actions/` and follow this pattern:

```typescript
// src/app/actions/packages.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';

// Validation schema
const createPackageSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['hajj', 'umrah', 'honeymoon', 'custom']),
  // ...
});

// Action with typed response
export async function createPackage(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  // 2. Validate input
  const validated = createPackageSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) return { error: validated.error.flatten() };

  // 3. Execute
  try {
    const packageId = await createPackageInFirestore(user.tenantId, validated.data);
    revalidatePath('/packages');
    return { success: true, data: { packageId } };
  } catch (error) {
    return { error: 'Failed to create package' };
  }
}
```

## API Routes Pattern

API Routes are used for webhooks and external integrations:

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
    // ...
  }

  return new Response('OK', { status: 200 });
}
```

## Response Format

All Server Actions return a consistent `ActionState`:

```typescript
type ActionState =
  | { success: true; data?: Record<string, any>; message?: string }
  | { error: string | ZodError; fieldErrors?: Record<string, string[]> };
```

## Authentication

All operations require Firebase Authentication. Tenant context is stored in custom claims:

```typescript
interface UserClaims {
  tenantId: string;
  role: 'owner' | 'admin' | 'staff' | 'customer' | 'partner';
  partnerOfficeId?: string;
  platformAdmin?: boolean;
}
```

## Real-time Subscriptions

Client components use Firestore SDK directly for real-time data:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function usePackages(tenantId: string) {
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, `tenants/${tenantId}/packages`),
      where('status', '==', 'active')
    );

    return onSnapshot(q, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [tenantId]);

  return packages;
}
```
