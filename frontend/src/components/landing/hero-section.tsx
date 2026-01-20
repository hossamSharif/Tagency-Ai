'use client';

/**
 * HeroSection Component
 *
 * Main hero section for the landing page with headline, description, CTA, and feature showcase.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeroShowcaseSlider } from './hero-showcase-slider';
import { useHeroShowcase } from '@/contexts/hero-showcase-context';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === 'ar';
  const { activeSlideIndex } = useHeroShowcase();

  // Map slide index to feature content
  // Slide 0 (Dashboard) → Feature 1
  // Slide 1 (Passport Scan) → Feature 1
  // Slide 2 (Invoice Creation) → Feature 2
  // Slide 3 (Journal Entries) → Feature 3
  const getFeatureContent = (slideIndex: number) => {
    const featureMap = [1, 1, 2, 3]; // Index maps to feature number
    const featureNumber = featureMap[slideIndex];

    return {
      subtitle: t(`features.${featureNumber}.subtitle`),
      description: t(`features.${featureNumber}.description`),
    };
  };

  const content = getFeatureContent(activeSlideIndex);

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background',
        'pt-6 pb-4 md:pt-10 md:pb-6',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(45%_50%_at_50%_50%,hsl(var(--primary)/0.1)_0%,transparent_100%)]" />
        <div className="absolute bottom-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container">
        {/* Two-column layout: Content + Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">

          {/* Content column */}
          <div
            className={cn(
              'space-y-4 text-center',
              isArabic ? 'lg:order-2' : 'lg:order-1'
            )}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                'text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl',
                isArabic
                  ? 'tracking-wide leading-tight [word-spacing:0.1em]'
                  : 'tracking-tight leading-tight'
              )}
            >
              <span className="block">{t('headline')}</span>
              {/* Animated subtitle */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={`subtitle-${activeSlideIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    y: { duration: 0.3, ease: 'easeOut' }
                  }}
                  className="block text-primary text-lg sm:text-xl md:text-2xl lg:text-3xl"
                >
                  {content.subtitle}
                </motion.span>
              </AnimatePresence>
            </h1>

            {/* Animated Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`description-${activeSlideIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  opacity: { duration: 0.2 },
                  y: { duration: 0.3, ease: 'easeOut' }
                }}
                className={cn(
                  'text-sm text-muted-foreground sm:text-base max-w-xl mx-auto',
                  isArabic && 'leading-relaxed [word-spacing:0.05em]'
                )}
              >
                {content.description}
              </motion.p>
            </AnimatePresence>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
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
            <p className="text-sm text-muted-foreground">
              {t('trialNote')}
            </p>
          </div>

          {/* Showcase column */}
          <div
            className={cn(
              'relative lg:ms-6',
              isArabic ? 'lg:order-1' : 'lg:order-2'
            )}
          >
            <HeroShowcaseSlider />
          </div>

        </div>
      </div>
    </section>
  );
}
