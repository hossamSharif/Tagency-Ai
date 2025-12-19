'use client';

/**
 * Service Form Component
 *
 * Form for adding/editing services within a package
 */

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  addServiceAction,
  updateServiceAction,
} from '@/app/actions/packages';
import {
  addServiceSchema,
  type AddServiceInput,
} from '@/lib/validations/packages';
import { SERVICE_CATEGORY_INFO, type ServiceCategory, type Service } from '@/types/models/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceFormProps {
  locale: string;
  packageId: string;
  mode: 'add' | 'edit';
  service?: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceFormDialog({
  locale,
  packageId,
  mode,
  service,
  open,
  onOpenChange,
  onSuccess,
}: ServiceFormProps) {
  const t = useTranslations('packages.services');
  const tCommon = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const isArabic = locale === 'ar';

  const form = useForm<AddServiceInput>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      name: service?.name || '',
      category: service?.category || 'other',
      description: service?.description || '',
      price: service?.price || 0,
      provider: service?.provider || '',
      isOutsourced: service?.isOutsourced || false,
      partnerOfficeId: service?.partnerOfficeId || undefined,
      commissionPercentage: service?.commissionPercentage || undefined,
    },
  });

  const isOutsourced = form.watch('isOutsourced');

  const onSubmit = (data: AddServiceInput) => {
    startTransition(async () => {
      try {
        if (mode === 'add') {
          const result = await addServiceAction(packageId, data);
          if (result.success) {
            toast.success(isArabic ? 'تمت إضافة الخدمة' : 'Service added');
            form.reset();
            onOpenChange(false);
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        } else if (service) {
          const result = await updateServiceAction(packageId, service.id, data);
          if (result.success) {
            toast.success(isArabic ? 'تم تحديث الخدمة' : 'Service updated');
            onOpenChange(false);
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        }
      } catch (err) {
        console.error('Service form error:', err);
        toast.error(isArabic ? 'حدث خطأ ما' : 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? t('add') : t('edit')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'اسم الخدمة' : 'Service Name'}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'الفئة' : 'Category'}</FormLabel>
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
                        {(Object.keys(SERVICE_CATEGORY_INFO) as ServiceCategory[]).map(
                          (category) => (
                            <SelectItem key={category} value={category}>
                              {isArabic
                                ? SERVICE_CATEGORY_INFO[category].labelAr
                                : SERVICE_CATEGORY_INFO[category].label}
                            </SelectItem>
                          )
                        )}
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
                  <FormLabel>{isArabic ? 'الوصف' : 'Description'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'السعر' : 'Price'}</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'المزود' : 'Provider'}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={isArabic ? 'اسم الشركة' : 'Company name'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Outsourcing */}
            <div className="border rounded-lg p-4 space-y-4">
              <FormField
                control={form.control}
                name="isOutsourced"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        {isArabic ? 'خدمة خارجية (من شريك)' : 'Outsourced Service (from partner)'}
                      </FormLabel>
                      <FormDescription>
                        {isArabic
                          ? 'حدد هذا إذا كانت الخدمة مقدمة من مكتب شريك'
                          : 'Check this if the service is provided by a partner office'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isOutsourced && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="partnerOfficeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isArabic ? 'مكتب الشريك' : 'Partner Office'}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder={isArabic ? 'معرف الشريك' : 'Partner ID'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commissionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isArabic ? 'نسبة العمولة %' : 'Commission %'}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            disabled={isPending}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                ) : mode === 'add' ? (
                  t('add')
                ) : (
                  tCommon('save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
