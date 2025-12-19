'use client';

// CustomerForm component
// T110 [US2] Create CustomerForm component

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createCustomerSchema, CreateCustomerInput } from '@/lib/validations/customers';
import { Customer } from '@/types/models/customer';

// Common country codes
const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SD', name: 'Sudan' },
  { code: 'YE', name: 'Yemen' },
  { code: 'JO', name: 'Jordan' },
  { code: 'SY', name: 'Syria' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
];

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isLoading,
}: CustomerFormProps) {
  const t = useTranslations('customers');

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      nationality: customer?.nationality || '',
      nationalId: customer?.nationalId || '',
      preferredLanguage: customer?.preferredLanguage || 'ar',
      notes: customer?.notes || '',
      tags: customer?.tags || [],
      address: customer?.address || undefined,
    },
  });

  const handleSubmit = async (data: CreateCustomerInput) => {
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {customer ? t('editCustomer') : t('createCustomer')}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('firstName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('firstNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lastName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('lastNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+966 5x xxx xxxx" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nationality and ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nationality')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCountry')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nationalId')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('nationalIdPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preferred Language */}
            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('preferredLanguage')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ar">{t('arabic')}</SelectItem>
                      <SelectItem value="en">{t('english')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium">{t('address')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('city')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('cityPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('country')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('countryPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('street')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('streetPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {customer ? t('saveChanges') : t('createCustomer')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
