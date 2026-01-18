'use client';

/**
 * FeaturesSection Component
 *
 * Displays key features of the platform in a grid layout.
 */

import { useTranslations } from 'next-intl';
import {
  Package,
  Users,
  Building2,
  Globe,
  Shield,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FeaturesSectionProps {
  className?: string;
}

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

const features: Feature[] = [
  {
    icon: Package,
    titleKey: 'packages',
    descriptionKey: 'packagesDesc',
  },
  {
    icon: Users,
    titleKey: 'customers',
    descriptionKey: 'customersDesc',
  },
  {
    icon: Building2,
    titleKey: 'partners',
    descriptionKey: 'partnersDesc',
  },
  {
    icon: Globe,
    titleKey: 'bilingual',
    descriptionKey: 'bilingualDesc',
  },
  {
    icon: Shield,
    titleKey: 'security',
    descriptionKey: 'securityDesc',
  },
  {
    icon: BarChart3,
    titleKey: 'reports',
    descriptionKey: 'reportsDesc',
  },
];

export function FeaturesSection({ className }: FeaturesSectionProps) {
  const t = useTranslations('landing.features');

  return (
    <section className={cn('py-20 md:py-28', className)} id="features">
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

        {/* Features grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.titleKey}
              className={cn(
                'group relative overflow-hidden transition-all hover:shadow-lg',
                'border-transparent bg-gradient-to-b from-muted/50 to-muted/30',
                'hover:border-primary/20'
              )}
            >
              <CardHeader className="pb-2">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {t(feature.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
