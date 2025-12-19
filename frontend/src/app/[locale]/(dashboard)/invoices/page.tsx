'use client';

// Invoices list page
// T151 [US3] Create invoices list page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Search, Filter, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceCard } from '@/components/features/invoices/invoice-card';
import { useInvoices } from '@/hooks/use-invoices';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { issueInvoiceAction, cancelInvoiceAction } from '@/app/actions/invoices';
import { InvoiceStatus } from '@/types/models/invoice';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const params = useParams();
  const locale = (params.locale as 'ar' | 'en') || 'ar';

  const { tenant } = useTenant();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const { invoices, loading, error } = useInvoices({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search,
  });

  const handleDownloadPDF = async (invoiceId: string) => {
    if (!tenant?.id) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'x-tenant-id': tenant.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error(t('pdfDownloadError'));
    }
  };

  const handleIssue = async (invoiceId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const result = await issueInvoiceAction(tenant.id, user.uid, invoiceId);

    if (result.success) {
      toast.success(t('invoiceIssued'));
    } else {
      toast.error(result.error || t('issueError'));
    }
  };

  const handleCancel = async (invoiceId: string) => {
    if (!tenant?.id || !user?.uid) return;

    const reason = prompt(t('cancelReason'));
    if (!reason) return;

    const result = await cancelInvoiceAction(tenant.id, user.uid, invoiceId, reason);

    if (result.success) {
      toast.success(t('invoiceCancelled'));
    } else {
      toast.error(result.error || t('cancelError'));
    }
  };

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>{t('loadError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}
        >
          <SelectTrigger className="w-full md:w-48">
            <Filter className="me-2 h-4 w-4" />
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="draft">{t('status.draft')}</SelectItem>
            <SelectItem value="issued">{t('status.issued')}</SelectItem>
            <SelectItem value="partial">{t('status.partial')}</SelectItem>
            <SelectItem value="paid">{t('status.paid')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noInvoices')}</h3>
          <p className="text-muted-foreground">{t('noInvoicesDesc')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              locale={locale}
              onDownloadPDF={() => handleDownloadPDF(invoice.id)}
              onIssue={() => handleIssue(invoice.id)}
              onCancel={() => handleCancel(invoice.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
