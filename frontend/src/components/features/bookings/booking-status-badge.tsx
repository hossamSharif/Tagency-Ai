'use client';

// BookingStatusBadge component
// T114 [US2] Create BookingStatusBadge component

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { BookingStatus, PaymentStatus } from '@/types/models/booking';
import {
  Clock,
  CheckCircle,
  PlayCircle,
  CheckCheck,
  XCircle,
  DollarSign,
} from 'lucide-react';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const t = useTranslations('bookings.status');

  const statusConfig: Record<
    BookingStatus,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className?: string }
  > = {
    pending: {
      variant: 'secondary',
      icon: <Clock className="me-1 h-3 w-3" />,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    confirmed: {
      variant: 'default',
      icon: <CheckCircle className="me-1 h-3 w-3" />,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    in_progress: {
      variant: 'default',
      icon: <PlayCircle className="me-1 h-3 w-3" />,
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    completed: {
      variant: 'default',
      icon: <CheckCheck className="me-1 h-3 w-3" />,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    cancelled: {
      variant: 'destructive',
      icon: <XCircle className="me-1 h-3 w-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {t(status)}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const t = useTranslations('bookings.paymentStatus');

  const statusConfig: Record<
    PaymentStatus,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
  > = {
    unpaid: {
      variant: 'destructive',
    },
    partial: {
      variant: 'outline',
      className: 'border-yellow-500 text-yellow-700',
    },
    paid: {
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-500',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      <DollarSign className="me-1 h-3 w-3" />
      {t(status)}
    </Badge>
  );
}
