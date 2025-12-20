'use client';

/**
 * Header Component
 *
 * Landing page header with navigation and auth buttons.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plane, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  className?: string;
}

interface NavLink {
  labelKey: string;
  href: string;
}

const navLinks: NavLink[] = [
  { labelKey: 'features', href: '#features' },
  { labelKey: 'pricing', href: '/pricing' },
  { labelKey: 'contact', href: '/contact' },
];

export function Header({ className }: HeaderProps) {
  const t = useTranslations('landing.header');
  const params = useParams();
  const locale = params.locale as string;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">{t('brand')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.labelKey}
              href={link.href.startsWith('#') ? link.href : `/${locale}${link.href}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(`nav.${link.labelKey}`)}
            </Link>
          ))}
        </nav>

        {/* Right side: Language switcher + Auth buttons */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Switch language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/ar" className={locale === 'ar' ? 'font-bold' : ''}>
                  العربية
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/en" className={locale === 'en' ? 'font-bold' : ''}>
                  English
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link href={`/${locale}/login`}>
              <Button variant="ghost">{t('login')}</Button>
            </Link>
            <Link href={`/${locale}/signup`}>
              <Button>{t('signup')}</Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-72">
              <div className="flex flex-col gap-6 mt-6">
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <SheetClose key={link.labelKey} asChild>
                      <Link
                        href={link.href.startsWith('#') ? link.href : `/${locale}${link.href}`}
                        className="text-lg font-medium"
                      >
                        {t(`nav.${link.labelKey}`)}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                {/* Mobile Auth buttons */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <SheetClose asChild>
                    <Link href={`/${locale}/login`}>
                      <Button variant="outline" className="w-full">
                        {t('login')}
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/${locale}/signup`}>
                      <Button className="w-full">{t('signup')}</Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
