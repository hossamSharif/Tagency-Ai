'use client';

/**
 * Login Form Component
 *
 * Form for user authentication with email and password
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn, getIdToken } from '@/lib/firebase/auth';
import { loginAction } from '@/app/actions/auth';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Check for signup success message
  const signupSuccess = searchParams.get('signup') === 'success';

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginInput) => {
    setError(null);

    startTransition(async () => {
      try {
        // Sign in with Firebase Auth (client-side)
        await signIn(data.email, data.password);

        // Get ID token
        const idToken = await getIdToken(true);
        if (!idToken) {
          throw new Error('Failed to get ID token');
        }

        // Create session cookie on server
        const result = await loginAction(idToken);

        if (!result.success) {
          setError(result.error);
          return;
        }

        // Redirect to dashboard
        router.push(`/${locale}`);
        router.refresh();
      } catch (err) {
        console.error('Login error:', err);
        if (err instanceof Error) {
          if (err.message.includes('auth/invalid-credential') ||
              err.message.includes('auth/user-not-found') ||
              err.message.includes('auth/wrong-password')) {
            setError(t('auth.invalidCredentials'));
          } else if (err.message.includes('auth/too-many-requests')) {
            setError(t('errors.tryAgain'));
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
        {signupSuccess && (
          <div className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-sm p-3 rounded-lg">
            {t('auth.signupSuccess')}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  disabled={isPending}
                  dir="ltr"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  {t('auth.rememberMe')}
                </FormLabel>
              </FormItem>
            )}
          />

          <a
            href={`/${locale}/reset-password`}
            className="text-sm text-primary hover:underline"
          >
            {t('auth.forgotPassword')}
          </a>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.login')
          )}
        </Button>
      </form>
    </Form>
  );
}
