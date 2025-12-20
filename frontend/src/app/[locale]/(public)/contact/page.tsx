'use client';

/**
 * Contact Page
 *
 * Dedicated contact page with form and company information.
 */

import { ContactSection } from '@/components/landing';

export default function ContactPage() {
  return (
    <div className="py-12">
      <ContactSection showFullPage />
    </div>
  );
}
