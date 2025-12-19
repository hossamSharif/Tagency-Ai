'use client';

// InvoiceStatusBadge component
// T143 [US3] Create InvoiceStatusBadge component

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types/models/invoice';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  issued: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  paid: 'bg-green-100 text-green-700 hover:bg-green-100',
  partial: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  cancelled: 'bg-red-100 text-red-700 hover:bg-red-100',
  overdue: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const t = useTranslations('invoices.status');

  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {t(status)}
    </Badge>
  );
}
