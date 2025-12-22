// Invoices List Page - Server Component
// T043 [US1] Enhance invoice list page with filters

import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { InvoicesListClient } from './invoices-list-client';
import { getSessionUser } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { Invoice } from '@/types/models/invoice';

interface InvoicesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
}

export async function generateMetadata({ params }: InvoicesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'invoices' });

  return {
    title: t('title'),
  };
}

async function getInvoices(options?: {
  status?: string;
  limit?: number;
}): Promise<Invoice[]> {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const tenantId = user.tenantId;
    const { status, limit: limitCount = 100 } = options || {};

    let queryRef = adminDb
      .collection(`tenants/${tenantId}/invoices`)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);

    // Add status filter if provided
    if (status && status !== 'all') {
      queryRef = queryRef.where('status', '==', status) as any;
    }

    const snapshot = await queryRef.get();

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
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
        invoiceDate: serializeTimestamp(data.invoiceDate),
        dueDate: serializeTimestamp(data.dueDate),
        issuedAt: serializeTimestamp(data.issuedAt),
        cancelledAt: serializeTimestamp(data.cancelledAt),
      } as Invoice;
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

export default async function InvoicesPage({ params, searchParams }: InvoicesPageProps) {
  const { locale } = await params;
  const { status } = await searchParams;

  // Require authentication
  await requireAuth(locale);

  // Fetch initial invoices
  const invoices = await getInvoices({ status, limit: 100 });

  return <InvoicesListClient initialInvoices={invoices} locale={locale} />;
}
