'use client';

/**
 * PricingSection Component
 *
 * Displays pricing plans with features list and CTA.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PricingSectionProps {
  className?: string;
  showFullPage?: boolean;
}

interface PricingPlan {
  id: string;
  nameKey: string;
  descriptionKey: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    id: 'trial',
    nameKey: 'trial',
    descriptionKey: 'trialDesc',
    price: 0,
    currency: 'SAR',
    period: '7days',
    features: ['feature1', 'feature2', 'feature3', 'feature4'],
    badge: 'free',
  },
  {
    id: 'monthly',
    nameKey: 'monthly',
    descriptionKey: 'monthlyDesc',
    price: 299,
    currency: 'SAR',
    period: 'month',
    features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7'],
    highlighted: true,
    badge: 'popular',
  },
];

export function PricingSection({ className, showFullPage = false }: PricingSectionProps) {
  const t = useTranslations('landing.pricing');
  const params = useParams();
  const locale = params.locale as string;

  return (
    <section
      className={cn(
        'py-20 md:py-28',
        showFullPage && 'min-h-[calc(100vh-200px)]',
        className
      )}
      id="pricing"
    >
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative overflow-hidden transition-all',
                plan.highlighted && 'border-primary shadow-lg scale-105 z-10'
              )}
            >
              {plan.badge && (
                <Badge
                  variant={plan.highlighted ? 'default' : 'secondary'}
                  className="absolute top-4 end-4"
                >
                  {plan.highlighted && <Sparkles className="h-3 w-3 me-1" />}
                  {t(`badges.${plan.badge}`)}
                </Badge>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{t(`plans.${plan.nameKey}`)}</CardTitle>
                <CardDescription>{t(`plans.${plan.descriptionKey}`)}</CardDescription>
              </CardHeader>

              <CardContent className="pb-4">
                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg text-muted-foreground ms-1">{plan.currency}</span>
                  <span className="text-muted-foreground">/{t(`period.${plan.period}`)}</span>
                </div>

                {/* Features list */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{t(`features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href={`/${locale}/signup`} className="w-full">
                  <Button
                    variant={plan.highlighted ? 'default' : 'outline'}
                    className="w-full"
                    size="lg"
                  >
                    {plan.price === 0 ? t('startTrial') : t('subscribe')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional notes */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            {t('note')}
          </p>
        </div>
      </div>
    </section>
  );
}
