'use client';

/**
 * Settlement Status Badge Component
 *
 * Displays a status badge for commission settlements
 */

import { Badge } from '@/components/ui/badge';
import {
  SETTLEMENT_STATUS_INFO,
  type CommissionSettlement,
} from '@/types/models/partner-office';

interface SettlementStatusBadgeProps {
  status: CommissionSettlement['status'];
  locale?: string;
  size?: 'sm' | 'default';
}

export function SettlementStatusBadge({
  status,
  locale = 'en',
  size = 'default',
}: SettlementStatusBadgeProps) {
  const isArabic = locale === 'ar';
  const statusInfo = SETTLEMENT_STATUS_INFO[status];

  const getVariant = () => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'disputed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge
      variant={getVariant()}
      className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}
    >
      {isArabic ? statusInfo.labelAr : statusInfo.label}
    </Badge>
  );
}
