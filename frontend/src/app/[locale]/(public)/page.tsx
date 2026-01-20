'use client';

/**
 * Landing Page
 *
 * Main landing page for the travel agency SaaS platform.
 */

import {
  HeroSection,
  FeaturesSection,
  PreorderSection,
  CTASection,
  WhatsAppFloatButton,
} from '@/components/landing';
import { HeroShowcaseProvider } from '@/contexts/hero-showcase-context';

export default function LandingPage() {
  return (
    <>
      <HeroShowcaseProvider>
        <HeroSection />
      </HeroShowcaseProvider>
      <FeaturesSection />
      <PreorderSection />
      <CTASection />
      <WhatsAppFloatButton />
    </>
  );
}
