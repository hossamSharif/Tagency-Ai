'use client';

/**
 * Package Form Component
 *
 * Form for creating and editing packages
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  createPackageAction,
  updatePackageAction,
} from '@/app/actions/packages';
import {
  createPackageSchema,
  updatePackageSchema,
  type CreatePackageInput,
  type UpdatePackageInput,
} from '@/lib/validations/packages';
import {
  Package,
  PACKAGE_TYPE_INFO,
  DOCUMENT_TYPE_INFO,
  type PackageType,
  type DocumentType,
} from '@/types/models/package';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PackageFormProps {
  locale: string;
  mode: 'create' | 'edit';
  initialData?: Package;
}

export function PackageForm({ locale, mode, initialData }: PackageFormProps) {
  const t = useTranslations('packages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isArabic = locale === 'ar';

  const form = useForm<CreatePackageInput>({
    resolver: zodResolver(mode === 'create' ? createPackageSchema : updatePackageSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'custom',
      description: initialData?.description || '',
      startDate: initialData?.startDate?.toDate() || new Date(),
      endDate: initialData?.endDate?.toDate() || new Date(),
      basePrice: initialData?.basePrice || 0,
      coverImage: initialData?.coverImage || '',
      maxCapacity: initialData?.maxCapacity || undefined,
      requiredDocuments: initialData?.requiredDocuments || ['passport'],
      highlights: initialData?.highlights || [],
    },
  });

  const onSubmit = (data: CreatePackageInput) => {
    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createPackageAction(data);
          if (result.success) {
            toast.success(isArabic ? 'تم إنشاء الباقة بنجاح' : 'Package created successfully');
            router.push(`/${locale}/packages/${result.data.packageId}`);
          } else {
            toast.error(result.error);
          }
        } else if (initialData) {
          const result = await updatePackageAction(initialData.id, data as UpdatePackageInput);
          if (result.success) {
            toast.success(isArabic ? 'تم تحديث الباقة بنجاح' : 'Package updated successfully');
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }
      } catch (err) {
        console.error('Package form error:', err);
        toast.error(isArabic ? 'حدث خطأ ما' : 'Something went wrong');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.type')}</FormLabel>
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
                        {(Object.keys(PACKAGE_TYPE_INFO) as PackageType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {isArabic
                              ? PACKAGE_TYPE_INFO[type].labelAr
                              : PACKAGE_TYPE_INFO[type].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>{t('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      disabled={isPending}
                      placeholder={isArabic ? 'وصف الباقة...' : 'Package description...'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Dates and Duration */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'التواريخ' : 'Dates'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('fields.startDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full ps-3 text-start font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>{isArabic ? 'اختر التاريخ' : 'Pick a date'}</span>
                            )}
                            <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('fields.endDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full ps-3 text-start font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>{isArabic ? 'اختر التاريخ' : 'Pick a date'}</span>
                            )}
                            <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing and Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'التسعير والسعة' : 'Pricing & Capacity'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.basePrice')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step={0.01}
                        disabled={isPending}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {isArabic
                        ? 'السعر قبل إضافة الخدمات'
                        : 'Price before adding services'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.maxCapacity')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        disabled={isPending}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {isArabic ? 'اتركه فارغاً لعدد غير محدود' : 'Leave empty for unlimited'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'المستندات المطلوبة' : 'Required Documents'}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="requiredDocuments"
              render={() => (
                <FormItem>
                  <div className="grid gap-4 md:grid-cols-3">
                    {(Object.keys(DOCUMENT_TYPE_INFO) as DocumentType[]).map((docType) => (
                      <FormField
                        key={docType}
                        control={form.control}
                        name="requiredDocuments"
                        render={({ field }) => (
                          <FormItem
                            key={docType}
                            className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(docType)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, docType]);
                                  } else {
                                    field.onChange(current.filter((d) => d !== docType));
                                  }
                                }}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {isArabic
                                ? DOCUMENT_TYPE_INFO[docType].labelAr
                                : DOCUMENT_TYPE_INFO[docType].label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {tCommon('loading')}
              </>
            ) : mode === 'create' ? (
              t('create')
            ) : (
              tCommon('save')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
