// Invoice Detail Page - Server Component
// T042 [US1] Enhance invoice detail page

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-role';
import { getSessionUser } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { InvoiceDetailClient } from './invoice-detail-client';
import { Invoice } from '@/types/models/invoice';
import { Account } from '@/types/models/account';

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
    console.log('[getInvoice] User:', user?.uid, 'TenantId:', user?.tenantId);
    if (!user) {
      console.log('[getInvoice] No user found, returning null');
      return null;
    }

    const tenantId = user.tenantId;
    const path = `tenants/${tenantId}/invoices`;
    console.log('[getInvoice] Querying:', path, 'invoiceId:', invoiceId);

    const doc = await adminDb
      .collection(path)
      .doc(invoiceId)
      .get();

    console.log('[getInvoice] Doc exists:', doc.exists);
    if (!doc.exists) {
      console.log('[getInvoice] Invoice not found, returning null');
      return null;
    }

    const data = doc.data();

    // Serialize Timestamps to ISO strings
    const serializeTimestamp = (ts: any): string | undefined => {
      if (!ts) return undefined;
      if (ts && typeof ts === 'object' && 'toDate' in ts) {
        return ts.toDate().toISOString();
      }
      if (ts && typeof ts === 'object' && '_seconds' in ts) {
        // Handle Firestore Timestamp object that hasn't been converted
        return new Date(ts._seconds * 1000).toISOString();
      }
      if (typeof ts === 'string') {
        return ts;
      }
      return undefined;
    };

    const serializeAttachment = (att: any) => {
      if (!att) return null;
      const serialized: any = {};

      // Copy all properties except Timestamp objects
      for (const key in att) {
        const value = att[key];
        if (value && typeof value === 'object' && ('toDate' in value || '_seconds' in value)) {
          serialized[key] = serializeTimestamp(value);
        } else {
          serialized[key] = value;
        }
      }

      return serialized;
    };

    const serializeLineItem = (item: any) => {
      const serialized: any = { ...item };

      if (item.attachments && Array.isArray(item.attachments)) {
        serialized.attachments = item.attachments.map(serializeAttachment).filter((a: any) => a !== null);
      }

      return serialized;
    };

    return {
      id: doc.id,
      ...data,
      // Map legacy field names to new schema
      total: data!.total ?? data!.netAmount ?? 0,
      balance: data!.balance ?? data!.remainingBalance ?? 0,
      totalCommissions: data!.totalCommissions ?? data!.totalCommission ?? 0,
      // Serialize timestamps
      createdAt: serializeTimestamp(data!.createdAt),
      updatedAt: serializeTimestamp(data!.updatedAt),
      invoiceDate: serializeTimestamp(data!.invoiceDate),
      dueDate: serializeTimestamp(data!.dueDate),
      issueDate: serializeTimestamp(data!.issueDate),
      paidDate: serializeTimestamp(data!.paidDate),
      cancelledAt: serializeTimestamp(data!.cancelledAt),
      attachments: data!.attachments?.map(serializeAttachment) || [],
      lineItems: (data!.lineItems ?? data!.items ?? []).map(serializeLineItem),
      commissionsByPartner: data!.commissionsByPartner || [],
    } as unknown as Invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

async function getPaymentAccounts(): Promise<Account[]> {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const tenantId = user.tenantId;

    const accountsSnapshot = await adminDb
      .collection(`tenants/${tenantId}/accounts`)
      .where('isActive', '==', true)
      .where('subtype', 'in', ['cash', 'bank'])
      .get();

    // Serialize Timestamps to ISO strings
    const serializeTimestamp = (ts: any): string | undefined => {
      if (!ts) return undefined;
      if (ts && typeof ts === 'object' && 'toDate' in ts) {
        return ts.toDate().toISOString();
      }
      if (ts && typeof ts === 'object' && '_seconds' in ts) {
        return new Date(ts._seconds * 1000).toISOString();
      }
      if (typeof ts === 'string') {
        return ts;
      }
      return undefined;
    };

    return accountsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
        lastUpdated: serializeTimestamp(data.lastUpdated),
      } as unknown as Account;
    });
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    return [];
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { locale, invoiceId } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch invoice and payment accounts
  const [invoice, paymentAccounts] = await Promise.all([
    getInvoice(invoiceId),
    getPaymentAccounts(),
  ]);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} paymentAccounts={paymentAccounts} locale={locale} />;
}
