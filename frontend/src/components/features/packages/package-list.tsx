'use client';

/**
 * Package List Component
 *
 * Displays a grid of package cards with filtering and search
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePackages } from '@/hooks/use-packages';
import { PackageCard } from './package-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PackageStatus, PackageType, PACKAGE_STATUS_INFO, PACKAGE_TYPE_INFO } from '@/types/models/package';
import { Package, Plus, Search } from 'lucide-react';

interface PackageListProps {
  locale: string;
  onCreateNew?: () => void;
}

export function PackageList({ locale, onCreateNew }: PackageListProps) {
  const t = useTranslations('packages');
  const isArabic = locale === 'ar';
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PackageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { packages, loading, error } = usePackages({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    limit: 50,
  });

  // Client-side search filter
  const filteredPackages = packages.filter((pkg) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Package}
        title={isArabic ? 'خطأ في تحميل الباقات' : 'Error loading packages'}
        description={error.message}
        action={{
          label: isArabic ? 'حاول مرة أخرى' : 'Try again',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PackageStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
            {(Object.keys(PACKAGE_STATUS_INFO) as PackageStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {isArabic
                  ? PACKAGE_STATUS_INFO[status].labelAr
                  : PACKAGE_STATUS_INFO[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as PackageType | 'all')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={isArabic ? 'النوع' : 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
            {(Object.keys(PACKAGE_TYPE_INFO) as PackageType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {isArabic
                  ? PACKAGE_TYPE_INFO[type].labelAr
                  : PACKAGE_TYPE_INFO[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Package Grid */}
      {filteredPackages.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('noPackages')}
          description={t('createFirst')}
          action={
            onCreateNew
              ? {
                  label: t('create'),
                  onClick: onCreateNew,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              locale={locale}
              onEdit={() => {
                // Navigate to edit page
                window.location.href = `/${locale}/packages/${pkg.id}/edit`;
              }}
              onDuplicate={() => {
                // Handle duplicate
              }}
              onDelete={() => {
                // Handle delete confirmation
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
