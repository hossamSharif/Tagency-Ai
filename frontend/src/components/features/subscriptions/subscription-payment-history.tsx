'use client';

/**
 * Subscription Payment History Component
 *
 * T205: Displays list of subscription payments.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubscriptionPayments } from '@/hooks/use-subscription';
import { SUBSCRIPTION_PAYMENT_STATUS_INFO } from '@/types/models/subscription';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { CreditCard, Building2, Loader2, FileText, Receipt } from 'lucide-react';

interface SubscriptionPaymentHistoryProps {
  locale?: 'ar' | 'en';
}

export function SubscriptionPaymentHistory({ locale = 'en' }: SubscriptionPaymentHistoryProps) {
  const { payments, loading, error } = useSubscriptionPayments();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const formatCurrency = (amount: number, currency: string) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {isArabic ? 'فشل تحميل سجل المدفوعات' : 'Failed to load payment history'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {isArabic ? 'سجل المدفوعات' : 'Payment History'}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? 'جميع مدفوعات الاشتراك السابقة'
            : 'All previous subscription payments'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isArabic ? 'لا توجد مدفوعات حتى الآن' : 'No payments yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead>{isArabic ? 'الطريقة' : 'Method'}</TableHead>
                  <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isArabic ? 'الفترة' : 'Period'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const statusInfo = SUBSCRIPTION_PAYMENT_STATUS_INFO[payment.status];

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(payment.createdAt.toDate(), 'PPP', { locale: dateLocale })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.method === 'stripe' ? (
                            <>
                              <CreditCard className="h-4 w-4" />
                              <span>{isArabic ? 'بطاقة' : 'Card'}</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4" />
                              <span>{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusInfo.color === 'green'
                              ? 'default'
                              : statusInfo.color === 'yellow'
                              ? 'secondary'
                              : statusInfo.color === 'red'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {isArabic ? statusInfo.labelAr : statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.periodStart && payment.periodEnd ? (
                          <>
                            {format(payment.periodStart.toDate(), 'dd MMM', {
                              locale: dateLocale,
                            })}
                            {' - '}
                            {format(payment.periodEnd.toDate(), 'dd MMM yyyy', {
                              locale: dateLocale,
                            })}
                          </>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
