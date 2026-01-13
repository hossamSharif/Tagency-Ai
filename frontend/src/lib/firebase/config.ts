import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase (singleton pattern)
 */
function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  const existingApps = getApps();

  const app = existingApps.length === 0
    ? initializeApp(firebaseConfig)
    : existingApps[0];

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

// Initialize on module load and export
const firebase = initializeFirebase();

export const firebaseApp = firebase.app;
export const auth = firebase.auth;
export const db = firebase.db;
export const storage = firebase.storage;

export default firebase;
