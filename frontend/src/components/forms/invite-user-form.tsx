'use client';

/**
 * Invite User Form Component
 *
 * Form for inviting new team members
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { inviteUserAction } from '@/app/actions/auth';
import { inviteUserSchema, type InviteUserInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserFormProps {
  locale: string;
}

export function InviteUserForm({ locale }: InviteUserFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const isArabic = locale === 'ar';

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'staff',
      name: '',
    },
  });

  const onSubmit = (data: InviteUserInput) => {
    setIsSuccess(false);

    startTransition(async () => {
      try {
        const result = await inviteUserAction(data);

        if (result.success) {
          setIsSuccess(true);
          form.reset();
          toast.success(
            isArabic
              ? 'تم إرسال الدعوة بنجاح'
              : 'Invitation sent successfully'
          );
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Invite user error:', err);
        toast.error(t('errors.general'));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isSuccess && (
          <div className="flex items-center gap-2 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-sm p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            {isArabic
              ? 'تم إرسال الدعوة بنجاح'
              : 'Invitation sent successfully'}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="email@example.com"
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('common.name')} ({t('common.optional')})
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isArabic ? 'الصلاحية' : 'Role'}</FormLabel>
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
                  <SelectItem value="admin">
                    {t('settings.roles.admin')}
                  </SelectItem>
                  <SelectItem value="staff">
                    {t('settings.roles.staff')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === 'admin'
                  ? isArabic
                    ? 'يمكن للمدير إدارة المستخدمين والإعدادات'
                    : 'Admin can manage users and settings'
                  : isArabic
                  ? 'يمكن للموظف إدارة الباقات والحجوزات'
                  : 'Staff can manage packages and bookings'}
              </FormDescription>
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
            <>
              <Mail className="me-2 h-4 w-4" />
              {t('settings.inviteUser')}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
