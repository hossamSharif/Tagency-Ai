> Build error occurred
Error: Turbopack build failed with 18 errors:
./frontend/src/app/[locale]/(public)

You cannot have two parallel pages that resolve to the same path. Please check /[:locale]/

./frontend/src/lib/firebase/admin.ts:24:5
Ecmascript file had an error
  22 | function initializeFirebaseAdmin() {
  23 |   if (getApps().length === 0) {
> 24 |     adminApp = initializeApp({
     |     ^^^^^^^^
  25 |       credential: cert(adminConfig),
  26 |       storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  27 |     });

cannot reassign to a variable declared with `const`

./frontend/src/lib/firebase/admin.ts:29:5
Ecmascript file had an error
  27 |   });
  28 |   } else {
> 29 |     adminApp = getApps()[0];
     |     ^^^^^^^^
cannot reassign to a variable declared with `const`

./frontend/src/lib/firebase/admin.ts:32:3
Ecmascript file had an error
  30 |   }
  31 |
> 32 |   adminAuth = getAuth(adminApp);
     |   ^^^^^^^^^
cannot reassign to a variable declared with `const`

./frontend/src/lib/firebase/admin.ts:33:3
Ecmascript file had an error
  33 |   adminDb = getFirestore(adminApp);
     |   ^^^^^^^
cannot reassign to a variable declared with `const`

./frontend/src/lib/firebase/admin.ts:34:3
Ecmascript file had an error
  34 |   adminStorage = getStorage(adminApp);
     |   ^^^^^^^^^^^^^
cannot reassign to a variable declared with `const`

./frontend/src/app/actions/notifications.ts:10:1
Export verifySessionCookie doesn't exist in target module
  8 |
  9 | import { cookies } from 'next/headers';
> 10 | import { adminDb, verifySessionCookie, getCurrrentUserFromCookie } from '@/:
     |          ^^^^^^^^^^^^^^^^^^^^^^^^

Error: Command "npm run build" exited with 1