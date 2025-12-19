'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTenant, useIsInTrial, useTrialDaysRemaining } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

interface SidebarProps {
  locale: string;
  navItems: NavItem[];
  onNavigate?: () => void;
}

export function Sidebar({ locale, navItems, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const isArabic = locale === 'ar';

  const { user, claims, signOut } = useAuth();
  const { tenant } = useTenant();
  const isInTrial = useIsInTrial();
  const trialDaysRemaining = useTrialDaysRemaining();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return claims?.role && item.roles.includes(claims.role);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href={`/${locale}`} className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">
              {isArabic ? 'و' : 'T'}
            </span>
          </div>
          <span className="text-lg font-bold text-foreground truncate">
            {tenant?.name || (isArabic ? 'وكالة السفر' : 'Travel Agency')}
          </span>
        </Link>
      </div>

      {/* Trial Banner */}
      {isInTrial && (
        <div className="mx-4 mt-4 p-3 bg-accent/20 rounded-lg border border-accent">
          <p className="text-sm font-medium text-accent-foreground">
            {t('subscription.trial.daysRemaining', { days: trialDaysRemaining })}
          </p>
          <Link
            href={`/${locale}/settings/subscription`}
            className="text-xs text-accent hover:underline"
            onClick={onNavigate}
          >
            {t('subscription.upgrade')}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.displayName || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {claims?.role ? t(`settings.roles.${claims.role}`) : ''}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => signOut()}
        >
          {t('auth.logout')}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
