import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { NotificationType } from '@/types/models/notification';

/**
 * Email template names available in the system
 */
export type EmailTemplateName =
  | 'payment_received'
  | 'payment_approved'
  | 'payment_rejected'
  | 'booking_confirmation'
  | 'booking_cancelled'
  | 'document_requested'
  | 'document_verified'
  | 'document_rejected'
  | 'commission_settled'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'trial_ending'
  | 'welcome'
  | 'user_invitation'
  | 'password_reset';

/**
 * Email data for templates
 */
export interface EmailData {
  /** Recipient name */
  recipientName?: string;
  /** Recipient name in Arabic */
  recipientNameAr?: string;
  /** Amount (for payment emails) */
  amount?: string;
  /** Currency code */
  currency?: string;
  /** Package name */
  packageName?: string;
  /** Package name in Arabic */
  packageNameAr?: string;
  /** Booking number */
  bookingNumber?: string;
  /** Invoice number */
  invoiceNumber?: string;
  /** Document type */
  documentType?: string;
  /** Rejection reason */
  rejectionReason?: string;
  /** Action URL */
  actionUrl?: string;
  /** Trial days remaining */
  trialDaysRemaining?: number;
  /** Expiry date */
  expiryDate?: string;
  /** Settlement amount */
  settlementAmount?: string;
  /** Settlement period */
  settlementPeriod?: string;
  /** Partner office name */
  partnerOfficeName?: string;
  /** Invitation link */
  invitationLink?: string;
  /** Reset link */
  resetLink?: string;
  /** Office name */
  officeName?: string;
  /** Custom message */
  customMessage?: string;
  /** Any additional data */
  [key: string]: unknown;
}

/**
 * Email options
 */
export interface SendEmailOptions {
  /** Recipient email addresses */
  to: string[];
  /** CC email addresses */
  cc?: string[];
  /** BCC email addresses */
  bcc?: string[];
  /** Template name */
  template: EmailTemplateName;
  /** Template data */
  data: EmailData;
  /** Language for the template */
  language?: 'ar' | 'en';
  /** Tenant ID for tracking */
  tenantId?: string;
  /** Related notification ID */
  notificationId?: string;
}

/**
 * Mail document structure for Firebase Trigger Email extension
 * This gets written to the 'mail' collection and triggers email sending
 */
interface MailDocument {
  to: string[];
  cc?: string[];
  bcc?: string[];
  template: {
    name: string;
    data: Record<string, unknown>;
  };
  metadata?: {
    tenantId?: string;
    notificationId?: string;
    language?: string;
    createdAt: ReturnType<typeof serverTimestamp>;
  };
}

/**
 * Send an email using Firebase Trigger Email extension
 * Writes to the 'mail' collection which triggers the extension to send emails
 */
export async function sendEmail(options: SendEmailOptions): Promise<string> {
  const { to, cc, bcc, template, data, language = 'ar', tenantId, notificationId } = options;

  // Construct the template name with language suffix
  const templateName = `${template}_${language}`;

  const mailDoc: MailDocument = {
    to,
    template: {
      name: templateName,
      data: {
        ...data,
        language,
      },
    },
    metadata: {
      tenantId,
      notificationId,
      language,
      createdAt: serverTimestamp(),
    },
  };

  if (cc && cc.length > 0) {
    mailDoc.cc = cc;
  }

  if (bcc && bcc.length > 0) {
    mailDoc.bcc = bcc;
  }

  // Write to the mail collection - Firebase Trigger Email extension picks this up
  const mailRef = await addDoc(collection(db, 'mail'), mailDoc);

  return mailRef.id;
}

/**
 * Send a notification email (convenience wrapper)
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  notificationType: NotificationType,
  data: EmailData,
  language: 'ar' | 'en' = 'ar',
  tenantId?: string
): Promise<string | null> {
  // Map notification types to email templates
  const templateMap: Partial<Record<NotificationType, EmailTemplateName>> = {
    payment_received: 'payment_received',
    payment_approved: 'payment_approved',
    payment_rejected: 'payment_rejected',
    booking_confirmed: 'booking_confirmation',
    booking_cancelled: 'booking_cancelled',
    document_requested: 'document_requested',
    document_verified: 'document_verified',
    document_rejected: 'document_rejected',
    commission_settled: 'commission_settled',
    subscription_expiring: 'subscription_expiring',
    subscription_expired: 'subscription_expired',
    trial_ending: 'trial_ending',
    user_invited: 'user_invitation',
  };

  const template = templateMap[notificationType];
  if (!template) {
    console.log(`No email template for notification type: ${notificationType}`);
    return null;
  }

  return sendEmail({
    to: [recipientEmail],
    template,
    data: {
      recipientName,
      ...data,
    },
    language,
    tenantId,
  });
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  officeName: string,
  language: 'ar' | 'en' = 'ar'
): Promise<string> {
  return sendEmail({
    to: [email],
    template: 'welcome',
    data: {
      recipientName: name,
      officeName,
    },
    language,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string,
  language: 'ar' | 'en' = 'ar'
): Promise<string> {
  return sendEmail({
    to: [email],
    template: 'password_reset',
    data: {
      recipientName: name,
      resetLink,
    },
    language,
  });
}

/**
 * Send an invitation email to new team members
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  officeName: string,
  invitationLink: string,
  role: string,
  language: 'ar' | 'en' = 'ar'
): Promise<string> {
  return sendEmail({
    to: [email],
    template: 'user_invitation',
    data: {
      inviterName,
      officeName,
      invitationLink,
      role,
    },
    language,
  });
}

/**
 * Batch send emails (for bulk notifications)
 */
export async function sendBulkEmails(
  emailOptions: SendEmailOptions[]
): Promise<{ sent: string[]; failed: Error[] }> {
  const results = {
    sent: [] as string[],
    failed: [] as Error[],
  };

  // Send in parallel with a concurrency limit
  const BATCH_SIZE = 10;
  for (let i = 0; i < emailOptions.length; i += BATCH_SIZE) {
    const batch = emailOptions.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (options) => {
      try {
        const id = await sendEmail(options);
        results.sent.push(id);
      } catch (error) {
        results.failed.push(error as Error);
      }
    });
    await Promise.all(promises);
  }

  return results;
}
