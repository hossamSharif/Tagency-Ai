'use client';

/**
 * HeroSection Component
 *
 * Main hero section for the landing page with headline, description, and CTA.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === 'ar';

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background',
        'py-20 md:py-32',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(45%_50%_at_50%_50%,hsl(var(--primary)/0.1)_0%,transparent_100%)]" />
        <div className="absolute bottom-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{t('badge')}</span>
          </div>

          {/* Headline */}
          <h1
            className={cn(
              'text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl',
              isArabic
                ? 'tracking-wide leading-relaxed [word-spacing:0.15em]'
                : 'tracking-tight'
            )}
          >
            <span className={cn('block', isArabic && 'mb-4')}>{t('headline')}</span>
            <span className="block text-primary">{t('headlineHighlight')}</span>
          </h1>

          {/* Description */}
          <p
            className={cn(
              'mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl',
              isArabic && 'leading-loose [word-spacing:0.08em]'
            )}
          >
            {t('description')}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${locale}/signup`}>
              <Button size="lg" className="gap-2 min-w-[180px]">
                {t('startTrial')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button variant="outline" size="lg" className="min-w-[180px]">
                {t('viewPricing')}
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="mt-6 text-sm text-muted-foreground">
            {t('trialNote')}
          </p>
        </div>
      </div>
    </section>
  );
}
