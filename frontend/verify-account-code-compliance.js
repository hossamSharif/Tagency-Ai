const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Account Code Standards:
 * 1000-1999: Assets
 *   1000-1099: Current Assets (Cash, Bank)
 *   1200-1299: Accounts Receivable (Customer AR)
 *   1300-1399: Prepaid Expenses
 * 2000-2999: Liabilities
 *   2000-2099: Current Liabilities
 *   2100-2199: Accounts Payable (Partner AP)
 * 3000-3999: Equity
 * 4000-4999: Income/Revenue
 * 5000-5999: Expenses
 */

async function verifyAccountCodeCompliance() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== ACCOUNT CODE COMPLIANCE VERIFICATION ===\n');
    console.log(`Tenant: ${tenantId}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    const results = {
      pass: 0,
      fail: 0,
      warn: 0
    };

    // Get all accounts
    const accountsSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('accounts').get();

    console.log(`Total Accounts: ${accountsSnapshot.size}\n`);

    if (accountsSnapshot.empty) {
      console.log('⏸️  SKIP: No accounts found');
      return;
    }

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.code.localeCompare(b.code));

    // ===================================================================
    // 1. ACCOUNT CODE FORMAT
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. ACCOUNT CODE FORMAT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let formatValid = true;
    accounts.forEach(account => {
      const code = account.code;

      // Check if code is 4-digit number
      if (!/^\d{4}$/.test(code)) {
        console.log(`❌ ${code} - ${account.name}: Invalid format (expected 4 digits)`);
        formatValid = false;
      }
    });

    if (formatValid) {
      console.log('✅ All account codes are 4-digit numbers\n');
      results.pass++;
    } else {
      console.log('\n❌ Some account codes have invalid format\n');
      results.fail++;
    }

    // ===================================================================
    // 2. ACCOUNT TYPE vs CODE RANGE
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. ACCOUNT TYPE vs CODE RANGE COMPLIANCE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const codeRangeMap = {
      'asset': { min: 1000, max: 1999, label: '1000-1999' },
      'liability': { min: 2000, max: 2999, label: '2000-2999' },
      'equity': { min: 3000, max: 3999, label: '3000-3999' },
      'income': { min: 4000, max: 4999, label: '4000-4999' },
      'expense': { min: 5000, max: 5999, label: '5000-5999' }
    };

    let typeRangeValid = true;

    accounts.forEach(account => {
      const code = parseInt(account.code);
      const type = account.type;
      const range = codeRangeMap[type];

      if (!range) {
        console.log(`⚠️  ${account.code} - ${account.name}: Unknown type "${type}"`);
        typeRangeValid = false;
        return;
      }

      if (code < range.min || code > range.max) {
        console.log(`❌ ${account.code} - ${account.name}:`);
        console.log(`   Type: ${type}`);
        console.log(`   Expected Range: ${range.label}`);
        console.log(`   Issue: Code outside standard range for ${type} accounts`);
        typeRangeValid = false;
      }
    });

    if (typeRangeValid) {
      console.log('✅ All accounts have codes within correct range for their type\n');
      results.pass++;
    } else {
      console.log('\n❌ Some accounts have codes outside their type range\n');
      results.fail++;
    }

    // ===================================================================
    // 3. SPECIALIZED ACCOUNT CODES
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. SPECIALIZED ACCOUNT CODE COMPLIANCE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check Customer AR accounts (should be 1200-1299)
    const customerARAccounts = accounts.filter(a =>
      a.linkedEntityType === 'customer' ||
      a.name.toLowerCase().includes('receivable') ||
      a.name.toLowerCase().includes('customer')
    );

    console.log(`Customer AR Accounts Found: ${customerARAccounts.length}\n`);

    let customerARValid = true;
    customerARAccounts.forEach(account => {
      const code = parseInt(account.code);

      if (code < 1200 || code > 1299) {
        console.log(`❌ ${account.code} - ${account.name}:`);
        console.log(`   Issue: Customer AR should use codes 1200-1299`);
        console.log(`   Current: ${account.code} (${account.type})`);
        customerARValid = false;
      } else {
        console.log(`✅ ${account.code} - ${account.name}: Compliant`);
      }
    });

    if (customerARAccounts.length === 0) {
      console.log('⚠️  No customer AR accounts found\n');
      results.warn++;
    } else if (customerARValid) {
      console.log('\n✅ All customer AR accounts use correct code range (1200-1299)\n');
      results.pass++;
    } else {
      console.log('\n❌ Some customer AR accounts use incorrect code range\n');
      results.fail++;
    }

    // Check Partner AP accounts (should be 2100-2199)
    const partnerAPAccounts = accounts.filter(a =>
      a.linkedEntityType === 'partner' ||
      a.name.toLowerCase().includes('payable') ||
      a.name.toLowerCase().includes('partner')
    );

    console.log(`Partner AP Accounts Found: ${partnerAPAccounts.length}\n`);

    let partnerAPValid = true;
    partnerAPAccounts.forEach(account => {
      const code = parseInt(account.code);

      if (code < 2100 || code > 2199) {
        console.log(`❌ ${account.code} - ${account.name}:`);
        console.log(`   Issue: Partner AP should use codes 2100-2199`);
        console.log(`   Current: ${account.code} (${account.type})`);
        partnerAPValid = false;
      } else {
        console.log(`✅ ${account.code} - ${account.name}: Compliant`);
      }
    });

    if (partnerAPAccounts.length === 0) {
      console.log('⚠️  No partner AP accounts found\n');
      results.warn++;
    } else if (partnerAPValid) {
      console.log('\n✅ All partner AP accounts use correct code range (2100-2199)\n');
      results.pass++;
    } else {
      console.log('\n❌ Some partner AP accounts use incorrect code range\n');
      results.fail++;
    }

    // ===================================================================
    // 4. ACCOUNT LIST
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. COMPLETE ACCOUNT LIST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const groupedAccounts = {
      'Assets (1000-1999)': [],
      'Liabilities (2000-2999)': [],
      'Equity (3000-3999)': [],
      'Income (4000-4999)': [],
      'Expenses (5000-5999)': []
    };

    accounts.forEach(account => {
      const code = parseInt(account.code);

      if (code >= 1000 && code <= 1999) {
        groupedAccounts['Assets (1000-1999)'].push(account);
      } else if (code >= 2000 && code <= 2999) {
        groupedAccounts['Liabilities (2000-2999)'].push(account);
      } else if (code >= 3000 && code <= 3999) {
        groupedAccounts['Equity (3000-3999)'].push(account);
      } else if (code >= 4000 && code <= 4999) {
        groupedAccounts['Income (4000-4999)'].push(account);
      } else if (code >= 5000 && code <= 5999) {
        groupedAccounts['Expenses (5000-5999)'].push(account);
      }
    });

    Object.keys(groupedAccounts).forEach(group => {
      const accts = groupedAccounts[group];

      if (accts.length > 0) {
        console.log(`\n${group}:`);
        accts.forEach(account => {
          const linkInfo = account.linkedEntityType
            ? ` [${account.linkedEntityType}${account.linkedEntityId ? `: ${account.linkedEntityId.substring(0, 8)}...` : ''}]`
            : '';
          console.log(`  ${account.code} - ${account.name}${linkInfo}`);
        });
      }
    });

    // ===================================================================
    // SUMMARY
    // ===================================================================
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACCOUNT CODE COMPLIANCE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalChecks = results.pass + results.fail + results.warn;
    const score = results.fail === 0 ? 100 : ((results.pass / (totalChecks - results.warn)) * 100).toFixed(1);

    console.log(`Total Checks: ${totalChecks}`);
    console.log(`  ✅ Passed: ${results.pass}`);
    console.log(`  ❌ Failed: ${results.fail}`);
    console.log(`  ⚠️  Warnings: ${results.warn}`);
    console.log();
    console.log(`Compliance Score: ${score}%`);
    console.log();

    if (results.fail === 0) {
      console.log('✅ COMPLIANT: All account codes follow standards');
    } else {
      console.log('❌ NON-COMPLIANT: Some account codes violate standards');
      console.log('\nRecommendations:');
      console.log('1. Migrate Customer AR accounts to 1200-1299 range');
      console.log('2. Migrate Partner AP accounts to 2100-2199 range');
      console.log('3. Update all references to old account codes');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyAccountCodeCompliance().then(() => process.exit(0));
