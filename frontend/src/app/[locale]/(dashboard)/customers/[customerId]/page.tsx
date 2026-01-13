// Customer detail page - Server Component
// T120 [US2] Create customer detail page
// Updated: replaced bookings tab with invoices tab

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireAuth, getSessionUser } from '@/lib/auth/require-role';
import { CustomerDetailClient } from '@/components/features/customers/customer-detail-client';
import { getCustomerAction } from '@/app/actions/customers';
import { adminDb } from '@/lib/firebase/admin';
import { Invoice } from '@/types/models/invoice';

interface CustomerDetailPageProps {
  params: Promise<{ locale: string; customerId: string }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps) {
  const { locale, customerId } = await params;
  const t = await getTranslations({ locale, namespace: 'customers' });

  // Fetch customer for metadata
  const result = await getCustomerAction(customerId);
  const customer = result.success && result.data ? result.data : null;

  return {
    title: customer
      ? `${customer.firstName} ${customer.lastName} - ${t('title')}`
      : t('customerNotFound'),
  };
}

/**
 * Fetch invoices for a specific customer
 */
async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  try {
    const user = await getSessionUser();
    if (!user?.tenantId) return [];

    const tenantId = user.tenantId;

    const snapshot = await adminDb
      .collection(`tenants/${tenantId}/invoices`)
      .where('customerId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    // Serialize Timestamps to ISO strings
    const serializeTimestamp = (ts: any): string | undefined => {
      if (!ts) return undefined;
      if (ts && typeof ts === 'object' && 'toDate' in ts) {
        return ts.toDate().toISOString();
      }
      return ts;
    };

    const invoices = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        total: data.total ?? data.netAmount ?? 0,
        balance: data.balance ?? data.remainingBalance ?? 0,
        totalCommissions: data.totalCommissions ?? data.totalCommission ?? 0,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
        invoiceDate: serializeTimestamp(data.invoiceDate),
        dueDate: serializeTimestamp(data.dueDate),
        issueDate: serializeTimestamp(data.issueDate),
        paidDate: serializeTimestamp(data.paidDate),
        cancelledAt: serializeTimestamp(data.cancelledAt),
      } as unknown as Invoice;
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return [];
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { locale, customerId } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch customer using server action
  const customerResult = await getCustomerAction(customerId);

  if (!customerResult.success || !customerResult.data) {
    notFound();
  }

  // Fetch invoices for this customer
  const invoices = await getCustomerInvoices(customerId);

  return (
    <CustomerDetailClient
      customer={customerResult.data}
      invoices={invoices}
      locale={locale}
    />
  );
}
