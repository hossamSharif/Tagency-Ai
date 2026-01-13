'use client';

// T083 [US10] Quick-add partner modal
// Allows staff to quickly create a new partner from the invoice form

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Plus, Building2 } from 'lucide-react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PartnerOffice } from '@/types/models/partner-office';

// Quick-add partner schema (simplified - only name and phone are required)
const quickAddPartnerSchema = z.object({
  name: z
    .string()
    .min(2, 'Partner name must be at least 2 characters')
    .max(200, 'Partner name cannot exceed 200 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .regex(/^[\d\s+()-]+$/, 'Invalid phone number format'),
  defaultCommissionPercentage: z
    .number()
    .min(0, 'Commission must be at least 0%')
    .max(100, 'Commission cannot exceed 100%')
    .optional(),
});

type QuickAddPartnerInput = z.infer<typeof quickAddPartnerSchema>;

interface QuickAddPartnerModalProps {
  onPartnerAdded: (partner: PartnerOffice) => void;
  onCreatePartner: (data: QuickAddPartnerInput) => Promise<PartnerOffice>;
}

export function QuickAddPartnerModal({
  onPartnerAdded,
  onCreatePartner,
}: QuickAddPartnerModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<QuickAddPartnerInput>({
    resolver: zodResolver(quickAddPartnerSchema),
    defaultValues: {
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      defaultCommissionPercentage: 10,
    },
  });

  const handleSubmit = async (data: QuickAddPartnerInput) => {
    setIsPending(true);
    try {
      const partner = await onCreatePartner(data);
      onPartnerAdded(partner);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create partner:', error);
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
          {t('invoices.quickAddPartner')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('invoices.quickAddPartner')}
          </DialogTitle>
          <DialogDescription>
            {t('invoices.quickAddPartnerDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('partners.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('partners.namePlaceholder')}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isArabic ? `${t('partners.code')} (اختياري)` : `${t('partners.code')} (Optional)`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('partners.codePlaceholder')}
                      disabled={isPending}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isArabic ? `${t('partners.contactPerson')} (اختياري)` : `${t('partners.contactPerson')} (Optional)`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('partners.contactPersonPlaceholder')}
                      disabled={isPending}
                    />
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
                  <FormLabel>
                    {isArabic ? `${t('partners.email')} (اختياري)` : `${t('partners.email')} (Optional)`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t('partners.emailPlaceholder')}
                      disabled={isPending}
                    />
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
                  <FormLabel>{t('partners.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t('partners.phonePlaceholder')}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultCommissionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isArabic ? `${t('partners.defaultCommission')} (اختياري)` : `${t('partners.defaultCommission')} (Optional)`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="10"
                      disabled={isPending}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
