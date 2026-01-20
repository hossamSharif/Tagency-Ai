'use client';

/**
 * Invoices List Client Component
 * T043 [US1] Enhance invoice list page with filters - Client interactivity
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Invoice, InvoiceStatus } from '@/types/models/invoice';
import { InvoiceCard } from '@/components/features/invoices/invoice-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, Filter, Plus, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface InvoicesListClientProps {
  initialInvoices: Invoice[];
  locale: string;
}

export function InvoicesListClient({ initialInvoices, locale }: InvoicesListClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  // Client-side filtering
  const filteredInvoices = useMemo(() => {
    let filtered = initialInvoices;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.customerName.toLowerCase().includes(searchLower) ||
          invoice.customerEmail.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [initialInvoices, statusFilter, search]);

  function handleView(invoiceId: string) {
    router.push(`/${locale}/invoices/${invoiceId}`);
  }

  function handleEdit(invoiceId: string) {
    router.push(`/${locale}/invoices/${invoiceId}/edit`);
  }

  async function handleDownload(invoiceId: string, invoiceNumber: string) {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t('invoices.title')}
          </h1>
          <p className="text-muted-foreground">{t('invoices.listDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/payments`}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('invoices.viewPayments')}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/invoices/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('invoices.createInvoice')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="invoice-search"
            name="search"
            placeholder={t('invoices.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}
          name="statusFilter"
        >
          <SelectTrigger className="w-full md:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('invoices.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('invoices.allStatuses')}</SelectItem>
            <SelectItem value="draft">{t('invoices.statuses.draft')}</SelectItem>
            <SelectItem value="issued">{t('invoices.statuses.issued')}</SelectItem>
            <SelectItem value="partial">{t('invoices.statuses.partial')}</SelectItem>
            <SelectItem value="paid">{t('invoices.statuses.paid')}</SelectItem>
            <SelectItem value="cancelled">{t('invoices.statuses.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('invoices.noInvoices')}</h3>
          <p className="text-muted-foreground mb-4">{t('invoices.noInvoicesDescription')}</p>
          <Button asChild>
            <Link href={`/${locale}/invoices/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('invoices.createFirstInvoice')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={() => handleView(invoice.id)}
              onEdit={invoice.status === 'draft' ? () => handleEdit(invoice.id) : undefined}
              onDownload={
                invoice.status !== 'draft'
                  ? () => handleDownload(invoice.id, invoice.invoiceNumber)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              {filteredInvoices.filter((i) => i.status === 'draft').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('invoices.statuses.draft')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {filteredInvoices.filter((i) => i.status === 'issued').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('invoices.statuses.issued')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {filteredInvoices.filter((i) => i.status === 'partial').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('invoices.statuses.partial')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {filteredInvoices.filter((i) => i.status === 'paid').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('invoices.statuses.paid')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {filteredInvoices.filter((i) => i.status === 'cancelled').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('invoices.statuses.cancelled')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
