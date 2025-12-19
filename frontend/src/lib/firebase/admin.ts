import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Firebase Admin configuration from environment variables
const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 * This should only be used in server-side code (API routes, server actions)
 */
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(adminConfig),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

  return { adminApp, adminAuth, adminDb, adminStorage };
}

// Initialize on module load
const admin = initializeFirebaseAdmin();

export const { adminApp, adminAuth, adminDb, adminStorage } = admin;

/**
 * Set custom claims on a user (for role-based access and multi-tenancy)
 */
export async function setUserClaims(
  uid: string,
  claims: {
    tenantId?: string;
    role?: string;
    partnerOfficeId?: string;
    platformAdmin?: boolean;
  }
): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, claims);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return adminAuth.getUserByEmail(email);
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  return adminAuth.getUser(uid);
}

/**
 * Verify an ID token and return the decoded token
 */
export async function verifyIdToken(idToken: string) {
  return adminAuth.verifyIdToken(idToken);
}

/**
 * Create a custom token for a user
 */
export async function createCustomToken(uid: string, additionalClaims?: object) {
  return adminAuth.createCustomToken(uid, additionalClaims);
}

/**
 * Delete a user by UID
 */
export async function deleteUser(uid: string) {
  return adminAuth.deleteUser(uid);
}

/**
 * Update a user's properties
 */
export async function updateUser(
  uid: string,
  properties: {
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    disabled?: boolean;
  }
) {
  return adminAuth.updateUser(uid, properties);
}
