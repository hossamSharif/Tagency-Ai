'use client';

// PaymentCard component
// T148 [US3] Create PaymentCard component

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Calendar,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  CreditCard,
  Banknote,
  Building2,
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
import { PaymentStatusBadge } from './payment-status-badge';
import { Payment, PaymentMethod } from '@/types/models/payment';
import { Timestamp } from 'firebase/firestore';

interface PaymentCardProps {
  payment: Payment;
  locale?: 'ar' | 'en';
  onApprove?: () => void;
  onReject?: () => void;
}

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  stripe: <CreditCard className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
};

export function PaymentCard({
  payment,
  locale = 'ar',
  onApprove,
  onReject,
}: PaymentCardProps) {
  const t = useTranslations('payments');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMM yyyy HH:mm', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: payment.currency,
    }).format(amount);
  };

  const isPendingBankTransfer =
    payment.method === 'bank_transfer' && payment.status === 'pending';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg font-mono">
              {payment.paymentNumber}
            </CardTitle>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {methodIcons[payment.method]}
            <span>{t(`method.${payment.method}`)}</span>
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
              <Link href={`/${locale}/payments/${payment.id}`}>
                <Eye className="me-2 h-4 w-4" />
                {t('view')}
              </Link>
            </DropdownMenuItem>
            {isPendingBankTransfer && onApprove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onApprove} className="text-green-600">
                  <CheckCircle className="me-2 h-4 w-4" />
                  {t('approve')}
                </DropdownMenuItem>
              </>
            )}
            {isPendingBankTransfer && onReject && (
              <DropdownMenuItem
                onClick={onReject}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="me-2 h-4 w-4" />
                {t('reject')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(payment.paymentDate)}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
          </div>

          {payment.processedAt && (
            <div className="text-end text-sm text-muted-foreground">
              <p>{t('processedAt')}</p>
              <p>{formatDate(payment.processedAt)}</p>
            </div>
          )}
        </div>

        {payment.bankTransfer && (
          <div className="text-sm bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground">{t('transactionRef')}</p>
            <p className="font-mono">{payment.bankTransfer.transactionReference}</p>
            {payment.bankTransfer.bankName && (
              <p className="text-muted-foreground mt-1">
                {payment.bankTransfer.bankName}
              </p>
            )}
          </div>
        )}

        {payment.notes && (
          <p className="text-xs text-muted-foreground">{payment.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
