'use client';

/**
 * Package List Client Component
 *
 * Client component for the packages list page.
 * Receives serialized data from server and handles client-side filtering.
 * This component does NOT use client-side Firestore hooks.
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackageCard } from '@/components/features/packages/package-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Package,
  PackageStatus,
  PackageType,
  PACKAGE_STATUS_INFO,
  PACKAGE_TYPE_INFO,
} from '@/types/models/package';

interface PackageListClientProps {
  packages: Package[];
  locale: string;
}

export function PackageListClient({
  packages: initialPackages,
  locale,
}: PackageListClientProps) {
  const t = useTranslations('packages');
  const router = useRouter();
  const isArabic = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PackageType | 'all'>('all');

  // Filter packages client-side (no Firestore calls)
  const filteredPackages = useMemo(() => {
    return initialPackages.filter((pkg) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          pkg.name.toLowerCase().includes(searchLower) ||
          pkg.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && pkg.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && pkg.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [initialPackages, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageIcon className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/packages/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t('create')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PackageStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes')}</SelectItem>
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
          icon={PackageIcon}
          title={t('noPackages')}
          description={t('createFirst')}
          action={{
            label: t('create'),
            onClick: () => router.push(`/${locale}/packages/new`),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              locale={locale}
              onEdit={() => {
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
