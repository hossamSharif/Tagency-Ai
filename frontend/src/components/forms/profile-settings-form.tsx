'use client';

/**
 * Profile Settings Form Component
 *
 * Form for updating user profile information
 */

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { updateProfileAction, getUserProfileAction, type UserProfile } from '@/app/actions/auth';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Mail, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsFormProps {
  locale: string;
}

export function ProfileSettingsForm({ locale }: ProfileSettingsFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: '',
      phone: '',
    },
  });

  // Load user profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await getUserProfileAction();
        if (result.success && result.data) {
          setUserProfile(result.data);
          form.reset({
            displayName: result.data.displayName || '',
            phone: result.data.phone || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error(t('errors.general'));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [form, t]);

  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(data);

        if (result.success) {
          toast.success(locale === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated');
          // Update local state
          if (userProfile) {
            setUserProfile({
              ...userProfile,
              displayName: data.displayName || userProfile.displayName,
              phone: data.phone || userProfile.phone,
            });
          }
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Update profile error:', err);
        toast.error(t('errors.general'));
      }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('auth.email')}
          </FormLabel>
          <div className="flex items-center gap-2">
            <Input
              value={userProfile?.email || ''}
              disabled
              dir="ltr"
              className="bg-muted"
            />
            {userProfile?.role && (
              <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                {t(`settings.roles.${userProfile.role}`)}
              </Badge>
            )}
          </div>
          <FormDescription className="text-xs">
            {locale === 'ar'
              ? 'لا يمكن تغيير البريد الإلكتروني'
              : 'Email cannot be changed'}
          </FormDescription>
        </div>

        {/* Display Name */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('auth.fullName')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isPending}
                  placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('auth.phone')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  disabled={isPending}
                  dir="ltr"
                  placeholder="+966 50 123 4567"
                />
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
