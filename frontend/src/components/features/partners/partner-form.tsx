'use client';

/**
 * Partner Form Component
 *
 * Form for creating and editing partner offices
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  createPartnerSchema,
  updatePartnerSchema,
  type CreatePartnerInput,
  type UpdatePartnerInput,
} from '@/lib/validations/partners';
import type { PartnerOffice } from '@/types/models/partner-office';
import { Building2, User, Mail, Phone, Percent, Landmark } from 'lucide-react';

interface PartnerFormProps {
  partner?: PartnerOffice;
  onSubmit: (data: CreatePartnerInput | UpdatePartnerInput) => Promise<void>;
  isLoading?: boolean;
  locale: string;
}

export function PartnerForm({
  partner,
  onSubmit,
  isLoading,
  locale,
}: PartnerFormProps) {
  const t = useTranslations('partners');
  const isArabic = locale === 'ar';
  const isEditing = !!partner;

  const form = useForm<CreatePartnerInput>({
    resolver: zodResolver(isEditing ? updatePartnerSchema : createPartnerSchema),
    defaultValues: {
      name: partner?.name || '',
      code: partner?.code || '',
      contactPerson: partner?.contactPerson || '',
      email: partner?.email || '',
      phone: partner?.phone || '',
      defaultCommissionPercentage: partner?.defaultCommissionPercentage || 10,
      bankAccount: partner?.bankAccount || undefined,
      notes: partner?.notes || '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isArabic ? 'المعلومات الأساسية' : 'Basic Information'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'اسم الشريك' : 'Partner Name'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isArabic ? 'مكتب السفر المتميز' : 'Premium Travel Office'}
                      {...field}
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
                  <FormLabel>{isArabic ? 'الرمز (اختياري)' : 'Code (Optional)'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PTR-001"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    {isArabic
                      ? 'رمز قصير فريد للشريك'
                      : 'Unique short code for the partner'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            {isArabic ? 'معلومات الاتصال' : 'Contact Information'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'اسم جهة الاتصال (اختياري)' : 'Contact Person (Optional)'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isArabic ? 'أحمد محمد' : 'Ahmed Mohammed'}
                      {...field}
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
                  <FormLabel>{isArabic ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="partner@example.com"
                        className="ps-9"
                        {...field}
                      />
                    </div>
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
                  <FormLabel>{isArabic ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+966 50 123 4567"
                        className="ps-9"
                        {...field}
                      />
                    </div>
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
                  <FormLabel>{isArabic ? 'نسبة العمولة الافتراضية (اختياري)' : 'Default Commission % (Optional)'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="ps-9"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {isArabic
                      ? 'النسبة المئوية للعمولة على الخدمات'
                      : 'Commission percentage on services'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Bank Account Details */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            {isArabic ? 'التفاصيل البنكية (اختياري)' : 'Bank Account Details (Optional)'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bankAccount.bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'اسم البنك' : 'Bank Name'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isArabic ? 'البنك الأهلي' : 'National Bank'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount.accountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'اسم صاحب الحساب' : 'Account Holder'}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount.accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'رقم الحساب' : 'Account Number'}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount.iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input placeholder="SA..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount.swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT / BIC</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isArabic ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isArabic
                ? 'جاري الحفظ...'
                : 'Saving...'
              : isEditing
              ? isArabic
                ? 'تحديث الشريك'
                : 'Update Partner'
              : isArabic
              ? 'إنشاء الشريك'
              : 'Create Partner'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
