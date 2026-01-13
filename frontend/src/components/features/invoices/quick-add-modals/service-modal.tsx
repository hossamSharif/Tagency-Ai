'use client';

// T084 [US10] Quick-add service modal
// Allows staff to quickly create a new service from the invoice form

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceCatalogItem } from '@/types/models/service-catalog';
import { quickAddServiceSchema, QuickAddServiceInput } from '@/lib/validations/services-catalog';

interface QuickAddServiceModalProps {
  onServiceAdded: (service: ServiceCatalogItem) => void;
  onCreateService: (data: QuickAddServiceInput) => Promise<ServiceCatalogItem>;
}

export function QuickAddServiceModal({
  onServiceAdded,
  onCreateService,
}: QuickAddServiceModalProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<QuickAddServiceInput>({
    resolver: zodResolver(quickAddServiceSchema),
    defaultValues: {
      name: '',
      nameAr: '',
      price: 0,
      type: 'other',
      providerType: 'office',
      commissionPercentage: undefined,
    },
  });

  // Watch providerType to show/hide commission field
  const providerType = form.watch('providerType');

  const handleSubmit = async (data: QuickAddServiceInput) => {
    setIsPending(true);
    try {
      const service = await onCreateService(data);
      onServiceAdded(service);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create service:', error);
      // Error handling is done in parent component
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('invoices.quickAddService')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('invoices.quickAddService')}
          </DialogTitle>
          <DialogDescription>
            {t('invoices.quickAddServiceDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('services.namePlaceholder')}
                      disabled={isPending}
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
                  <FormLabel>{t('services.nameAr')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('services.nameArPlaceholder')}
                      disabled={isPending}
                      dir="rtl"
                    />
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
                  <FormLabel>{t('services.type')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('services.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visa">{t('services.types.visa')}</SelectItem>
                      <SelectItem value="ticket">{t('services.types.ticket')}</SelectItem>
                      <SelectItem value="hotel">{t('services.types.hotel')}</SelectItem>
                      <SelectItem value="insurance">{t('services.types.insurance')}</SelectItem>
                      <SelectItem value="other">{t('services.types.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.price')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
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
              name="providerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.providerType')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('services.selectProvider')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="office">{t('services.providerTypes.office')}</SelectItem>
                      <SelectItem value="partner">{t('services.providerTypes.partner')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('services.providerTypeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {providerType === 'partner' && (
              <FormField
                control={form.control}
                name="commissionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.commissionPercentage')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="10"
                        disabled={isPending}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('services.commissionDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('common.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="me-2 h-4 w-4" />
                    {t('common.create')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
