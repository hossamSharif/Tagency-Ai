'use client';

/**
 * Footer Component
 *
 * Landing page footer with links, social media, and copyright.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plane, Twitter, Linkedin, Instagram, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FooterProps {
  className?: string;
}

interface FooterLink {
  labelKey: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  titleKey: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    titleKey: 'product',
    links: [
      { labelKey: 'features', href: '#features' },
      { labelKey: 'pricing', href: '/pricing' },
      { labelKey: 'faq', href: '/faq' },
    ],
  },
  {
    titleKey: 'company',
    links: [
      { labelKey: 'about', href: '/about' },
      { labelKey: 'contact', href: '/contact' },
      { labelKey: 'blog', href: '/blog' },
    ],
  },
  {
    titleKey: 'legal',
    links: [
      { labelKey: 'privacy', href: '/privacy' },
      { labelKey: 'terms', href: '/terms' },
      { labelKey: 'cookies', href: '/cookies' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
];

export function Footer({ className }: FooterProps) {
  const t = useTranslations('landing.footer');
  const params = useParams();
  const locale = params.locale as string;

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('border-t bg-muted/30', className)}>
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plane className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">{t('brand')}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t('description')}
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <a
                href="mailto:info@travelagency.sa"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                info@travelagency.sa
              </a>
              <a
                href="tel:+966501234567"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                +966 50 123 4567
              </a>
            </div>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <h3 className="font-semibold">{t(`sections.${section.titleKey}`)}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(`links.${link.labelKey}`)}
                      </a>
                    ) : (
                      <Link
                        href={link.href.startsWith('#') ? link.href : `/${locale}${link.href}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(`links.${link.labelKey}`)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale === 'ar' ? 'en' : 'ar'}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === 'ar' ? 'English' : 'العربية'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
