'use client';

/**
 * Profile Settings Form Component
 *
 * Form for updating user profile information
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { updateProfileAction } from '@/app/actions/auth';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsFormProps {
  locale: string;
}

export function ProfileSettingsForm({ locale }: ProfileSettingsFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: '',
      phone: '',
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(data);

        if (result.success) {
          toast.success(locale === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated');
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Update profile error:', err);
        toast.error(t('errors.general'));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.fullName')}</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
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
              <FormLabel>{t('auth.phone')}</FormLabel>
              <FormControl>
                <Input {...field} type="tel" disabled={isPending} dir="ltr" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('common.save')
          )}
        </Button>
      </form>
    </Form>
  );
}
