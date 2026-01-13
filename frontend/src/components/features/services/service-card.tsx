'use client';

// ServiceCard component
// T020 [P] [US2] Create service-card component

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Building2,
  Users,
  MoreVertical,
  Eye,
  Pencil,
  Trash,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ServiceCatalogItem } from '@/types/models/service-catalog';

interface ServiceCardProps {
  service: ServiceCatalogItem;
  locale?: 'ar' | 'en';
  onEdit?: (service: ServiceCatalogItem) => void;
  onDelete?: (serviceId: string) => void;
}

export function ServiceCard({
  service,
  locale = 'ar',
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const t = useTranslations('services');
  const tCommon = useTranslations('common');
  const isArabic = locale === 'ar';

  const formatCurrency = (amount: number, currency: string) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getServiceTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      visa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      ticket: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      hotel: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      insurance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[type] || colors.other;
  };

  const getProviderBadgeColor = (providerType: string) => {
    return providerType === 'office'
      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg line-clamp-1">
            {isArabic ? service.nameAr : service.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {!isArabic && service.nameAr}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/services/${service.id}`}>
                <Eye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {tCommon('actions.view')}
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {tCommon('actions.edit')}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(service.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {tCommon('actions.delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <DollarSign className="h-5 w-5" />
          {formatCurrency(service.price, service.currency)}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getServiceTypeBadgeColor(service.type)}>
            {t(`types.${service.type}`)}
          </Badge>
          <Badge className={getProviderBadgeColor(service.providerType)}>
            {service.providerType === 'office' ? (
              <>
                <Building2 className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                {t('providerTypes.office')}
              </>
            ) : (
              <>
                <Users className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                {t('providerTypes.partner')}
              </>
            )}
          </Badge>
          {!service.isActive && (
            <Badge variant="secondary">{t('status.inactive')}</Badge>
          )}
        </div>

        {/* Partner Commission */}
        {service.providerType === 'partner' && service.commissionPercentage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
            <Percent className="h-4 w-4" />
            <span>
              {t('commission')}: {service.commissionPercentage}%
            </span>
          </div>
        )}

        {/* Partner Name */}
        {service.defaultPartnerName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="line-clamp-1">{service.defaultPartnerName}</span>
          </div>
        )}

        {/* Usage Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <FileText className="h-4 w-4" />
          <span>
            {t('usedInInvoices')}: {service.usageCount || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
