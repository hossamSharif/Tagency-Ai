const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Expected chart of accounts based on spec
const EXPECTED_ACCOUNTS = {
  asset: [
    { code: '1001', name: 'Cash' },
    { code: '1002', name: 'Bank' },
    { codeRange: ['1200', '1299'], name: 'Accounts Receivable (Customer AR)' }
  ],
  liability: [
    { codeRange: ['2100', '2199'], name: 'Accounts Payable (Partner AP)' }
  ],
  income: [
    { code: '4001', name: 'Service Revenue' }
  ],
  expense: [
    { code: '5001', name: 'General Expenses' },
    { code: '5002', name: 'Rent' },
    { code: '5003', name: 'Utilities' },
    { code: '5004', name: 'Supplies' }
  ]
};

async function auditChartOfAccounts() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== CHART OF ACCOUNTS AUDIT ===\n');
    console.log(`Tenant: ${tenantId}\n`);

    // Get all accounts
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

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group by type
    const accountsByType = {};
    accounts.forEach(account => {
      const type = account.type || 'unknown';
      if (!accountsByType[type]) {
        accountsByType[type] = [];
      }
      accountsByType[type].push(account);
    });

    // Audit each type
    const issues = [];

    console.log('=== ASSETS ===\n');
    const assetAccounts = accountsByType['asset'] || [];
    console.log(`Found: ${assetAccounts.length} accounts\n`);

    // Check for required cash/bank accounts
    const cashAccount = accounts.find(a => a.code === '1001');
    if (cashAccount) {
      console.log(`✅ 1001 - ${cashAccount.name} (Balance: ${cashAccount.balance || 0})`);
    } else {
      console.log('❌ 1001 - Cash account missing');
      issues.push('Missing required account: 1001 Cash');
    }

    const bankAccount = accounts.find(a => a.code === '1002');
    if (bankAccount) {
      console.log(`✅ 1002 - ${bankAccount.name} (Balance: ${bankAccount.balance || 0})`);
    } else {
      console.log('❌ 1002 - Bank account missing');
      issues.push('Missing required account: 1002 Bank');
    }

    // Check for customer AR accounts (should be in range 1200-1299)
    const arAccounts = accounts.filter(a =>
      (a.code >= '1200' && a.code < '1300') ||
      (a.name && a.name.includes('Receivable') && a.linkedEntityId)
    );

    console.log(`\nCustomer AR Accounts: ${arAccounts.length}`);
    if (arAccounts.length === 0) {
      console.log('⚠️  No customer AR accounts in standard range (1200-1299)');

      // Check for AR accounts with wrong codes
      const wrongCodeAR = accounts.filter(a =>
        a.name && a.name.includes('Receivable') && a.linkedEntityId
      );
      if (wrongCodeAR.length > 0) {
        console.log(`⚠️  Found ${wrongCodeAR.length} AR accounts with non-standard codes:`);
        wrongCodeAR.forEach(a => {
          console.log(`   ${a.code} - ${a.name} (Should be 1200-1299)`);
          issues.push(`Account ${a.code} (${a.name}) should be in range 1200-1299`);
        });
      }
    } else {
      arAccounts.forEach(a => {
        console.log(`✅ ${a.code} - ${a.name}`);
        if (a.linkedEntityId) {
          console.log(`   Linked to: ${a.linkedEntityId}`);
        }
        console.log(`   Balance: ${a.balance || 0}`);
      });
    }

    console.log('\n=== LIABILITIES ===\n');
    const liabilityAccounts = accountsByType['liability'] || [];
    console.log(`Found: ${liabilityAccounts.length} accounts\n`);

    // Check for partner AP accounts (should be in range 2100-2199)
    const apAccounts = accounts.filter(a =>
      (a.code >= '2100' && a.code < '2200') ||
      (a.name && a.name.includes('Payable') && a.linkedEntityId)
    );

    console.log(`Partner AP Accounts: ${apAccounts.length}`);
    if (apAccounts.length === 0) {
      console.log('ℹ️  No partner AP accounts (expected if no partners yet)');
    } else {
      apAccounts.forEach(a => {
        console.log(`✅ ${a.code} - ${a.name}`);
        if (a.linkedEntityId) {
          console.log(`   Linked to: ${a.linkedEntityId}`);
        }
        console.log(`   Balance: ${a.balance || 0}`);
      });
    }

    console.log('\n=== INCOME ===\n');
    const incomeAccounts = accountsByType['income'] || [];
    console.log(`Found: ${incomeAccounts.length} accounts\n`);

    const serviceRevenue = accounts.find(a => a.code === '4001');
    if (serviceRevenue) {
      console.log(`✅ 4001 - ${serviceRevenue.name} (Balance: ${serviceRevenue.balance || 0})`);
    } else {
      console.log('❌ 4001 - Service Revenue account missing');
      issues.push('Missing required account: 4001 Service Revenue');
    }

    console.log('\n=== EXPENSES ===\n');
    const expenseAccounts = accountsByType['expense'] || [];
    console.log(`Found: ${expenseAccounts.length} accounts\n`);

    const expectedExpenses = ['5001', '5002', '5003', '5004'];
    const expectedNames = ['General Expenses', 'Rent', 'Utilities', 'Supplies'];

    expectedExpenses.forEach((code, i) => {
      const account = accounts.find(a => a.code === code);
      if (account) {
        console.log(`✅ ${code} - ${account.name} (Balance: ${account.balance || 0})`);
      } else {
        console.log(`⚠️  ${code} - ${expectedNames[i]} missing (optional)`);
      }
    });

    // Check for unknown account types
    console.log('\n=== OTHER/UNKNOWN ===\n');
    const unknownAccounts = accountsByType['unknown'] || [];
    if (unknownAccounts.length > 0) {
      console.log(`❌ Found ${unknownAccounts.length} accounts with unknown type:`);
      unknownAccounts.forEach(a => {
        console.log(`   ${a.code} - ${a.name}`);
        issues.push(`Account ${a.code} has unknown type`);
      });
    } else {
      console.log('✅ No accounts with unknown types');
    }

    // Balance check
    console.log('\n=== BALANCE VERIFICATION ===\n');
    let totalDebits = 0;
    let totalCredits = 0;

    accounts.forEach(account => {
      const balance = account.balance || 0;
      if (account.type === 'asset' || account.type === 'expense') {
        // Debit normal balance
        totalDebits += Math.abs(balance);
      } else if (account.type === 'liability' || account.type === 'income') {
        // Credit normal balance
        totalCredits += Math.abs(balance);
      }
    });

    console.log(`Total Debits (Assets + Expenses): ${totalDebits}`);
    console.log(`Total Credits (Liabilities + Income): ${totalCredits}`);

    if (Math.abs(totalDebits - totalCredits) < 0.01) {
      console.log('✅ Accounting equation balanced');
    } else {
      console.log(`⚠️  Imbalance: ${Math.abs(totalDebits - totalCredits)}`);
      console.log('   Note: May be normal if journal entries incomplete (BUG-010)');
    }

    // Summary
    console.log('\n=== AUDIT SUMMARY ===\n');
    console.log(`Total Accounts: ${accounts.length}`);
    console.log(`- Assets: ${assetAccounts.length}`);
    console.log(`- Liabilities: ${liabilityAccounts.length}`);
    console.log(`- Income: ${incomeAccounts.length}`);
    console.log(`- Expenses: ${expenseAccounts.length}`);
    console.log(`- Unknown: ${unknownAccounts.length}`);

    if (issues.length > 0) {
      console.log(`\n⚠️  Issues Found: ${issues.length}\n`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No structural issues found');
    }

    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. Update Customer AR accounts to use code range 1200-1299');
    console.log('2. Ensure all partner AP accounts use code range 2100-2199');
    console.log('3. Fix BUG-010 to ensure journal entries create and maintain balance');

  } catch (error) {
    console.error('Error:', error);
  }
}

auditChartOfAccounts().then(() => process.exit(0));
