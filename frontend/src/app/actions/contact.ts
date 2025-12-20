'use server';

/**
 * Contact Form Server Actions
 *
 * Server actions for handling contact form submissions.
 */

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/**
 * Submit contact form
 * Stores the submission in Firestore and optionally triggers email notification
 */
export async function submitContactFormAction(
  input: ContactFormInput
): Promise<ActionResult<{ submissionId: string }>> {
  try {
    // Validate input
    const validatedData = contactFormSchema.parse(input);

    // Store in Firestore
    const submissionRef = await adminDb.collection('contactSubmissions').add({
      ...validatedData,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
      respondedAt: null,
    });

    // Optionally send notification to admin email
    try {
      // Could trigger email notification here
      // await sendEmail({ ... })
    } catch (emailError) {
      console.error('Failed to send contact notification:', emailError);
    }

    return success(
      { submissionId: submissionRef.id },
      'Contact form submitted successfully'
    );
  } catch (err) {
    console.error('Contact form submission error:', err);

    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      err.errors.forEach((e) => {
        const path = e.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(e.message);
      });
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, fieldErrors);
    }

    return error('Failed to submit contact form', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Get contact submissions (admin only)
 */
export async function getContactSubmissionsAction(options?: {
  status?: 'new' | 'read' | 'responded';
  limit?: number;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
      status: string;
      createdAt: Date;
    }>
  >
> {
  try {
    const { status, limit: queryLimit = 50 } = options || {};

    let query = adminDb
      .collection('contactSubmissions')
      .orderBy('createdAt', 'desc')
      .limit(queryLimit);

    if (status) {
      query = adminDb
        .collection('contactSubmissions')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(queryLimit);
    }

    const snapshot = await query.get();

    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
      status: string;
      createdAt: Date;
    }>;

    return success(submissions);
  } catch (err) {
    console.error('Get contact submissions error:', err);
    return error('Failed to get contact submissions', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Mark contact submission as read
 */
export async function markContactReadAction(
  submissionId: string
): Promise<ActionResult<void>> {
  try {
    await adminDb.collection('contactSubmissions').doc(submissionId).update({
      status: 'read',
      readAt: FieldValue.serverTimestamp(),
    });

    return success(undefined);
  } catch (err) {
    console.error('Mark contact read error:', err);
    return error('Failed to mark as read', ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Mark contact submission as responded
 */
export async function markContactRespondedAction(
  submissionId: string,
  response?: string
): Promise<ActionResult<void>> {
  try {
    await adminDb.collection('contactSubmissions').doc(submissionId).update({
      status: 'responded',
      respondedAt: FieldValue.serverTimestamp(),
      response: response || null,
    });

    return success(undefined);
  } catch (err) {
    console.error('Mark contact responded error:', err);
    return error('Failed to mark as responded', ErrorCodes.INTERNAL_ERROR);
  }
}
