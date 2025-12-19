'use client';

/**
 * Reset Password Form Component
 *
 * Form for requesting a password reset email
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { resetPasswordAction } from '@/app/actions/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
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

interface ResetPasswordFormProps {
  locale: string;
}

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    setError(null);
    setIsSuccess(false);

    startTransition(async () => {
      try {
        const result = await resetPasswordAction(data);

        if (result.success) {
          setIsSuccess(true);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Reset password error:', err);
        setError(t('errors.general'));
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">{t('auth.resetEmailSent')}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'ar'
            ? 'إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، ستتلقى رابطًا لإعادة تعيين كلمة المرور.'
            : 'If an account exists with this email, you will receive a password reset link.'}
        </p>
        <a
          href={`/${locale}/login`}
          className="text-primary hover:underline inline-block mt-4"
        >
          {t('auth.login')}
        </a>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {locale === 'ar'
            ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.'
            : 'Enter your email and we will send you a link to reset your password.'}
        </p>

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
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.resetPassword')
          )}
        </Button>
      </form>
    </Form>
  );
}
