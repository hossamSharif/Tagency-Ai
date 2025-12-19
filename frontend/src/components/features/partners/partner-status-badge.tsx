'use client';

/**
 * Partner Status Badge Component
 *
 * Displays a status badge for partner offices
 */

import { Badge } from '@/components/ui/badge';
import {
  type PartnerOfficeStatus,
  PARTNER_STATUS_INFO,
} from '@/types/models/partner-office';

interface PartnerStatusBadgeProps {
  status: PartnerOfficeStatus;
  locale?: string;
  size?: 'sm' | 'default';
}

export function PartnerStatusBadge({
  status,
  locale = 'en',
  size = 'default',
}: PartnerStatusBadgeProps) {
  const isArabic = locale === 'ar';
  const statusInfo = PARTNER_STATUS_INFO[status];

  const getVariant = () => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
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
