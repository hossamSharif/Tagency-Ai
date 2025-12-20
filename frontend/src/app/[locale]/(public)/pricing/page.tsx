'use client';

/**
 * Pricing Page
 *
 * Dedicated pricing page with detailed plan information.
 */

import { PricingSection } from '@/components/landing';

export default function PricingPage() {
  return (
    <div className="py-12">
      <PricingSection showFullPage />
    </div>
  );
}
