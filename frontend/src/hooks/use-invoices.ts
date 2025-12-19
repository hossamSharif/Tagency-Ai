'use client';

// useInvoices hook with Firestore subscription
// T139 [US3] Create useInvoices hook

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
import { Invoice, InvoiceStatus } from '@/types/models/invoice';

export interface UseInvoicesOptions {
  customerId?: string;
  bookingId?: string;
  status?: InvoiceStatus;
  search?: string;
  limitCount?: number;
}

export interface UseInvoicesResult {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

export function useInvoices(options: UseInvoicesOptions = {}): UseInvoicesResult {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    customerId,
    bookingId,
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
    if (customerId) {
      constraints.push(where('customerId', '==', customerId));
    }

    if (bookingId) {
      constraints.push(where('bookingId', '==', bookingId));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Order and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(
      collection(db, `tenants/${tenant.id}/invoices`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let invoiceList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[];

        // Client-side search filtering
        if (search) {
          const searchLower = search.toLowerCase();
          invoiceList = invoiceList.filter(
            (invoice) =>
              invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
              invoice.customerName.toLowerCase().includes(searchLower) ||
              invoice.customerEmail.toLowerCase().includes(searchLower)
          );
        }

        setInvoices(invoiceList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching invoices:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, customerId, bookingId, status, search, limitCount]);

  return { invoices, loading, error };
}
