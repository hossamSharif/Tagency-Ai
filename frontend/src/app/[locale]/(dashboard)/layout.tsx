'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Package,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  Building2,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  Home,
  Briefcase,
  Calculator,
  ScrollText,
  Receipt,
  FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useIsSubscriptionActive, useTrialDaysRemaining, useIsInTrial } from '@/hooks/use-tenant';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string || 'en';
  const isArabic = locale === 'ar';

  const { user, claims, signOut } = useAuth();
  const { tenant, isActive, trialDaysRemaining } = useTenant();
  const isInTrial = useIsInTrial();

  const navItems: NavItem[] = [
    { href: `/${locale}/dashboard`, label: t('reports.dashboard'), icon: Home },
    { href: `/${locale}/invoices`, label: t('invoices.title'), icon: FileText },
    { href: `/${locale}/partners`, label: t('partners.title'), icon: Building2, roles: ['owner', 'admin'] },
    { href: `/${locale}/accounting/expenses`, label: t('expenses.title'), icon: Receipt, roles: ['owner', 'admin'] },
    { href: `/${locale}/services`, label: t('services.title'), icon: Briefcase },
    { href: `/${locale}/customers`, label: t('customers.title'), icon: Users },
    { href: `/${locale}/accounting/accounts`, label: t('accounting.title'), icon: Calculator, roles: ['owner', 'admin'] },
    { href: `/${locale}/accounting/journal`, label: t('accounting.journal'), icon: ScrollText, roles: ['owner', 'admin'] },
    { href: `/${locale}/statements`, label: t('statements.title'), icon: FileBarChart, roles: ['owner', 'admin'] },
    { href: `/${locale}/reports`, label: t('reports.title'), icon: BarChart3, roles: ['owner', 'admin'] },
    { href: `/${locale}/settings`, label: t('settings.title'), icon: Settings },
    // { href: `/${locale}/packages`, label: t('packages.title'), icon: Package }, // Hidden - pages accessible via direct URL
    // { href: `/${locale}/bookings`, label: t('bookings.title'), icon: BookOpen }, // Hidden - pages accessible via direct URL
    // { href: `/${locale}/payments`, label: t('payments.title'), icon: CreditCard }, // Hidden - accessible via invoices page button
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return claims?.role && item.roles.includes(claims.role);
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Agency AI"
            width={40}
            height={40}
            className="flex-shrink-0"
            priority
          />
          <span className="text-lg font-bold text-foreground">
            {tenant?.name || t('common.appName')}
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
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || user?.email}</p>
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

  return (
    <div className="min-h-screen bg-muted">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side={isArabic ? 'right' : 'left'} className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 w-64 bg-card border-e hidden lg:block',
          isArabic ? 'right-0' : 'left-0'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className={cn('lg:ps-64', isArabic ? 'lg:pr-64 lg:pl-0' : 'lg:pl-64 lg:pr-0')}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-card border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/${locale}/notifications`}>
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
