'use client';

// useBooking hook for single booking with real-time updates
// T106 [US2] Create useBooking hook

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import { Booking } from '@/types/models/booking';

export interface UseBookingResult {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
}

export function useBooking(bookingId: string | null): UseBookingResult {
  const { tenant } = useTenant();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id || !bookingId) {
      setLoading(false);
      setBooking(null);
      return;
    }

    setLoading(true);
    setError(null);

    const bookingRef = doc(db, `tenants/${tenant.id}/bookings/${bookingId}`);

    const unsubscribe = onSnapshot(
      bookingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBooking({
            id: snapshot.id,
            ...snapshot.data(),
          } as Booking);
        } else {
          setBooking(null);
          setError('Booking not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching booking:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, bookingId]);

  return { booking, loading, error };
}
