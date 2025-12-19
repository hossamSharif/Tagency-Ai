'use client';

/**
 * Tenant Settings Component (T214)
 *
 * Form for editing workspace/tenant settings
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { updateTenantAction, type UpdateTenantInput } from '@/app/actions/tenants';
import { useTenant } from '@/hooks/use-tenant';
import { CURRENCIES, type CurrencyCode, type Language, type ThemePreference } from '@/types/models/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2, Globe, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

// Validation schema for tenant settings form
const tenantSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  currency: z.enum(['USD', 'SAR', 'EUR', 'SDG', 'AED', 'EGP', 'GBP']),
  timezone: z.string(),
  language: z.enum(['ar', 'en']),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      country: z.string().min(1, 'Country is required'),
      postalCode: z.string().optional(),
    })
    .optional(),
});

type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>;

interface TenantSettingsProps {
  locale: string;
}

// Common timezones for the region
const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)', labelAr: 'الرياض (GMT+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)', labelAr: 'دبي (GMT+4)' },
  { value: 'Africa/Cairo', label: 'Cairo (GMT+2)', labelAr: 'القاهرة (GMT+2)' },
  { value: 'Africa/Khartoum', label: 'Khartoum (GMT+2)', labelAr: 'الخرطوم (GMT+2)' },
  { value: 'Asia/Amman', label: 'Amman (GMT+3)', labelAr: 'عمان (GMT+3)' },
  { value: 'Asia/Beirut', label: 'Beirut (GMT+3)', labelAr: 'بيروت (GMT+3)' },
  { value: 'Europe/London', label: 'London (GMT+0)', labelAr: 'لندن (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)', labelAr: 'نيويورك (GMT-5)' },
];

export function TenantSettings({ locale }: TenantSettingsProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { tenant, refresh } = useTenant();
  const [isPending, startTransition] = useTransition();
  const isArabic = locale === 'ar';

  const form = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: tenant?.name || '',
      email: tenant?.email || '',
      phone: tenant?.phone || '',
      currency: tenant?.currency || 'SAR',
      timezone: tenant?.timezone || 'Asia/Riyadh',
      language: tenant?.language || 'ar',
      address: tenant?.address || {
        street: '',
        city: '',
        country: '',
        postalCode: '',
      },
    },
  });

  const onSubmit = (data: TenantSettingsFormData) => {
    startTransition(async () => {
      try {
        const result = await updateTenantAction(data as UpdateTenantInput);
        if (result.success) {
          toast.success(
            isArabic ? 'تم تحديث إعدادات مساحة العمل بنجاح' : 'Workspace settings updated successfully'
          );
          refresh();
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Tenant settings error:', err);
        toast.error(isArabic ? 'حدث خطأ ما' : 'Something went wrong');
      }
    });
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Office Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isArabic ? 'معلومات المكتب' : 'Office Information'}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? 'المعلومات الأساسية لمكتبك أو وكالتك'
                : 'Basic information about your office or agency'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'اسم المكتب' : 'Office Name'}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'العنوان' : 'Address'}</CardTitle>
            <CardDescription>
              {isArabic ? 'عنوان المكتب الفعلي' : 'Physical office address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'الشارع' : 'Street'}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'المدينة' : 'City'}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
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
                    <FormLabel>{isArabic ? 'الدولة' : 'Country'}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'الرمز البريدي' : 'Postal Code'}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {isArabic ? 'الإعدادات الإقليمية' : 'Regional Settings'}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? 'إعدادات اللغة والعملة والمنطقة الزمنية'
                : 'Language, currency, and timezone settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('language')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isArabic ? 'اللغة الافتراضية للواجهة' : 'Default interface language'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {tCommon('currency')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                          <SelectItem key={code} value={code}>
                            {CURRENCIES[code].symbol} - {isArabic ? CURRENCIES[code].nameAr : CURRENCIES[code].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isArabic ? 'العملة المستخدمة في الفواتير' : 'Currency used for invoices'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'المنطقة الزمنية' : 'Timezone'}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {isArabic ? tz.labelAr : tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isPending}
          >
            {isArabic ? 'إعادة تعيين' : 'Reset'}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              tCommon('save')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
