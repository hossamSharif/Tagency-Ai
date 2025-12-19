'use client';

// useCustomers hook with Firestore subscription
// T103 [US2] Create useCustomers hook

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
import { Customer } from '@/types/models/customer';

export interface UseCustomersOptions {
  search?: string;
  nationality?: string;
  hasPassport?: boolean;
  tags?: string[];
  limitCount?: number;
}

export interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersResult {
  const { tenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    nationality,
    hasPassport,
    tags,
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
    if (nationality) {
      constraints.push(where('nationality', '==', nationality));
    }

    if (tags && tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', tags));
    }

    // Order and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(
      collection(db, `tenants/${tenant.id}/customers`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let customerList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Customer[];

        // Client-side filtering for search and hasPassport
        if (search) {
          const searchLower = search.toLowerCase();
          customerList = customerList.filter(
            (customer) =>
              customer.firstName.toLowerCase().includes(searchLower) ||
              customer.lastName.toLowerCase().includes(searchLower) ||
              customer.email.toLowerCase().includes(searchLower) ||
              customer.phone.includes(search)
          );
        }

        if (hasPassport !== undefined) {
          customerList = customerList.filter(
            (customer) =>
              hasPassport
                ? customer.passport !== undefined
                : customer.passport === undefined
          );
        }

        setCustomers(customerList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching customers:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, search, nationality, hasPassport, tags, limitCount]);

  return { customers, loading, error };
}
