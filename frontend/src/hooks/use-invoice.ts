'use client';

// useInvoice hook with Firestore subscription
// T140 [US3] Create useInvoice hook

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import { Invoice } from '@/types/models/invoice';

export interface UseInvoiceResult {
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;
}

export function useInvoice(invoiceId: string | undefined): UseInvoiceResult {
  const { tenant } = useTenant();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id || !invoiceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, `tenants/${tenant.id}/invoices/${invoiceId}`);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setInvoice({
            id: snapshot.id,
            ...snapshot.data(),
          } as Invoice);
        } else {
          setInvoice(null);
          setError('Invoice not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching invoice:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, invoiceId]);

  return { invoice, loading, error };
}
