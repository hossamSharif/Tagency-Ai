/**
 * Script to fix user custom claims
 * Run with: npx tsx scripts/fix-user-claims.ts <email>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/fix-user-claims.ts <email>');
  process.exit(1);
}

async function fixUserClaims(userEmail: string) {
  try {
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
      }),
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`Looking up user: ${userEmail}`);

    // Get user by email
    const userRecord = await auth.getUserByEmail(userEmail);
    console.log(`Found user: ${userRecord.uid}`);

    // Use uid as tenantId (same pattern as signup)
    const tenantId = userRecord.uid;

    // Check if tenant exists
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.log(`Tenant ${tenantId} not found. Creating tenant document...`);

      // Create minimal tenant document
      await db.collection('tenants').doc(tenantId).set({
        name: userRecord.displayName || 'Travel Agency',
        email: userEmail,
        status: 'trial',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Tenant document created');
    }

    // Check if user document exists in tenant
    const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      console.log(`User document not found in tenant. Creating...`);

      await db.collection('tenants').doc(tenantId).collection('users').doc(userRecord.uid).set({
        email: userEmail,
        displayName: userRecord.displayName || 'Admin',
        role: 'owner',
        status: 'active',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('User document created');
    }

    // Set custom claims
    console.log(`Setting custom claims for user ${userRecord.uid}...`);
    await auth.setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'owner',
    });

    console.log('✅ Custom claims set successfully!');
    console.log('Custom claims:', { tenantId, role: 'owner' });
    console.log('User can now log in with their credentials');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing user claims:', error);
    process.exit(1);
  }
}

fixUserClaims(email);
