'use client';

// useBookings hook with Firestore subscription
// T105 [US2] Create useBookings hook

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
import { Booking, BookingStatus, PaymentStatus } from '@/types/models/booking';

export interface UseBookingsOptions {
  customerId?: string;
  packageId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  limitCount?: number;
}

export interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

export function useBookings(options: UseBookingsOptions = {}): UseBookingsResult {
  const { tenant } = useTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    customerId,
    packageId,
    status,
    paymentStatus,
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

    if (packageId) {
      constraints.push(where('packageId', '==', packageId));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (paymentStatus) {
      constraints.push(where('paymentStatus', '==', paymentStatus));
    }

    // Order and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(
      collection(db, `tenants/${tenant.id}/bookings`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let bookingList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];

        // Client-side search filtering
        if (search) {
          const searchLower = search.toLowerCase();
          bookingList = bookingList.filter(
            (booking) =>
              booking.bookingNumber.toLowerCase().includes(searchLower) ||
              booking.packageSnapshot.name.toLowerCase().includes(searchLower) ||
              booking.travelers.some(
                (t) =>
                  t.firstName.toLowerCase().includes(searchLower) ||
                  t.lastName.toLowerCase().includes(searchLower)
              )
          );
        }

        setBookings(bookingList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching bookings:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, customerId, packageId, status, paymentStatus, search, limitCount]);

  return { bookings, loading, error };
}
