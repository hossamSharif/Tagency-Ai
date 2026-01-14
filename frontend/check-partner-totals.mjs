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

async function checkPartnerTotals() {
  try {
    const tenantsSnapshot = await db.collection('tenants').get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      console.log('\n=== Tenant:', tenantDoc.id, '===\n');

      // Get Galaxy Travel Agency partner
      const partnersSnapshot = await db
        .collection('tenants')
        .doc(tenantDoc.id)
        .collection('partnerOffices')
        .where('name', '==', 'Galaxy Travel Agency')
        .get();

      if (!partnersSnapshot.empty) {
        const partnerDoc = partnersSnapshot.docs[0];
        const data = partnerDoc.data();
        console.log('Partner ID:', partnerDoc.id);
        console.log('Partner Name:', data.name);
        console.log('Pending Commissions:', data.pendingCommissions);
        console.log('Total Commissions Earned:', data.totalCommissionsEarned);
        console.log('Paid Commissions:', data.paidCommissions);
        console.log('Updated At:', data.updatedAt?.toDate());
      }

      // Get invoice INV-2026-0003
      const invoicesSnapshot = await db
        .collection('tenants')
        .doc(tenantDoc.id)
        .collection('invoices')
        .where('invoiceNumber', '==', 'INV-2026-0003')
        .get();

      if (!invoicesSnapshot.empty) {
        const invoiceDoc = invoicesSnapshot.docs[0];
        const data = invoiceDoc.data();
        console.log('\n=== Invoice INV-2026-0003 ===');
        console.log('Invoice ID:', invoiceDoc.id);
        console.log('Status:', data.status);
        console.log('Total:', data.total);
        console.log('Currency:', data.currency);
        console.log('Commissions by Partner:', JSON.stringify(data.commissionsByPartner, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPartnerTotals().then(() => process.exit(0));
