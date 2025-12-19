'use client';

// InvoiceDetail component
// T146 [US3] Create InvoiceDetail component

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Download, Send, XCircle, CreditCard, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Invoice } from '@/types/models/invoice';
import { Timestamp } from 'firebase/firestore';

interface InvoiceDetailProps {
  invoice: Invoice;
  locale?: 'ar' | 'en';
  onDownloadPDF?: () => void;
  onIssue?: () => void;
  onCancel?: () => void;
  onAddPayment?: () => void;
}

export function InvoiceDetail({
  invoice,
  locale = 'ar',
  onDownloadPDF,
  onIssue,
  onCancel,
  onAddPayment,
}: InvoiceDetailProps) {
  const t = useTranslations('invoices');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMMM yyyy', { locale: dateLocale });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={isOverdue() ? 'overdue' : invoice.status} />
          </div>
          <p className="text-muted-foreground">
            {t('createdOn')} {formatDate(invoice.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onDownloadPDF && (
            <Button variant="outline" size="sm" onClick={onDownloadPDF}>
              <Download className="me-2 h-4 w-4" />
              {t('downloadPDF')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="me-2 h-4 w-4" />
            {t('print')}
          </Button>
          {onIssue && invoice.status === 'draft' && (
            <Button size="sm" onClick={onIssue}>
              <Send className="me-2 h-4 w-4" />
              {t('issue')}
            </Button>
          )}
          {onAddPayment && !['paid', 'cancelled', 'draft'].includes(invoice.status) && (
            <Button size="sm" onClick={onAddPayment}>
              <CreditCard className="me-2 h-4 w-4" />
              {t('addPayment')}
            </Button>
          )}
          {onCancel && !['paid', 'cancelled'].includes(invoice.status) && (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              <XCircle className="me-2 h-4 w-4" />
              {t('cancel')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('billTo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{invoice.customerName}</p>
            <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
            <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
          </CardContent>
        </Card>

        {/* Invoice Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('invoiceDates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('issueDate')}:</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('dueDate')}:</span>
              <span className={isOverdue() ? 'text-destructive font-medium' : ''}>
                {formatDate(invoice.dueDate)}
              </span>
            </div>
            {invoice.paidDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('paidDate')}:</span>
                <span className="text-green-600">{formatDate(invoice.paidDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('services')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-2 font-medium">{t('description')}</th>
                  <th className="text-center py-2 font-medium w-20">{t('qty')}</th>
                  <th className="text-end py-2 font-medium w-28">{t('unitPrice')}</th>
                  <th className="text-end py-2 font-medium w-28">{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <div>{item.description}</div>
                      {item.isOutsourced && item.partnerOfficeName && (
                        <div className="text-xs text-muted-foreground">
                          {t('via')} {item.partnerOfficeName}
                          {item.commissionPercentage && (
                            <span className="ms-2">
                              ({item.commissionPercentage}% {t('commission')})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-end py-3">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-end py-3">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('discount')}
                    {invoice.discountPercentage && ` (${invoice.discountPercentage}%)`}
                  </span>
                  <span className="text-green-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('tax')}
                    {invoice.taxPercentage && ` (${invoice.taxPercentage}%)`}
                  </span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{t('total')}</span>
                <span className="text-lg">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('paid')}</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
              )}
              {invoice.balance > 0 && (
                <div className="flex justify-between font-medium text-destructive">
                  <span>{t('balance')}</span>
                  <span>{formatCurrency(invoice.balance)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions */}
      {invoice.commissionsByPartner.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('partnerCommissions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.commissionsByPartner.map((comm) => (
                <div
                  key={comm.partnerOfficeId}
                  className="flex justify-between items-center p-2 bg-muted/50 rounded"
                >
                  <div>
                    <span className="font-medium">{comm.partnerOfficeName}</span>
                    <span
                      className={`ms-2 text-xs px-2 py-0.5 rounded ${
                        comm.status === 'settled'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {t(`commissionStatus.${comm.status}`)}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(comm.totalAmount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{t('totalCommissions')}</span>
                <span>{formatCurrency(invoice.totalCommissions)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="font-medium mb-1">{t('notes')}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-medium mb-1">{t('terms')}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.terms}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
