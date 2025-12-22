'use client';

import { Invoice, InvoiceStatus } from '@/types/models/invoice';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { FileText, Eye, Edit, Download, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
}

function getStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'issued':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function formatCurrency(amount: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

export function InvoiceCard({ invoice, onView, onEdit, onDownload }: InvoiceCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{invoice.customerName}</span>
            </div>
          </div>
          <Badge className={getStatusColor(invoice.status)}>
            {t(`invoices.statuses.${invoice.status}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('invoices.invoiceDate')}:</span>
          <span className="font-medium">{formatDate(invoice.invoiceDate, locale)}</span>
        </div>

        {/* Line Items Count */}
        <div className="text-sm">
          <span className="text-muted-foreground">{t('invoices.services')}:</span>
          <span className="ml-2 font-medium">
            {invoice.lineItems.length} {invoice.lineItems.length === 1 ? t('invoices.service') : t('invoices.services')}
          </span>
        </div>

        {/* Amount Details */}
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('invoices.total')}:</span>
            <span className="font-semibold">{formatCurrency(invoice.total, locale)}</span>
          </div>
          {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoices.paid')}:</span>
                <span className="text-green-600 dark:text-green-400">
                  {formatCurrency(invoice.paidAmount || 0, locale)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">{t('invoices.balance')}:</span>
                <span className={invoice.balance > 0 ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {formatCurrency(invoice.balance, locale)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Commission Summary (if applicable) */}
        {invoice.totalCommissions > 0 && (
          <div className="text-xs text-muted-foreground pt-1 border-t">
            {t('invoices.partnerCommissions')}: {formatCurrency(invoice.totalCommissions, locale)}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('common.view')}
            </Button>
          )}
          {onEdit && invoice.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </Button>
          )}
          {onDownload && invoice.status !== 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              {t('common.download')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
