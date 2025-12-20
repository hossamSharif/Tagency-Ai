'use client';

/**
 * NotificationPreferences Component
 *
 * Form for managing user notification preferences.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction,
} from '@/app/actions/notifications';
import {
  type NotificationPreferences,
  type NotificationType,
  NOTIFICATION_TYPE_INFO,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/models/notification';
import { cn } from '@/lib/utils';

export interface NotificationPreferencesFormProps {
  className?: string;
}

const notificationCategories = [
  {
    category: 'payments',
    labelAr: 'المدفوعات',
    labelEn: 'Payments',
    types: ['payment_received', 'payment_approved', 'payment_rejected'] as NotificationType[],
  },
  {
    category: 'bookings',
    labelAr: 'الحجوزات',
    labelEn: 'Bookings',
    types: ['booking_confirmed', 'booking_cancelled'] as NotificationType[],
  },
  {
    category: 'documents',
    labelAr: 'المستندات',
    labelEn: 'Documents',
    types: ['document_requested', 'document_verified', 'document_rejected'] as NotificationType[],
  },
  {
    category: 'subscription',
    labelAr: 'الاشتراك',
    labelEn: 'Subscription',
    types: ['subscription_expiring', 'subscription_expired', 'trial_ending'] as NotificationType[],
  },
  {
    category: 'other',
    labelAr: 'أخرى',
    labelEn: 'Other',
    types: ['commission_settled', 'package_updated', 'user_invited', 'general'] as NotificationType[],
  },
];

export function NotificationPreferencesForm({
  className,
}: NotificationPreferencesFormProps) {
  const t = useTranslations('notifications.preferences');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const result = await getNotificationPreferencesAction();
        if (result.success) {
          setPreferences(result.data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update a specific email type preference
  const updateEmailType = (type: NotificationType, enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      emailTypes: {
        ...prev.emailTypes,
        [type]: enabled,
      },
    }));
  };

  // Toggle all email notifications
  const toggleAllEmails = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      emailEnabled: enabled,
    }));
  };

  // Toggle all in-app notifications
  const toggleAllInApp = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      inAppEnabled: enabled,
    }));
  };

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateNotificationPreferencesAction(preferences);
      if (result.success) {
        toast({
          title: t('saved'),
          description: t('savedDescription'),
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{t('inAppNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('inAppDescription')}
              </p>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={toggleAllInApp}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('emailNotifications')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('emailDescription')}
              </p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={toggleAllEmails}
            />
          </div>
        </div>

        {/* Email type preferences */}
        {preferences.emailEnabled && (
          <>
            <Separator />

            <div className="space-y-6">
              <h4 className="font-medium text-sm">{t('emailTypes')}</h4>

              {notificationCategories.map((category) => (
                <div key={category.category} className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">
                    {category.labelAr}
                  </h5>
                  <div className="space-y-2 ps-4">
                    {category.types.map((type) => {
                      const typeInfo = NOTIFICATION_TYPE_INFO[type];
                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between py-1"
                        >
                          <Label
                            htmlFor={`email-${type}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {typeInfo?.labelAr || type}
                          </Label>
                          <Switch
                            id={`email-${type}`}
                            checked={preferences.emailTypes[type as keyof typeof preferences.emailTypes]}
                            onCheckedChange={(checked) => updateEmailType(type, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alert for disabled notifications */}
        {!preferences.inAppEnabled && !preferences.emailEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('allDisabledWarning')}</AlertDescription>
          </Alert>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
