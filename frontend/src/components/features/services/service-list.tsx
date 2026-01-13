'use client';

// ServiceList component
// T019 [P] [US2] Create service-list component

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceCard } from './service-card';
import { ServiceCatalogItem, ServiceType, ProviderType } from '@/types/models/service-catalog';

interface ServiceListProps {
  services: ServiceCatalogItem[];
  locale?: 'ar' | 'en';
  onEdit?: (service: ServiceCatalogItem) => void;
  onDelete?: (serviceId: string) => void;
}

export function ServiceList({
  services,
  locale = 'ar',
  onEdit,
  onDelete,
}: ServiceListProps) {
  const t = useTranslations('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all');
  const [providerFilter, setProviderFilter] = useState<ProviderType | 'all'>('all');

  // Filter services based on search and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameAr.includes(searchQuery);

    const matchesType = typeFilter === 'all' || service.type === typeFilter;
    const matchesProvider =
      providerFilter === 'all' || service.providerType === providerFilter;

    return matchesSearch && matchesType && matchesProvider;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ServiceType | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
              <SelectItem value="visa">{t('types.visa')}</SelectItem>
              <SelectItem value="ticket">{t('types.ticket')}</SelectItem>
              <SelectItem value="hotel">{t('types.hotel')}</SelectItem>
              <SelectItem value="insurance">{t('types.insurance')}</SelectItem>
              <SelectItem value="other">{t('types.other')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={providerFilter} onValueChange={(value) => setProviderFilter(value as ProviderType | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('filters.provider')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allProviders')}</SelectItem>
              <SelectItem value="office">{t('providerTypes.office')}</SelectItem>
              <SelectItem value="partner">{t('providerTypes.partner')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Link href={`/${locale}/invoices/new`}>
            <Button>
              <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('actions.createInvoice')}
            </Button>
          </Link>
          <Link href={`/${locale}/services/new`}>
            <Button variant="outline">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('actions.new')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Service Cards Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('noServices')}</p>
          {services.length === 0 && (
            <Link href={`/${locale}/services/new`}>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('actions.createFirst')}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locale={locale}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredServices.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('resultsCount', { count: filteredServices.length, total: services.length })}
        </div>
      )}
    </div>
  );
}
