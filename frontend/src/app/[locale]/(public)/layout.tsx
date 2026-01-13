import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations('common');
  const tAuth = await getTranslations('auth');
  const isArabic = locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Agency AI"
                width={40}
                height={40}
                className="flex-shrink-0"
                priority
              />
              <span className="text-xl font-bold text-foreground">
                Agency AI
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={`/${locale}#features`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isArabic ? 'المميزات' : 'Features'}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isArabic ? 'الأسعار' : 'Pricing'}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isArabic ? 'تواصل معنا' : 'Contact'}
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <Link
                href={isArabic ? `/en` : `/ar`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isArabic ? 'EN' : 'عربي'}
              </Link>

              <Link
                href={`/${locale}/login`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {tAuth('login')}
              </Link>

              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {tAuth('startFreeTrial')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href={`/${locale}`} className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt="Agency AI"
                  width={40}
                  height={40}
                  className="flex-shrink-0"
                />
                <span className="text-xl font-bold text-foreground">
                  Agency AI
                </span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-md">
                {isArabic
                  ? 'منصة متكاملة لإدارة وكالات السفر - باقات الحج والعمرة وشهر العسل والرحلات المخصصة.'
                  : 'Complete platform for travel agency management - Hajj, Umrah, honeymoon, and custom trip packages.'}
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">{isArabic ? 'روابط سريعة' : 'Quick Links'}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/${locale}#features`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isArabic ? 'المميزات' : 'Features'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/pricing`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isArabic ? 'الأسعار' : 'Pricing'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/contact`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isArabic ? 'تواصل معنا' : 'Contact'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{isArabic ? 'قانوني' : 'Legal'}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/${locale}/privacy`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/terms`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isArabic ? 'الشروط والأحكام' : 'Terms of Service'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()}{' '}
              Agency AI. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
