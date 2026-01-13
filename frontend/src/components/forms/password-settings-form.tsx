'use client';

/**
 * Password Settings Form Component
 *
 * Form for changing user password with reauthentication
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { reauthenticate, getIdToken } from '@/lib/firebase/auth';
import { updatePasswordAction } from '@/app/actions/auth';
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/validations/auth';
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
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordSettingsFormProps {
  locale: string;
}

export function PasswordSettingsForm({ locale }: PasswordSettingsFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (data: UpdatePasswordInput) => {
    setError(null);

    startTransition(async () => {
      try {
        // First reauthenticate with current password
        await reauthenticate(data.currentPassword);

        // Get fresh ID token after reauthentication
        const idToken = await getIdToken(true);
        if (!idToken) {
          throw new Error('Failed to get ID token');
        }

        // Update password on server
        const result = await updatePasswordAction(data, idToken);

        if (result.success) {
          toast.success(
            locale === 'ar'
              ? 'تم تغيير كلمة المرور بنجاح'
              : 'Password changed successfully'
          );
          form.reset();
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Password change error:', err);
        if (err instanceof Error) {
          if (err.message.includes('auth/wrong-password') ||
              err.message.includes('auth/invalid-credential')) {
            setError(
              locale === 'ar'
                ? 'كلمة المرور الحالية غير صحيحة'
                : 'Current password is incorrect'
            );
          } else if (err.message.includes('auth/requires-recent-login')) {
            setError(
              locale === 'ar'
                ? 'يرجى تسجيل الخروج والدخول مرة أخرى قبل تغيير كلمة المرور'
                : 'Please sign out and sign in again before changing password'
            );
          } else if (err.message.includes('auth/weak-password')) {
            setError(
              locale === 'ar'
                ? 'كلمة المرور الجديدة ضعيفة جداً'
                : 'New password is too weak'
            );
          } else {
            setError(t('errors.general'));
          }
        } else {
          setError(t('errors.general'));
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.currentPassword')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showCurrentPassword ? 'text' : 'password'}
                    disabled={isPending}
                    dir="ltr"
                    autoComplete="current-password"
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.newPassword')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showNewPassword ? 'text' : 'password'}
                    disabled={isPending}
                    dir="ltr"
                    autoComplete="new-password"
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    disabled={isPending}
                    dir="ltr"
                    autoComplete="new-password"
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
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
            locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'
          )}
        </Button>
      </form>
    </Form>
  );
}
