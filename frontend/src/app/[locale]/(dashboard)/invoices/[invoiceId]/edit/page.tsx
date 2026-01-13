// Edit Invoice Page - Server Component
// Supports editing invoices at any status with accounting adjustments

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { requireAuth, getSessionUser } from '@/lib/auth/require-role';
import { adminDb } from '@/lib/firebase/admin';
import { EditInvoiceClient } from './edit-invoice-client';
import { listCustomersAction } from '@/app/actions/customers';
import { getServiceCatalogItems } from '@/app/actions/services-catalog';
import { listPartnersAction } from '@/app/actions/partners';
import { Invoice } from '@/types/models/invoice';

interface EditInvoicePageProps {
  params: Promise<{ locale: string; invoiceId: string }>;
}

export async function generateMetadata({ params }: EditInvoicePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'invoices' });

  return {
    title: t('editInvoice'),
  };
}

async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const user = await getSessionUser();
    if (!user) return null;

    const tenantId = user.tenantId;
    const path = `tenants/${tenantId}/invoices`;

    const doc = await adminDb
      .collection(path)
      .doc(invoiceId)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();

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

    const serializeAttachment = (att: any) => {
      if (!att) return null;
      const serialized: any = {};

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
      total: data!.total ?? data!.netAmount ?? 0,
      balance: data!.balance ?? data!.remainingBalance ?? 0,
      totalCommissions: data!.totalCommissions ?? data!.totalCommission ?? 0,
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

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { locale, invoiceId } = await params;

  // Require authentication
  await requireAuth(locale);

  // Fetch invoice
  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
  }

  // Block editing cancelled invoices
  if (invoice.status === 'cancelled') {
    redirect(`/${locale}/invoices/${invoiceId}`);
  }

  // Fetch required data for invoice form
  const [customersResult, servicesResult, partnersResult] = await Promise.all([
    listCustomersAction({ limit: 500 }),
    getServiceCatalogItems({ activeOnly: true }),
    listPartnersAction({ status: 'active', limit: 200 }),
  ]);

  const customers = customersResult.success && customersResult.data ? customersResult.data : [];
  const services = servicesResult.success && servicesResult.data ? servicesResult.data : [];
  const partners = partnersResult.success && partnersResult.data ? partnersResult.data : [];

  return (
    <EditInvoiceClient
      invoice={invoice}
      customers={customers}
      services={services}
      partners={partners}
      locale={locale}
    />
  );
}
