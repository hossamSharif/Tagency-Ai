'use client';

import { Invoice } from '@/types/models/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslations, useLocale } from 'next-intl';
import {
  FileText,
  Calendar,
  User,
  Building2,
  DollarSign,
  Paperclip,
  Download,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface InvoiceDetailProps {
  invoice: Invoice;
  onEdit?: () => void;
  onIssue?: () => void;
  onCancel?: () => void;
  onDownload?: () => void;
}

function getStatusColor(status: string): string {
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
      return 'bg-gray-100 text-gray-800';
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
    month: 'long',
    day: 'numeric'
  }).format(d);
}

export function InvoiceDetail({
  invoice,
  onEdit,
  onIssue,
  onCancel,
  onDownload
}: InvoiceDetailProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge className={getStatusColor(invoice.status)}>
              {t(`invoices.statuses.${invoice.status}`)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {t('invoices.createdOn')} {formatDate(invoice.createdAt, locale)}
          </p>
        </div>

        <div className="flex gap-2">
          {onEdit && invoice.status === 'draft' && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )}
          {onIssue && invoice.status === 'draft' && (
            <Button onClick={onIssue}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('invoices.issueInvoice')}
            </Button>
          )}
          {onDownload && invoice.status !== 'draft' && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.download')}
            </Button>
          )}
          {onCancel && invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <Button variant="destructive" onClick={onCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('invoices.cancel')}
            </Button>
          )}
        </div>
      </div>

      {/* Customer & Dates Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.invoiceDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.customer')}</p>
                  <p className="font-medium">{invoice.customerName}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('invoices.invoiceDate')}</p>
                    <p className="font-medium">{formatDate(invoice.invoiceDate, locale)}</p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('invoices.dueDate')}</p>
                      <p className="font-medium">{formatDate(invoice.dueDate, locale)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.services')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.lineItems.map((item, index) => (
              <div key={item.id || index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">
                      {locale === 'ar' ? item.serviceNameAr : item.serviceName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`services.types.${item.serviceType}`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.total, locale)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice, locale)}
                      {item.discount > 0 && ` - ${formatCurrency(item.discount, locale)}`}
                    </p>
                  </div>
                </div>

                {/* Beneficiary */}
                {item.beneficiary && item.beneficiary.name && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium">{t('invoices.beneficiary')}:</p>
                    <p className="text-sm text-muted-foreground">
                      {item.beneficiary.name} ({t(`invoices.relationships.${item.beneficiary.relationship}`)})
                      {item.beneficiary.idNumber && ` - ID: ${item.beneficiary.idNumber}`}
                    </p>
                  </div>
                )}

                {/* Partner/Commission */}
                {item.isOutsourced && item.partnerName && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('invoices.providedBy')}:</span>
                      <span className="font-medium">{item.partnerName}</span>
                      <span className="text-muted-foreground">
                        ({item.commissionPercentage}% = {formatCurrency(item.commissionAmount || 0, locale)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {item.comments && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{item.comments}</p>
                  </div>
                )}

                {/* Attachments */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {item.attachments.length} {t('invoices.attachments')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.summary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-muted-foreground">{t('invoices.subtotal')}:</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal, locale)}</span>
          </div>

          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('invoices.discount')}:</span>
              <span>-{formatCurrency(invoice.discount, locale)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-2xl font-bold">
            <span>{t('invoices.total')}:</span>
            <span>{formatCurrency(invoice.total, locale)}</span>
          </div>

          {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
            <>
              <Separator />
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>{t('invoices.paid')}:</span>
                <span>{formatCurrency(invoice.paidAmount || 0, locale)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('invoices.balance')}:</span>
                <span className={invoice.balance > 0 ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {formatCurrency(invoice.balance, locale)}
                </span>
              </div>
            </>
          )}

          {/* Commission Summary */}
          {invoice.totalCommissions > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">{t('invoices.partnerCommissions')}:</h4>
                {invoice.commissionsByPartner.map((comm) => (
                  <div key={comm.partnerId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{comm.partnerName}:</span>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(comm.amount, locale)}</span>
                      <Badge variant={comm.status === 'settled' ? 'default' : 'secondary'}>
                        {t(`invoices.commissionStatus.${comm.status}`)}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>{t('invoices.totalCommissions')}:</span>
                  <span>{formatCurrency(invoice.totalCommissions, locale)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes & Attachments */}
      {(invoice.notes || (invoice.attachments && invoice.attachments.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.additionalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="font-medium text-sm mb-2">{t('invoices.notes')}:</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {invoice.attachments && invoice.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">{t('invoices.attachments')}:</h4>
                <div className="space-y-2">
                  {invoice.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
