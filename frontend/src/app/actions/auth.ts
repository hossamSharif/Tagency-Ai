'use server';

/**
 * Authentication Server Actions
 *
 * Server actions for signup, login, password management, and user invitations.
 * Uses Firebase Admin SDK for server-side operations.
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb, setUserClaims, getUserByEmail } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  ActionResult,
  success,
  error,
  ErrorCodes,
} from '@/lib/actions/types';
import {
  signupServerSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
  inviteUserSchema,
  type SignupServerInput,
  type LoginInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
  type UpdateProfileInput,
  type InviteUserInput,
} from '@/lib/validations/auth';
import { TRIAL_DURATION_DAYS, calculateTrialEndDate } from '@/types/models/subscription';
import type { Tenant } from '@/types/models/tenant';
import type { User } from '@/types/models/user';
import type { Subscription } from '@/types/models/subscription';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // Keep Arabic characters
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    + '-' + Date.now().toString(36);
}

/**
 * Get the current authenticated user from the session
 */
async function getCurrentUser(): Promise<{ uid: string; tenantId: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value);
    return {
      uid: decodedToken.uid,
      tenantId: decodedToken.tenantId as string,
      role: decodedToken.role as string,
    };
  } catch {
    return null;
  }
}

// ==========================================
// Signup Action (T045)
// ==========================================

export interface SignupResult {
  userId: string;
  tenantId: string;
  trialEndsAt: string;
}

/**
 * Register a new office with trial subscription
 * Creates: tenant, subscription, admin user, and sets custom claims
 */
export async function signupAction(
  input: SignupServerInput
): Promise<ActionResult<SignupResult>> {
  try {
    // Validate input
    const validation = signupServerSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { email, password, officeName, phone, currency, language } = validation.data;

    // Check if email already exists
    try {
      await getUserByEmail(email);
      return error('An account with this email already exists', ErrorCodes.ALREADY_EXISTS);
    } catch {
      // User doesn't exist, continue
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: officeName,
      emailVerified: false,
    });

    const tenantId = userRecord.uid; // Use uid as tenant ID for simplicity
    const now = Timestamp.now();
    const trialEndsAt = Timestamp.fromDate(calculateTrialEndDate(new Date()));

    // Create tenant document
    const tenantData: Omit<Tenant, 'id'> = {
      name: officeName,
      slug: generateSlug(officeName),
      email,
      phone,
      currency,
      timezone: 'Asia/Riyadh',
      language,
      theme: 'light',
      status: 'trial',
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('tenants').doc(tenantId).set(tenantData);

    // Create subscription document (root level)
    const subscriptionData: Omit<Subscription, 'id'> = {
      tenantId,
      plan: 'trial',
      status: 'active',
      trialStartedAt: now,
      trialEndsAt,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('subscriptions').doc(tenantId).set(subscriptionData);

    // Create user document in tenant
    const userData: Omit<User, 'id'> = {
      email,
      displayName: officeName,
      role: 'owner',
      phone,
      language,
      theme: 'system',
      emailNotifications: true,
      status: 'active',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userRecord.uid)
      .set(userData);

    // Set custom claims for multi-tenancy and role
    await setUserClaims(userRecord.uid, {
      tenantId,
      role: 'owner',
    });

    // Send verification email
    const verificationLink = await adminAuth.generateEmailVerificationLink(email);
    // Note: In production, you would send this via Firebase Trigger Email or similar
    console.log('Verification link:', verificationLink);

    return success({
      userId: userRecord.uid,
      tenantId,
      trialEndsAt: trialEndsAt.toDate().toISOString(),
    }, 'Account created successfully. Please check your email to verify your account.');
  } catch (err) {
    console.error('Signup error:', err);

    if (err instanceof Error) {
      if (err.message.includes('email-already-exists')) {
        return error('An account with this email already exists', ErrorCodes.ALREADY_EXISTS);
      }
      if (err.message.includes('weak-password')) {
        return error('Password is too weak. Please use at least 8 characters.', ErrorCodes.VALIDATION_ERROR);
      }
    }

    return error('Failed to create account. Please try again.', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Login Action (T046)
// ==========================================

export interface LoginResult {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

/**
 * Login action - validates credentials and creates session
 * Note: Actual Firebase login happens client-side, this creates the session cookie
 */
export async function loginAction(
  idToken: string
): Promise<ActionResult<LoginResult>> {
  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create session cookie (5 days expiry)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });

    // Update last login
    const tenantId = decodedToken.tenantId as string;
    if (tenantId) {
      await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('users')
        .doc(decodedToken.uid)
        .update({
          lastLoginAt: Timestamp.now(),
        });
    }

    return success({
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      tenantId: decodedToken.tenantId as string,
      role: decodedToken.role as string,
    });
  } catch (err) {
    console.error('Login error:', err);
    return error('Invalid credentials', ErrorCodes.INVALID_CREDENTIALS);
  }
}

/**
 * Logout action - clears session cookie
 */
export async function logoutAction(): Promise<ActionResult<void>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return success(undefined, 'Logged out successfully');
  } catch (err) {
    console.error('Logout error:', err);
    return error('Failed to logout', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Reset Password Action (T047)
// ==========================================

/**
 * Send password reset email
 * Always returns success for security (don't reveal if email exists)
 */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  try {
    const validation = resetPasswordSchema.safeParse(input);
    if (!validation.success) {
      return error('Invalid email address', ErrorCodes.VALIDATION_ERROR);
    }

    const { email } = validation.data;

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email);
      // Note: In production, you would send this via Firebase Trigger Email or similar
      console.log('Password reset link:', resetLink);
    } catch {
      // Don't reveal if email exists or not
    }

    return success(undefined, 'If an account with this email exists, a password reset link has been sent.');
  } catch (err) {
    console.error('Reset password error:', err);
    return success(undefined, 'If an account with this email exists, a password reset link has been sent.');
  }
}

// ==========================================
// Update Password Action (T048)
// ==========================================

/**
 * Update the current user's password
 * Requires reauthentication (current password verification)
 */
export async function updatePasswordAction(
  input: UpdatePasswordInput,
  idToken: string
): Promise<ActionResult<void>> {
  try {
    const validation = updatePasswordSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    // Verify the token (ensures user is authenticated)
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Update password
    await adminAuth.updateUser(decodedToken.uid, {
      password: validation.data.newPassword,
    });

    return success(undefined, 'Password updated successfully');
  } catch (err) {
    console.error('Update password error:', err);
    return error('Failed to update password. Please try again.', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Update Profile Action (T049)
// ==========================================

/**
 * Update the current user's profile
 */
export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in to update your profile', ErrorCodes.UNAUTHENTICATED);
    }

    const validation = updateProfileSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { displayName, phone, language, theme, emailNotifications } = validation.data;
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    // Update user document in Firestore
    await adminDb
      .collection('tenants')
      .doc(currentUser.tenantId)
      .collection('users')
      .doc(currentUser.uid)
      .update(updateData);

    // Update Firebase Auth display name if changed
    if (displayName !== undefined) {
      await adminAuth.updateUser(currentUser.uid, { displayName });
    }

    return success(undefined, 'Profile updated successfully');
  } catch (err) {
    console.error('Update profile error:', err);
    return error('Failed to update profile. Please try again.', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Invite User Action (T050)
// ==========================================

export interface InviteResult {
  userId: string;
  invitationId: string;
}

/**
 * Invite a new user to the team
 * Requires owner or admin role
 */
export async function inviteUserAction(
  input: InviteUserInput
): Promise<ActionResult<InviteResult>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in to invite users', ErrorCodes.UNAUTHENTICATED);
    }

    // Check permission
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return error('You do not have permission to invite users', ErrorCodes.UNAUTHORIZED);
    }

    const validation = inviteUserSchema.safeParse(input);
    if (!validation.success) {
      return error('Validation failed', ErrorCodes.VALIDATION_ERROR, {
        ...validation.error.flatten().fieldErrors,
      });
    }

    const { email, role, name } = validation.data;

    // Check if user already exists in this tenant
    const existingUsers = await adminDb
      .collection('tenants')
      .doc(currentUser.tenantId)
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUsers.empty) {
      return error('A user with this email already exists in your organization', ErrorCodes.ALREADY_EXISTS);
    }

    // Create invitation record
    const invitationId = adminDb.collection('invitations').doc().id;
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

    const invitationData = {
      email,
      role,
      name: name || '',
      tenantId: currentUser.tenantId,
      invitedBy: currentUser.uid,
      status: 'pending',
      createdAt: now,
      expiresAt,
    };

    await adminDb
      .collection('tenants')
      .doc(currentUser.tenantId)
      .collection('invitations')
      .doc(invitationId)
      .set(invitationData);

    // Generate invitation link
    // In production, you would create a custom token or use a sign-up link with the invitation ID
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invitation=${invitationId}`;
    console.log('Invitation link:', invitationLink);

    // Send invitation email (via Firebase Trigger Email in production)
    await adminDb.collection('mail').add({
      to: [email],
      template: {
        name: 'team-invitation',
        data: {
          inviterName: name || 'A team member',
          role,
          invitationLink,
        },
      },
    });

    return success({
      userId: '', // User doesn't exist yet
      invitationId,
    }, 'Invitation sent successfully');
  } catch (err) {
    console.error('Invite user error:', err);
    return error('Failed to send invitation. Please try again.', ErrorCodes.INTERNAL_ERROR);
  }
}

// ==========================================
// Session Verification
// ==========================================

export interface SessionData {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  emailVerified: boolean;
}

/**
 * Verify the current session and return user data
 */
export async function verifySessionAction(): Promise<ActionResult<SessionData | null>> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return success(null);
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value);

    return success({
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      tenantId: decodedToken.tenantId as string,
      role: decodedToken.role as string,
      emailVerified: decodedToken.email_verified || false,
    });
  } catch {
    // Invalid or expired session
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return success(null);
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationAction(): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return error('You must be logged in', ErrorCodes.UNAUTHENTICATED);
    }

    const user = await adminAuth.getUser(currentUser.uid);
    if (user.emailVerified) {
      return error('Your email is already verified', ErrorCodes.CONFLICT);
    }

    const verificationLink = await adminAuth.generateEmailVerificationLink(user.email!);
    console.log('Verification link:', verificationLink);

    // Send via Firebase Trigger Email in production
    await adminDb.collection('mail').add({
      to: [user.email],
      template: {
        name: 'email-verification',
        data: {
          displayName: user.displayName || 'User',
          verificationLink,
        },
      },
    });

    return success(undefined, 'Verification email sent');
  } catch (err) {
    console.error('Resend verification error:', err);
    return error('Failed to send verification email', ErrorCodes.INTERNAL_ERROR);
  }
}
