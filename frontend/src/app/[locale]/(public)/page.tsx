'use client';

/**
 * Landing Page
 *
 * Main landing page for the travel agency SaaS platform.
 */

import {
  HeroSection,
  FeaturesSection,
  PricingSection,
  CTASection,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
