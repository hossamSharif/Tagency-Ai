import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';

// Firebase Admin configuration from environment variables
const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Try to load service account from file (development fallback)
let serviceAccount: any = null;
try {
  const serviceAccountPath = path.join(process.cwd(), '..', 'tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');
  console.log('🔍 Looking for service account at:', serviceAccountPath);
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ Service account loaded from file');
  } else {
    console.log('❌ Service account file not found');
  }
} catch (error) {
  console.error('❌ Error loading service account file:', error);
}

/**
 * Check if Firebase Admin credentials are properly configured
 */
function hasValidCredentials(): boolean {
  // Check if service account file is available
  if (serviceAccount) {
    console.log('✅ Using service account from file');
    return true;
  }

  // Otherwise check env variables
  const hasEnvVars = !!(
    adminConfig.projectId &&
    adminConfig.clientEmail &&
    adminConfig.privateKey &&
    adminConfig.privateKey.length > 0
  );

  console.log('🔍 Environment variables check:', {
    hasProjectId: !!adminConfig.projectId,
    hasClientEmail: !!adminConfig.clientEmail,
    hasPrivateKey: !!adminConfig.privateKey,
    privateKeyLength: adminConfig.privateKey?.length || 0
  });

  if (hasEnvVars) {
    console.log('✅ Using credentials from environment variables');
  } else {
    console.log('❌ No valid credentials found');
  }

  return hasEnvVars;
}

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 * This should only be used in server-side code (API routes, server actions)
 */
function initializeFirebaseAdmin(): { adminApp: App; adminAuth: Auth; adminDb: Firestore; adminStorage: Storage } {
  const existingApps = getApps();

  if (!hasValidCredentials()) {
    console.warn(
      '⚠️ Firebase Admin SDK credentials are not configured.\n' +
      'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local\n' +
      'To get these credentials:\n' +
      '1. Go to Firebase Console > Project Settings > Service Accounts\n' +
      '2. Click "Generate new private key"\n' +
      '3. Copy the values to your .env.local file'
    );
    // Initialize without credentials for development (limited functionality)
    const app = existingApps.length === 0
      ? initializeApp({
          projectId: adminConfig.projectId || 'demo-project',
        })
      : existingApps[0];

    return {
      adminApp: app,
      adminAuth: getAuth(app),
      adminDb: getFirestore(app),
      adminStorage: getStorage(app),
    };
  }

  // Use service account file if available, otherwise use env variables
  const credential = serviceAccount
    ? cert(serviceAccount)
    : cert(adminConfig);

  // IMPORTANT: Only reuse existing app if it was initialized with credentials
  // If we have credentials now but the existing app doesn't, we need to reinitialize
  let app: App;
  if (existingApps.length === 0) {
    console.log('🔧 Initializing Firebase Admin SDK with credentials');
    app = initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Reuse existing app (assumes it was initialized with credentials)
    console.log('♻️ Reusing existing Firebase Admin SDK app');
    app = existingApps[0];
  }

  return {
    adminApp: app,
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
    adminStorage: getStorage(app),
  };
}

// Initialize on module load and export
export const { adminApp, adminAuth, adminDb, adminStorage } = initializeFirebaseAdmin();

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
