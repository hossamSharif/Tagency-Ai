'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

interface HeaderProps {
  locale: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ locale, onMenuClick, showMenuButton = true }: HeaderProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Menu Button (Mobile) */}
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('common.open')}</span>
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher locale={locale} />

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notifications */}
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/notifications`}>
              <Bell className="h-5 w-5" />
              <span className="sr-only">{t('notifications.title')}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
