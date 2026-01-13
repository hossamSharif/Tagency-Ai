'use client';

// ServiceForm component
// T018 [P] [US2] Create service-form component

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createServiceCatalogItem,
  updateServiceCatalogItem,
} from '@/app/actions/services-catalog';
import {
  serviceCatalogItemSchema,
  ServiceCatalogItemInput,
} from '@/lib/validations/services-catalog';
import { ServiceCatalogItem, ServiceType, ProviderType } from '@/types/models/service-catalog';

interface ServiceFormProps {
  service?: ServiceCatalogItem;
  locale?: 'ar' | 'en';
  onSuccess?: (service: ServiceCatalogItem) => void;
  onCancel?: () => void;
}

export function ServiceForm({
  service,
  locale = 'ar',
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const t = useTranslations('services');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isArabic = locale === 'ar';
  const { tenant } = useTenant();

  const form = useForm<ServiceCatalogItemInput>({
    resolver: zodResolver(serviceCatalogItemSchema),
    defaultValues: service
      ? {
          name: service.name,
          nameAr: service.nameAr,
          description: service.description || '',
          price: service.price,
          currency: service.currency,
          type: service.type,
          providerType: service.providerType,
          defaultPartnerId: service.defaultPartnerId,
          defaultPartnerName: service.defaultPartnerName,
          commissionPercentage: service.commissionPercentage,
        }
      : {
          name: '',
          nameAr: '',
          description: '',
          price: 0,
          currency: tenant?.currency || 'SAR',
          type: 'other' as ServiceType,
          providerType: 'office' as ProviderType,
          commissionPercentage: undefined,
        },
  });

  const providerType = form.watch('providerType');

  // Show/hide commission field based on provider type
  useEffect(() => {
    if (providerType === 'office') {
      form.setValue('commissionPercentage', undefined);
      form.setValue('defaultPartnerId', undefined);
      form.setValue('defaultPartnerName', undefined);
    }
  }, [providerType, form]);

  const onSubmit = (data: ServiceCatalogItemInput) => {
    startTransition(async () => {
      try {
        const result = service
          ? await updateServiceCatalogItem(service.id, data)
          : await createServiceCatalogItem(data);

        if (result.success && result.data) {
          toast.success(
            isArabic
              ? service
                ? 'تم تحديث الخدمة بنجاح'
                : 'تم إنشاء الخدمة بنجاح'
              : service
              ? 'Service updated successfully'
              : 'Service created successfully'
          );

          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.push(`/${locale}/services`);
          }
        } else {
          toast.error(result.error || tCommon('errors.general'));
        }
      } catch (err) {
        console.error('Service form error:', err);
        toast.error(tCommon('errors.general'));
      }
    });
  };

  const serviceTypes: { value: ServiceType; label: string }[] = [
    { value: 'visa', label: t('types.visa') },
    { value: 'ticket', label: t('types.ticket') },
    { value: 'hotel', label: t('types.hotel') },
    { value: 'insurance', label: t('types.insurance') },
    { value: 'other', label: t('types.other') },
  ];

  const providerTypes: { value: ProviderType; label: string }[] = [
    { value: 'office', label: t('providerTypes.office') },
    { value: 'partner', label: t('providerTypes.partner') },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('form.basicInfo')}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name')} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('form.namePlaceholder')}
                      disabled={isPending}
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.nameAr')} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('form.nameArPlaceholder')}
                      disabled={isPending}
                      dir="rtl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('form.descriptionPlaceholder')}
                    disabled={isPending}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>{t('form.descriptionHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.type')} *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectType')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('form.pricing')}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.price')} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={isPending}
                      dir="ltr"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>{t('form.priceHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.currency')} *</FormLabel>
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
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="SDG">SDG - Sudanese Pound</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Provider Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('form.provider')}</h3>

          <FormField
            control={form.control}
            name="providerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.providerType')} *</FormLabel>
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
                    {providerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t('form.providerTypeHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {providerType === 'partner' && (
            <>
              <FormField
                control={form.control}
                name="commissionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.commission')} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        disabled={isPending}
                        dir="ltr"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || undefined)
                        }
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>{t('form.commissionHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {t('form.partnerNote')}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {tCommon('actions.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                {service ? t('form.updating') : t('form.creating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {service ? tCommon('actions.update') : tCommon('actions.create')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
