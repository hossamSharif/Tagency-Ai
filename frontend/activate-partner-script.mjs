import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json'), 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function activatePartner() {
  try {
    const tenantsSnapshot = await db.collection('tenants').get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      const partnersSnapshot = await db
        .collection('tenants')
        .doc(tenantDoc.id)
        .collection('partnerOffices')
        .where('name', '==', 'Galaxy Travel Agency')
        .get();

      if (!partnersSnapshot.empty) {
        const partnerDoc = partnersSnapshot.docs[0];
        console.log('Found partner:', partnerDoc.id, partnerDoc.data().name);

        await db
          .collection('tenants')
          .doc(tenantDoc.id)
          .collection('partnerOffices')
          .doc(partnerDoc.id)
          .update({
            status: 'active',
            updatedAt: admin.firestore.Timestamp.now()
          });

        console.log('Partner activated successfully!');
        console.log('Partner ID:', partnerDoc.id);
        console.log('New status: active');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

activatePartner().then(() => process.exit(0));
