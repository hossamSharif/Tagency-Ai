const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listAccounts() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== All Accounts in System ===\n');

    const accountsSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('accounts')
      .get();

    if (accountsSnapshot.empty) {
      console.log('❌ No accounts found in system');
      return;
    }

    console.log(`Total Accounts: ${accountsSnapshot.size}\n`);

    const accountsByType = {};

    accountsSnapshot.docs.forEach(doc => {
      const account = doc.data();
      const type = account.type || 'unknown';

      if (!accountsByType[type]) {
        accountsByType[type] = [];
      }

      accountsByType[type].push({
        code: account.code,
        name: account.name,
        balance: account.balance || 0,
        linkedEntityId: account.linkedEntityId || null
      });
    });

    // Sort and display by account type
    Object.keys(accountsByType).sort().forEach(type => {
      console.log(`\n${type.toUpperCase()} ACCOUNTS:`);
      accountsByType[type]
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach(account => {
          console.log(`  ${account.code} - ${account.name}`);
          console.log(`    Balance: ${account.balance} SDG`);
          if (account.linkedEntityId) {
            console.log(`    Linked Entity: ${account.linkedEntityId}`);
          }
        });
    });

    // Specifically check for customer receivable accounts (1200-1299)
    const customerAccounts = accountsSnapshot.docs
      .map(doc => doc.data())
      .filter(account => account.code >= '1200' && account.code < '1300');

    console.log('\n\n=== CUSTOMER RECEIVABLE ACCOUNTS (1200-1299) ===');
    if (customerAccounts.length === 0) {
      console.log('❌ No customer receivable accounts found');
      console.log('   This explains why payment test failed');
      console.log('   Customer accounts should be auto-created when:');
      console.log('   - Invoice created for customer');
      console.log('   - Payment recorded from customer');
    } else {
      console.log(`Total: ${customerAccounts.length}\n`);
      customerAccounts.forEach(account => {
        console.log(`${account.code} - ${account.name}`);
        console.log(`  Balance: ${account.balance || 0} SDG`);
        console.log(`  Linked Customer: ${account.linkedEntityId || 'None'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listAccounts().then(() => process.exit(0));
