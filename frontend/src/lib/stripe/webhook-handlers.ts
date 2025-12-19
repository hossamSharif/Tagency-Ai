/**
 * Stripe Webhook Event Handlers
 *
 * Handles various Stripe events for subscription and payment management.
 */

import Stripe from 'stripe';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Handle checkout.session.completed event
 * Activates subscription after successful checkout
 */
export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<void> {
  const tenantId = session.client_reference_id || session.metadata?.tenantId;

  if (!tenantId) {
    console.error('No tenant ID in checkout session:', session.id);
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Update subscription document
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);

  await subscriptionRef.update({
    status: 'active',
    plan: 'monthly',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    updatedAt: Timestamp.now(),
  });

  // Update tenant status
  const tenantRef = adminDb.collection('tenants').doc(tenantId);
  await tenantRef.update({
    status: 'active',
    updatedAt: Timestamp.now(),
  });

  // Log the event
  await logWebhookEvent({
    source: 'stripe',
    eventType: 'checkout.session.completed',
    eventId: session.id,
    tenantId,
    status: 'processed',
  });

  console.log(`Subscription activated for tenant: ${tenantId}`);
}

/**
 * Handle customer.subscription.created event
 * Stores initial subscription data
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    console.error('No tenant ID in subscription metadata:', subscription.id);
    return;
  }

  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);

  await subscriptionRef.update({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    currentPeriodStart: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
    currentPeriodEnd: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
    status: mapStripeStatus(subscription.status),
    updatedAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'customer.subscription.created',
    eventId: subscription.id,
    tenantId,
    status: 'processed',
  });

  console.log(`Subscription created for tenant: ${tenantId}`);
}

/**
 * Handle customer.subscription.updated event
 * Updates subscription dates and status
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    // Try to find tenant by Stripe subscription ID
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    if (subscriptionsSnapshot.empty) {
      console.error('No tenant found for subscription:', subscription.id);
      return;
    }

    const doc = subscriptionsSnapshot.docs[0];
    await updateSubscriptionFromStripe(doc.id, subscription);
    return;
  }

  await updateSubscriptionFromStripe(tenantId, subscription);
}

async function updateSubscriptionFromStripe(
  tenantId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);

  const updateData: Record<string, unknown> = {
    currentPeriodStart: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
    currentPeriodEnd: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
    status: mapStripeStatus(subscription.status),
    updatedAt: Timestamp.now(),
  };

  // Handle cancellation
  if (subscription.cancel_at_period_end) {
    updateData.cancelledAt = Timestamp.now();
    updateData.accessUntil = Timestamp.fromDate(
      new Date(subscription.current_period_end * 1000)
    );
  } else {
    // Subscription reactivated
    updateData.cancelledAt = null;
    updateData.accessUntil = null;
  }

  await subscriptionRef.update(updateData);

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'customer.subscription.updated',
    eventId: subscription.id,
    tenantId,
    status: 'processed',
  });

  console.log(`Subscription updated for tenant: ${tenantId}`);
}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as cancelled/expired
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    // Try to find tenant by Stripe subscription ID
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    if (subscriptionsSnapshot.empty) {
      console.error('No tenant found for subscription:', subscription.id);
      return;
    }

    const doc = subscriptionsSnapshot.docs[0];
    await expireSubscription(doc.id, subscription.id);
    return;
  }

  await expireSubscription(tenantId, subscription.id);
}

async function expireSubscription(
  tenantId: string,
  subscriptionId: string
): Promise<void> {
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);

  await subscriptionRef.update({
    status: 'expired',
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update tenant status
  const tenantRef = adminDb.collection('tenants').doc(tenantId);
  await tenantRef.update({
    status: 'suspended',
    updatedAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'customer.subscription.deleted',
    eventId: subscriptionId,
    tenantId,
    status: 'processed',
  });

  console.log(`Subscription expired for tenant: ${tenantId}`);
}

/**
 * Handle invoice.payment_succeeded event
 * Records successful subscription payment
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  if (invoice.billing_reason !== 'subscription_cycle' &&
      invoice.billing_reason !== 'subscription_create') {
    return;
  }

  const subscriptionId = invoice.subscription as string;

  // Find the tenant by subscription ID
  const subscriptionsSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) {
    console.error('No tenant found for subscription:', subscriptionId);
    return;
  }

  const tenantId = subscriptionsSnapshot.docs[0].id;

  // Record the payment
  const paymentRef = adminDb
    .collection('subscriptions')
    .doc(tenantId)
    .collection('payments')
    .doc();

  await paymentRef.set({
    id: paymentRef.id,
    subscriptionId: tenantId,
    tenantId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    method: 'stripe',
    status: 'completed',
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoice.payment_intent as string,
    periodStart: invoice.period_start
      ? Timestamp.fromDate(new Date(invoice.period_start * 1000))
      : null,
    periodEnd: invoice.period_end
      ? Timestamp.fromDate(new Date(invoice.period_end * 1000))
      : null,
    createdAt: Timestamp.now(),
    completedAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'invoice.payment_succeeded',
    eventId: invoice.id,
    tenantId,
    status: 'processed',
  });

  console.log(`Payment recorded for tenant: ${tenantId}`);
}

/**
 * Handle invoice.payment_failed event
 * Updates subscription to past_due status
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Find the tenant by subscription ID
  const subscriptionsSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) {
    console.error('No tenant found for subscription:', subscriptionId);
    return;
  }

  const tenantId = subscriptionsSnapshot.docs[0].id;
  const subscriptionRef = adminDb.collection('subscriptions').doc(tenantId);

  await subscriptionRef.update({
    status: 'past_due',
    updatedAt: Timestamp.now(),
  });

  // Record the failed payment
  const paymentRef = adminDb
    .collection('subscriptions')
    .doc(tenantId)
    .collection('payments')
    .doc();

  await paymentRef.set({
    id: paymentRef.id,
    subscriptionId: tenantId,
    tenantId,
    amount: invoice.amount_due,
    currency: invoice.currency,
    method: 'stripe',
    status: 'failed',
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoice.payment_intent as string,
    createdAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'invoice.payment_failed',
    eventId: invoice.id,
    tenantId,
    status: 'processed',
  });

  console.log(`Payment failed for tenant: ${tenantId}`);
}

/**
 * Handle payment_intent.succeeded event
 * For customer invoice payments (not subscriptions)
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const metadata = paymentIntent.metadata;

  // Only process invoice payments
  if (!metadata.invoiceId || !metadata.tenantId) {
    return;
  }

  const { tenantId, invoiceId } = metadata;

  // Update invoice status
  const invoiceRef = adminDb
    .doc(`tenants/${tenantId}/invoices/${invoiceId}`);

  await invoiceRef.update({
    status: 'paid',
    paidAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Record the payment
  const paymentRef = adminDb
    .collection(`tenants/${tenantId}/payments`)
    .doc();

  await paymentRef.set({
    id: paymentRef.id,
    invoiceId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    method: 'stripe',
    status: 'completed',
    stripePaymentIntentId: paymentIntent.id,
    createdAt: Timestamp.now(),
    completedAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'payment_intent.succeeded',
    eventId: paymentIntent.id,
    tenantId,
    status: 'processed',
    payload: { invoiceId },
  });

  console.log(`Invoice payment completed: ${invoiceId} for tenant: ${tenantId}`);
}

/**
 * Handle payment_intent.payment_failed event
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const metadata = paymentIntent.metadata;

  if (!metadata.invoiceId || !metadata.tenantId) {
    return;
  }

  const { tenantId, invoiceId } = metadata;

  // Record the failed payment
  const paymentRef = adminDb
    .collection(`tenants/${tenantId}/payments`)
    .doc();

  await paymentRef.set({
    id: paymentRef.id,
    invoiceId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    method: 'stripe',
    status: 'failed',
    stripePaymentIntentId: paymentIntent.id,
    failureReason: paymentIntent.last_payment_error?.message,
    createdAt: Timestamp.now(),
  });

  await logWebhookEvent({
    source: 'stripe',
    eventType: 'payment_intent.payment_failed',
    eventId: paymentIntent.id,
    tenantId,
    status: 'processed',
    payload: { invoiceId },
  });

  console.log(`Invoice payment failed: ${invoiceId} for tenant: ${tenantId}`);
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'past_due' | 'cancelled' | 'expired' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    default:
      return 'expired';
  }
}

/**
 * Log webhook event for debugging
 */
interface WebhookLogInput {
  source: 'stripe';
  eventType: string;
  eventId: string;
  tenantId?: string;
  status: 'received' | 'processed' | 'failed';
  error?: string;
  payload?: Record<string, unknown>;
}

async function logWebhookEvent(input: WebhookLogInput): Promise<void> {
  try {
    const logRef = adminDb.collection('webhookLogs').doc();
    await logRef.set({
      id: logRef.id,
      ...input,
      processedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to log webhook event:', err);
  }
}
