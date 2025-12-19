'use client';

/**
 * User Preferences Hook (T222, T223)
 *
 * Fetches and manages user preferences including language and theme.
 * Syncs preferences with Firestore and applies them to the application.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useAuth } from './use-auth';
import { updateProfileAction } from '@/app/actions/auth';
import type { Language, ThemePreference } from '@/types/models/tenant';

export interface UserPreferences {
  language: Language;
  theme: ThemePreference;
  emailNotifications: boolean;
}

export interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: Error | null;
  updateLanguage: (language: Language) => Promise<void>;
  updateTheme: (theme: ThemePreference) => Promise<void>;
  updateEmailNotifications: (enabled: boolean) => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'ar',
  theme: 'system',
  emailNotifications: true,
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user, claims } = useAuth();
  const { setTheme, theme: currentTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to user document for preferences
  useEffect(() => {
    if (!user || !claims?.tenantId) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'tenants', claims.tenantId, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const prefs: UserPreferences = {
            language: (data.language as Language) || 'ar',
            theme: (data.theme as ThemePreference) || 'system',
            emailNotifications: data.emailNotifications !== false,
          };
          setPreferences(prefs);

          // Apply theme preference
          if (prefs.theme !== currentTheme) {
            setTheme(prefs.theme);
          }
        } else {
          setPreferences(DEFAULT_PREFERENCES);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user preferences:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, claims?.tenantId, setTheme, currentTheme]);

  // Update language preference
  const updateLanguage = useCallback(
    async (language: Language) => {
      try {
        const result = await updateProfileAction({ language });
        if (result.success) {
          // Update local state optimistically
          setPreferences((prev) => (prev ? { ...prev, language } : null));

          // Navigate to the new locale
          // Extract current locale from pathname and replace it
          const pathParts = pathname.split('/');
          const currentLocale = pathParts[1];

          if (currentLocale === 'ar' || currentLocale === 'en') {
            pathParts[1] = language;
            const newPath = pathParts.join('/');
            router.push(newPath);
          }
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('Failed to update language:', err);
        throw err;
      }
    },
    [pathname, router]
  );

  // Update theme preference
  const updateTheme = useCallback(
    async (theme: ThemePreference) => {
      try {
        // Apply immediately for better UX
        setTheme(theme);

        const result = await updateProfileAction({ theme });
        if (result.success) {
          setPreferences((prev) => (prev ? { ...prev, theme } : null));
        } else {
          // Revert if failed
          if (preferences?.theme) {
            setTheme(preferences.theme);
          }
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('Failed to update theme:', err);
        throw err;
      }
    },
    [setTheme, preferences?.theme]
  );

  // Update email notifications preference
  const updateEmailNotifications = useCallback(async (enabled: boolean) => {
    try {
      const result = await updateProfileAction({ emailNotifications: enabled });
      if (result.success) {
        setPreferences((prev) => (prev ? { ...prev, emailNotifications: enabled } : null));
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to update email notifications:', err);
      throw err;
    }
  }, []);

  return {
    preferences,
    loading,
    error,
    updateLanguage,
    updateTheme,
    updateEmailNotifications,
  };
}

/**
 * Hook to get the current locale from URL
 */
export function useCurrentLocale(): Language {
  const pathname = usePathname();
  const pathParts = pathname.split('/');
  const locale = pathParts[1];

  if (locale === 'ar' || locale === 'en') {
    return locale;
  }

  return 'ar'; // Default to Arabic
}

/**
 * Hook to check if current locale is RTL
 */
export function useIsRTL(): boolean {
  const locale = useCurrentLocale();
  return locale === 'ar';
}
