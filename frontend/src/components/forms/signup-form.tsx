'use client';

/**
 * Signup Form Component
 *
 * Form for registering a new travel agency with trial subscription
 */

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signUp } from '@/lib/firebase/auth';
import { signupAction } from '@/app/actions/auth';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
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
import { CURRENCIES, type CurrencyCode } from '@/types/models/tenant';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * Development mode fallback signup using client-side Firebase
 * Used when Firebase Admin credentials are not configured
 */
async function clientSideSignup(data: SignupInput): Promise<{ userId: string; tenantId: string }> {
  // Create user with Firebase client SDK
  const userCredential = await signUp(data.email, data.password, data.officeName);
  const user = userCredential.user;
  const tenantId = user.uid;
  const now = Timestamp.now();
  const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

  // Generate slug
  const slug = data.officeName
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    + '-' + Date.now().toString(36);

  // Create tenant document
  await setDoc(doc(db, 'tenants', tenantId), {
    name: data.officeName,
    slug,
    email: data.email,
    phone: data.phone,
    currency: data.currency,
    timezone: 'Asia/Riyadh',
    language: data.language,
    theme: 'light',
    status: 'trial',
    createdAt: now,
    updatedAt: now,
  });

  // Create subscription document
  await setDoc(doc(db, 'subscriptions', tenantId), {
    tenantId,
    plan: 'trial',
    status: 'active',
    trialStartedAt: now,
    trialEndsAt,
    createdAt: now,
    updatedAt: now,
  });

  // Create user document in tenant
  await setDoc(doc(db, 'tenants', tenantId, 'users', user.uid), {
    email: data.email,
    displayName: data.officeName,
    role: 'owner',
    phone: data.phone,
    language: data.language,
    theme: 'system',
    emailNotifications: true,
    status: 'active',
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  return { userId: user.uid, tenantId };
}

interface SignupFormProps {
  locale: string;
}

export function SignupForm({ locale }: SignupFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isArabic = locale === 'ar';

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      officeName: '',
      phone: '',
      currency: 'SAR',
      language: isArabic ? 'ar' : 'en',
    },
  });

  const onSubmit = (data: SignupInput) => {
    setError(null);

    startTransition(async () => {
      try {
        // Try server action first (requires Firebase Admin credentials)
        const result = await signupAction({
          email: data.email,
          password: data.password,
          officeName: data.officeName,
          phone: data.phone,
          currency: data.currency,
          language: data.language,
        });

        if (!result.success) {
          // If server action fails, try client-side signup as fallback
          // This is useful for development when Admin SDK credentials aren't configured
          console.warn('Server signup failed, trying client-side fallback:', result.error);
          try {
            await clientSideSignup(data);
            router.push(`/${locale}/login?signup=success`);
            return;
          } catch (clientErr) {
            console.error('Client-side signup also failed:', clientErr);
            // Show original server error if client fallback also fails
            setError(result.error);
            return;
          }
        }

        // Redirect to login page with success message
        router.push(`/${locale}/login?signup=success`);
      } catch (err) {
        console.error('Signup error:', err);
        // Try client-side signup as fallback
        try {
          await clientSideSignup(data);
          router.push(`/${locale}/login?signup=success`);
        } catch (clientErr) {
          console.error('Client-side signup also failed:', clientErr);
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
          name="officeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.officeName')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isArabic ? 'مكتب السفر والسياحة' : 'Travel Agency Office'}
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.phone')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="+966 5XX XXX XXXX"
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
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.currency')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.currency')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <SelectItem key={code} value={code}>
                      {CURRENCIES[code].symbol} - {isArabic ? CURRENCIES[code].nameAr : CURRENCIES[code].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  disabled={isPending}
                  dir="ltr"
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
            t('auth.startFreeTrial')
          )}
        </Button>
      </form>
    </Form>
  );
}
