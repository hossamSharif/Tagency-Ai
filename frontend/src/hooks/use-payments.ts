'use client';

// usePayments hook with Firestore subscription
// T141 [US3] Create usePayments hook

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  QueryConstraint,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import { Payment, PaymentMethod, PaymentTransactionStatus } from '@/types/models/payment';

export interface UsePaymentsOptions {
  invoiceId?: string;
  customerId?: string;
  method?: PaymentMethod;
  status?: PaymentTransactionStatus;
  search?: string;
  limitCount?: number;
}

export interface UsePaymentsResult {
  payments: Payment[];
  loading: boolean;
  error: string | null;
}

export function usePayments(options: UsePaymentsOptions = {}): UsePaymentsResult {
  const { tenant } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    invoiceId,
    customerId,
    method,
    status,
    search,
    limitCount = 100,
  } = options;

  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (invoiceId) {
      constraints.push(where('invoiceId', '==', invoiceId));
    }

    if (customerId) {
      constraints.push(where('customerId', '==', customerId));
    }

    if (method) {
      constraints.push(where('method', '==', method));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Order and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(
      collection(db, `tenants/${tenant.id}/payments`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let paymentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payment[];

        // Client-side search filtering
        if (search) {
          const searchLower = search.toLowerCase();
          paymentList = paymentList.filter((payment) =>
            payment.paymentNumber.toLowerCase().includes(searchLower)
          );
        }

        setPayments(paymentList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching payments:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, invoiceId, customerId, method, status, search, limitCount]);

  return { payments, loading, error };
}
