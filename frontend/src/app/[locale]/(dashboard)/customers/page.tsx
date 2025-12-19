'use client';

// Customers list page
// T118 [US2] Create customers list page

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Search, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomerCard } from '@/components/features/customers/customer-card';
import { useCustomers } from '@/hooks/use-customers';

export default function CustomersPage() {
  const t = useTranslations('customers');
  const params = useParams();
  const locale = params.locale as string;

  const [search, setSearch] = useState('');
  const [nationality, setNationality] = useState<string>('');
  const [hasPassport, setHasPassport] = useState<boolean | undefined>();

  const { customers, loading, error } = useCustomers({
    search,
    nationality: nationality || undefined,
    hasPassport,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: customers.length })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/customers/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t('addCustomer')}
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
          value={hasPassport === undefined ? 'all' : hasPassport ? 'yes' : 'no'}
          onValueChange={(value) => {
            if (value === 'all') setHasPassport(undefined);
            else setHasPassport(value === 'yes');
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="me-2 h-4 w-4" />
            <SelectValue placeholder={t('passportFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCustomers')}</SelectItem>
            <SelectItem value="yes">{t('withPassport')}</SelectItem>
            <SelectItem value="no">{t('withoutPassport')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t('noCustomers')}</h3>
          <p className="text-muted-foreground max-w-sm mb-4">{t('noCustomersDescription')}</p>
          <Button asChild>
            <Link href={`/${locale}/customers/new`}>
              <Plus className="me-2 h-4 w-4" />
              {t('addFirstCustomer')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              locale={locale as 'ar' | 'en'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
