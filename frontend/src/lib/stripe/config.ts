/**
 * Stripe Configuration
 *
 * Server-side Stripe client configuration and pricing constants.
 * This file should only be imported on the server side.
 */

import Stripe from 'stripe';

// Validate required environment variables
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Server-side Stripe client
 * Only use this on the server (API routes, server actions)
 */
export const stripe = new Stripe(getRequiredEnvVar('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Stripe webhook secret for signature verification
 */
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Stripe publishable key for client-side
 */
export const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Platform pricing configuration
 */
export const PRICING = {
  /** Monthly subscription price in smallest currency unit (cents) */
  monthlyPriceAmount: 9900, // $99.00
  /** Currency code */
  currency: 'usd',
  /** Trial period in days */
  trialDays: 14,
  /** Stripe Price ID for monthly subscription (set in env) */
  monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
} as const;

/**
 * Platform features included in subscription
 */
export const SUBSCRIPTION_FEATURES = {
  en: [
    'Unlimited travel packages',
    'Customer management with OCR passport scanning',
    'Invoice generation and payment tracking',
    'Partner commission management',
    'Multi-currency support',
    'Arabic and English interface',
    'Dark and light themes',
    'Email notifications',
  ],
  ar: [
    'باقات سفر غير محدودة',
    'إدارة العملاء مع مسح جوازات السفر بتقنية OCR',
    'إنشاء الفواتير وتتبع المدفوعات',
    'إدارة عمولات الشركاء',
    'دعم العملات المتعددة',
    'واجهة عربية وإنجليزية',
    'سمات داكنة وفاتحة',
    'إشعارات البريد الإلكتروني',
  ],
} as const;

/**
 * Bank transfer details for manual payments
 */
export const BANK_TRANSFER_DETAILS = {
  en: {
    bankName: 'Al Rajhi Bank',
    accountNumber: 'XXXX-XXXX-XXXX-1234',
    accountHolder: 'Travel Agency Platform LLC',
    iban: 'SA0380000000608010167519',
    swiftCode: 'RJHISARI',
    instructions: 'Please include your tenant ID as payment reference',
  },
  ar: {
    bankName: 'مصرف الراجحي',
    accountNumber: 'XXXX-XXXX-XXXX-1234',
    accountHolder: 'شركة منصة وكالات السفر ذ.م.م',
    iban: 'SA0380000000608010167519',
    swiftCode: 'RJHISARI',
    instructions: 'يرجى تضمين معرف المستأجر كمرجع للدفع',
  },
} as const;

/**
 * Stripe checkout session configuration defaults
 */
export const CHECKOUT_CONFIG = {
  /** Payment method types accepted */
  paymentMethodTypes: ['card'] as const,
  /** Billing address collection */
  billingAddressCollection: 'auto' as const,
  /** Allow promotion codes */
  allowPromotionCodes: true,
  /** Customer creation behavior */
  customerCreation: 'always' as const,
} as const;

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession({
  tenantId,
  tenantEmail,
  successUrl,
  cancelUrl,
  customerId,
}: {
  tenantId: string;
  tenantEmail: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    billing_address_collection: CHECKOUT_CONFIG.billingAddressCollection,
    allow_promotion_codes: CHECKOUT_CONFIG.allowPromotionCodes,
    customer: customerId,
    customer_email: customerId ? undefined : tenantEmail,
    client_reference_id: tenantId,
    metadata: {
      tenantId,
    },
    line_items: [
      {
        price: PRICING.monthlyPriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: PRICING.trialDays,
      metadata: {
        tenantId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Create Stripe billing portal session
 */
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Cancel a Stripe subscription
 * Cancels at period end by default
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelImmediately = false
): Promise<Stripe.Subscription> {
  if (cancelImmediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a cancelled Stripe subscription
 * Only works if subscription hasn't expired yet
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get or create a Stripe customer for a tenant
 */
export async function getOrCreateStripeCustomer({
  tenantId,
  email,
  name,
  existingCustomerId,
}: {
  tenantId: string;
  email: string;
  name: string;
  existingCustomerId?: string;
}): Promise<Stripe.Customer> {
  // If we have an existing customer ID, retrieve it
  if (existingCustomerId) {
    const customer = await stripe.customers.retrieve(existingCustomerId);
    if (!customer.deleted) {
      return customer as Stripe.Customer;
    }
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  });

  return customer;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get subscription by ID
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Format amount from smallest unit to display format
 */
export function formatStripeAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
