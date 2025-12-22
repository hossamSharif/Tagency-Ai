// Invoice Detail Page - Server Component
// T042 [US1] Enhance invoice detail page

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-role';
import { getSessionUser } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { InvoiceDetailClient } from './invoice-detail-client';
import { Invoice } from '@/types/models/invoice';

interface InvoiceDetailPageProps {
  params: Promise<{ locale: string; invoiceId: string }>;
}

export async function generateMetadata({ params }: InvoiceDetailPageProps) {
  const { locale, invoiceId } = await params;
  const t = await getTranslations({ locale, namespace: 'invoices' });

  return {
    title: t('invoiceDetails'),
  };
}

async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const user = await getSessionUser();
    if (!user) return null;

    const tenantId = user.tenantId;

    const doc = await adminDb
      .collection(`tenants/${tenantId}/invoices`)
      .doc(invoiceId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Serialize Timestamps to ISO strings
    const serializeTimestamp = (ts: any): string | undefined => {
      if (!ts) return undefined;
      if (ts && typeof ts === 'object' && 'toDate' in ts) {
        return ts.toDate().toISOString();
      }
      return ts;
    };

    return {
      ...data,
      createdAt: serializeTimestamp(data!.createdAt),
      updatedAt: serializeTimestamp(data!.updatedAt),
      invoiceDate: serializeTimestamp(data!.invoiceDate),
      dueDate: serializeTimestamp(data!.dueDate),
      issuedAt: serializeTimestamp(data!.issuedAt),
      cancelledAt: serializeTimestamp(data!.cancelledAt),
    } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { locale, invoiceId } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch invoice
  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} locale={locale} />;
}
