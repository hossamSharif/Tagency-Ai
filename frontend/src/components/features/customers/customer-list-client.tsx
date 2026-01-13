'use client';

/**
 * Customer List Client Component
 *
 * Client component for displaying and filtering customers.
 * Receives initial data from server and handles client-side filtering.
 */

import { useState, useMemo, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus, Search, Users, Filter, RefreshCw } from 'lucide-react';
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
import { CustomerCard } from '@/components/features/customers/customer-card';
import { Customer } from '@/types/models/customer';
import { listCustomersAction } from '@/app/actions/customers';

interface CustomerListClientProps {
  initialCustomers: Customer[];
  locale: string;
}

export function CustomerListClient({ initialCustomers, locale }: CustomerListClientProps) {
  const t = useTranslations('customers');
  const [isPending, startTransition] = useTransition();

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [hasPassport, setHasPassport] = useState<boolean | undefined>();

  // Client-side filtering
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.firstName.toLowerCase().includes(searchLower) ||
          customer.lastName.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(search)
      );
    }

    if (hasPassport !== undefined) {
      result = result.filter(
        (customer) =>
          hasPassport
            ? customer.passport !== undefined
            : customer.passport === undefined
      );
    }

    return result;
  }, [customers, search, hasPassport]);

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await listCustomersAction();
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    });
  };

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
            {t('subtitle', { count: filteredCustomers.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href={`/${locale}/customers/new`}>
              <Plus className="me-2 h-4 w-4" />
              {t('addCustomer')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            name="search"
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
          name="passportFilter"
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
      {isPending ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredCustomers.length === 0 ? (
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
          {filteredCustomers.map((customer) => (
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
