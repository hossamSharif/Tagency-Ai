'use client';

// PaymentStatusBadge component
// T147 [US3] Create PaymentStatusBadge component

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { PaymentTransactionStatus } from '@/types/models/payment';
import { cn } from '@/lib/utils';

interface PaymentStatusBadgeProps {
  status: PaymentTransactionStatus;
  className?: string;
}

const statusStyles: Record<PaymentTransactionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  completed: 'bg-green-100 text-green-700 hover:bg-green-100',
  failed: 'bg-red-100 text-red-700 hover:bg-red-100',
  refunded: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  cancelled: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const t = useTranslations('payments.status');

  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {t(status)}
    </Badge>
  );
}
