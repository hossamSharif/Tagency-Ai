import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
  UserCredential,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Send email verification
  if (userCredential.user) {
    await sendEmailVerification(userCredential.user);
  }

  return userCredential;
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user's ID token with custom claims
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

/**
 * Get the current user's ID token result with claims
 */
export async function getIdTokenResult(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdTokenResult(forceRefresh);
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(updates: {
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in');
  return updateProfile(user, updates);
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in');
  return sendEmailVerification(user);
}
