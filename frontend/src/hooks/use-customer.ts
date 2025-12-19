'use client';

// useCustomer hook for single customer with real-time updates
// T104 [US2] Create useCustomer hook

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import { Customer } from '@/types/models/customer';

export interface UseCustomerResult {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
}

export function useCustomer(customerId: string | null): UseCustomerResult {
  const { tenant } = useTenant();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id || !customerId) {
      setLoading(false);
      setCustomer(null);
      return;
    }

    setLoading(true);
    setError(null);

    const customerRef = doc(db, `tenants/${tenant.id}/customers/${customerId}`);

    const unsubscribe = onSnapshot(
      customerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCustomer({
            id: snapshot.id,
            ...snapshot.data(),
          } as Customer);
        } else {
          setCustomer(null);
          setError('Customer not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching customer:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, customerId]);

  return { customer, loading, error };
}
