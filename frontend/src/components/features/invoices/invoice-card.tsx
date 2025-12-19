'use client';

// InvoiceCard component
// T144 [US3] Create InvoiceCard component

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Calendar,
  User,
  DollarSign,
  MoreVertical,
  Eye,
  Download,
  Send,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Invoice } from '@/types/models/invoice';
import { Timestamp } from 'firebase/firestore';

interface InvoiceCardProps {
  invoice: Invoice;
  locale?: 'ar' | 'en';
  onDownloadPDF?: () => void;
  onIssue?: () => void;
  onCancel?: () => void;
  onAddPayment?: () => void;
}

export function InvoiceCard({
  invoice,
  locale = 'ar',
  onDownloadPDF,
  onIssue,
  onCancel,
  onAddPayment,
}: InvoiceCardProps) {
  const t = useTranslations('invoices');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const isOverdue = () => {
    if (['paid', 'cancelled'].includes(invoice.status)) return false;
    const dueDate = invoice.dueDate.toDate();
    return dueDate < new Date() && invoice.balance > 0;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg font-mono">
              {invoice.invoiceNumber}
            </CardTitle>
            <InvoiceStatusBadge status={isOverdue() ? 'overdue' : invoice.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('booking')}: {invoice.bookingId.slice(0, 8)}...
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/invoices/${invoice.id}`}>
                <Eye className="me-2 h-4 w-4" />
                {t('view')}
              </Link>
            </DropdownMenuItem>
            {onDownloadPDF && (
              <DropdownMenuItem onClick={onDownloadPDF}>
                <Download className="me-2 h-4 w-4" />
                {t('downloadPDF')}
              </DropdownMenuItem>
            )}
            {onIssue && invoice.status === 'draft' && (
              <DropdownMenuItem onClick={onIssue}>
                <Send className="me-2 h-4 w-4" />
                {t('issue')}
              </DropdownMenuItem>
            )}
            {onAddPayment && !['paid', 'cancelled', 'draft'].includes(invoice.status) && (
              <DropdownMenuItem onClick={onAddPayment}>
                <CreditCard className="me-2 h-4 w-4" />
                {t('addPayment')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onCancel && !['paid', 'cancelled'].includes(invoice.status) && (
              <DropdownMenuItem
                onClick={onCancel}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="me-2 h-4 w-4" />
                {t('cancel')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{invoice.customerName}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(invoice.issueDate)}</span>
          </div>
          <div className="text-muted-foreground">
            {t('due')}: {formatDate(invoice.dueDate)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-lg">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          <div className="text-end">
            {invoice.paidAmount > 0 && invoice.balance > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('paid')}: </span>
                <span className="text-green-600">{formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            {invoice.balance > 0 && (
              <p className="text-sm font-medium text-destructive">
                {t('balance')}: {formatCurrency(invoice.balance)}
              </p>
            )}
            {invoice.status === 'paid' && (
              <p className="text-sm font-medium text-green-600">
                {t('fullyPaid')}
              </p>
            )}
          </div>
        </div>

        {invoice.totalCommissions > 0 && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            {t('commissions')}: {formatCurrency(invoice.totalCommissions)}
            <span className="ms-2">
              ({invoice.commissionsByPartner.length} {t('partners')})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
