'use client';

/**
 * Package Card Component
 *
 * Displays a summary card for a package in the list view
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package as PackageType,
  PACKAGE_STATUS_INFO,
  PACKAGE_TYPE_INFO,
} from '@/types/models/package';
import { CURRENCIES } from '@/types/models/tenant';
import {
  MoreVertical,
  Calendar,
  Users,
  Edit,
  Copy,
  Trash2,
  Eye,
  Plane,
} from 'lucide-react';

interface PackageCardProps {
  package: PackageType;
  locale: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function PackageCard({
  package: pkg,
  locale,
  onEdit,
  onDuplicate,
  onDelete,
}: PackageCardProps) {
  const t = useTranslations('packages');
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const statusInfo = PACKAGE_STATUS_INFO[pkg.status];
  const typeInfo = PACKAGE_TYPE_INFO[pkg.type];
  const currencyInfo = CURRENCIES[pkg.currency];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: pkg.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: string | Date | { toDate: () => Date } | null | undefined) => {
    try {
      if (!timestamp) return '-';

      let date: Date;
      if (typeof timestamp === 'string') {
        // ISO string from server serialization
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else {
        return '-';
      }

      if (isNaN(date.getTime())) return '-';

      return format(date, 'dd MMM yyyy', { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="h-40 bg-muted relative overflow-hidden">
        {pkg.coverImage ? (
          <img
            src={pkg.coverImage}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Plane className="h-12 w-12 text-primary/50" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-2 end-2">
          <Badge variant={getStatusBadgeVariant(pkg.status)}>
            {isArabic ? statusInfo.labelAr : statusInfo.label}
          </Badge>
        </div>
        {/* Type Badge */}
        <div className="absolute top-2 start-2">
          <Badge variant="outline" className="bg-background/80">
            {isArabic ? typeInfo.labelAr : typeInfo.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{pkg.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/packages/${pkg.id}`}>
                  <Eye className="me-2 h-4 w-4" />
                  {t('view')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="me-2 h-4 w-4" />
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="me-2 h-4 w-4" />
                {t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(pkg.startDate)} - {formatDate(pkg.endDate)}
          </span>
        </div>

        {/* Capacity */}
        {pkg.maxCapacity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {pkg.currentBookings} / {pkg.maxCapacity}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'السعر الإجمالي' : 'Total Price'}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatPrice(pkg.totalPrice)}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/${locale}/packages/${pkg.id}`}>
              {t('view')}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
