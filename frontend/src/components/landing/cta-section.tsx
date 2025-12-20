'use client';

/**
 * CTASection Component
 *
 * Call-to-action section encouraging users to sign up.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CTASectionProps {
  className?: string;
}

export function CTASection({ className }: CTASectionProps) {
  const t = useTranslations('landing.cta');
  const params = useParams();
  const locale = params.locale as string;

  return (
    <section className={cn('py-20 md:py-28', className)}>
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 md:px-12 md:py-24">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute -start-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-1/4 -end-1/4 h-1/2 w-1/2 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center text-primary-foreground">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/20 p-3">
              <Rocket className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t('title')}
            </h2>

            <p className="mt-6 text-lg text-primary-foreground/80">
              {t('description')}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/${locale}/signup`}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 min-w-[180px]"
                >
                  {t('startNow')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[180px] bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  {t('contactUs')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
