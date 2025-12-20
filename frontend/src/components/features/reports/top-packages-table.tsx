'use client';

/**
 * T270 [US11] Top Packages Table Component
 *
 * Displays top performing packages by revenue
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CurrencyCode } from '@/types/models/tenant';
import { PackageType } from '@/types/models/package';

interface TopPackage {
  id: string;
  name: string;
  type: string;
  bookings: number;
  revenue: number;
}

interface TopPackagesTableProps {
  data: TopPackage[];
  currency: CurrencyCode;
  isLoading?: boolean;
}

const typeColors: Record<PackageType, string> = {
  hajj: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  umrah: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  honeymoon: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function TopPackagesTable({ data, currency, isLoading }: TopPackagesTableProps) {
  const t = useTranslations('packages');
  const tReports = useTranslations('reports');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tReports('topPackages') || 'Top Packages'}</CardTitle>
        <CardDescription>
          {tReports('topPackagesDescription') || 'Best performing packages by revenue'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {t('noPackages') || 'No packages found'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fields.name') || 'Name'}</TableHead>
                <TableHead>{t('fields.type') || 'Type'}</TableHead>
                <TableHead className="text-center">
                  {tReports('bookings') || 'Bookings'}
                </TableHead>
                <TableHead className="text-end">
                  {tReports('revenue') || 'Revenue'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((pkg, index) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium truncate max-w-[200px]">
                        {pkg.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={typeColors[pkg.type as PackageType] || typeColors.custom}
                    >
                      {t(`types.${pkg.type}`) || pkg.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {pkg.bookings}
                  </TableCell>
                  <TableCell className="text-end font-medium">
                    <CurrencyDisplay amount={pkg.revenue} currency={currency} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
