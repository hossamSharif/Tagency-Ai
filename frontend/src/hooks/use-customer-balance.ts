'use client';

// useCustomerBalance hook with Firestore subscription
// T142 [US3] Create useCustomerBalance hook

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTenant } from './use-tenant';
import { Invoice } from '@/types/models/invoice';
import { Payment } from '@/types/models/payment';

export interface CustomerBalanceData {
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  pendingPayments: number;
  invoiceCount: number;
  paymentCount: number;
  lastPaymentDate: Date | null;
  overdueAmount: number;
}

export interface UseCustomerBalanceResult {
  data: CustomerBalanceData | null;
  loading: boolean;
  error: string | null;
}

export function useCustomerBalance(customerId: string | undefined): UseCustomerBalanceResult {
  const { tenant } = useTenant();
  const [data, setData] = useState<CustomerBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id || !customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to invoices for this customer
    const invoicesQuery = query(
      collection(db, `tenants/${tenant.id}/invoices`),
      where('customerId', '==', customerId)
    );

    // Subscribe to payments for this customer
    const paymentsQuery = query(
      collection(db, `tenants/${tenant.id}/payments`),
      where('customerId', '==', customerId)
    );

    let invoices: Invoice[] = [];
    let payments: Payment[] = [];
    let invoicesLoaded = false;
    let paymentsLoaded = false;

    const calculateBalance = () => {
      if (!invoicesLoaded || !paymentsLoaded) return;

      const now = new Date();

      // Calculate total invoiced (excluding cancelled and draft)
      const activeInvoices = invoices.filter(
        (inv) => !['cancelled', 'draft'].includes(inv.status)
      );
      const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);

      // Calculate total paid (only completed payments)
      const completedPayments = payments.filter((p) => p.status === 'completed');
      const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate pending payments
      const pendingPayments = payments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate overdue amount
      const overdueAmount = activeInvoices
        .filter((inv) => {
          const dueDate = inv.dueDate.seconds
            ? new Date(inv.dueDate.seconds * 1000)
            : new Date();
          return dueDate < now && inv.balance > 0;
        })
        .reduce((sum, inv) => sum + inv.balance, 0);

      // Get last payment date
      const sortedPayments = completedPayments
        .filter((p) => p.processedAt)
        .sort((a, b) => {
          const aDate = a.processedAt?.seconds || 0;
          const bDate = b.processedAt?.seconds || 0;
          return bDate - aDate;
        });

      const lastPaymentDate = sortedPayments.length > 0 && sortedPayments[0].processedAt
        ? new Date(sortedPayments[0].processedAt.seconds * 1000)
        : null;

      setData({
        totalInvoiced,
        totalPaid,
        balance: totalInvoiced - totalPaid,
        pendingPayments,
        invoiceCount: activeInvoices.length,
        paymentCount: completedPayments.length,
        lastPaymentDate,
        overdueAmount,
      });

      setLoading(false);
    };

    const unsubInvoices = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        invoices = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[];
        invoicesLoaded = true;
        calculateBalance();
      },
      (err) => {
        console.error('Error fetching customer invoices:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        payments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payment[];
        paymentsLoaded = true;
        calculateBalance();
      },
      (err) => {
        console.error('Error fetching customer payments:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubInvoices();
      unsubPayments();
    };
  }, [tenant?.id, customerId]);

  return { data, loading, error };
}
