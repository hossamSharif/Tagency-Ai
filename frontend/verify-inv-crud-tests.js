const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyInvCrudTests() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== INVOICE CRUD TESTS (Firebase Verification) ===\n');

    // ===================================================================
    // Get all invoices
    // ===================================================================
    const invoicesSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('invoices')
      .get();

    console.log(`Total Invoices: ${invoicesSnapshot.size}\n`);

    if (invoicesSnapshot.empty) {
      console.log('⏸️  SKIP: No invoices found to verify');
      return;
    }

    const invoices = invoicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Display all invoices
    console.log('=== INVOICES OVERVIEW ===\n');
    invoices.forEach((invoice, i) => {
      console.log(`${i + 1}. ${invoice.invoiceNumber || 'NO-NUMBER'}`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   Customer ID: ${invoice.customerId || 'N/A'}`);
      console.log(`   Total: ${invoice.total} ${invoice.currency}`);
      console.log(`   Services: ${invoice.services ? invoice.services.length : 0}`);
      console.log(`   Issue Date: ${invoice.issueDate ? invoice.issueDate.toDate().toISOString().split('T')[0] : 'N/A'}`);
      console.log();
    });

    // ===================================================================
    // INV-NEW-CRUD-7: Journal Entry on Invoice Issue
    // ===================================================================
    console.log('=== INV-NEW-CRUD-7: Journal Entry on Invoice Issue ===\n');

    // Get all journal entries for invoices
    const journalSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('journalEntries')
      .where('sourceType', '==', 'invoice')
      .get();

    console.log(`Invoice Journal Entries Found: ${journalSnapshot.size}\n`);

    // Check each issued/paid invoice has a journal entry
    const issuedInvoices = invoices.filter(inv =>
      inv.status === 'issued' || inv.status === 'paid' || inv.status === 'partiallyPaid'
    );

    console.log(`Issued/Paid Invoices: ${issuedInvoices.length}\n`);

    let invoicesWithJournal = 0;
    let invoicesWithoutJournal = 0;

    for (const invoice of issuedInvoices) {
      // Find matching journal entry by amount
      const matchingEntry = journalSnapshot.docs.find(doc => {
        const entry = doc.data();
        if (!entry.lines) return false;

        // Check if total matches invoice total
        const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        return Math.abs(totalDebit - invoice.total) < 0.01;
      });

      if (matchingEntry) {
        const entry = matchingEntry.data();
        console.log(`✅ ${invoice.invoiceNumber}: Journal entry ${entry.entryNumber}`);

        // Verify journal structure
        let hasCustomerDebit = false;
        let hasIncomeCredit = false;

        entry.lines.forEach(line => {
          // Customer AR should be debited (account 12xx or 2xxx for customer AR)
          if ((line.accountCode.startsWith('12') || line.accountCode.startsWith('2')) && line.debit > 0) {
            hasCustomerDebit = true;
          }
          // Income should be credited (account 4xxx)
          if (line.accountCode.startsWith('4') && line.credit > 0) {
            hasIncomeCredit = true;
          }
        });

        if (hasCustomerDebit && hasIncomeCredit) {
          console.log(`   Structure: ✅ DR: Customer AR, CR: Income`);
        } else {
          console.log(`   Structure: ⚠️  Incorrect - DR: ${hasCustomerDebit ? 'Customer' : 'MISSING'}, CR: ${hasIncomeCredit ? 'Income' : 'MISSING'}`);
        }

        invoicesWithJournal++;
      } else {
        console.log(`❌ ${invoice.invoiceNumber}: No journal entry found`);
        invoicesWithoutJournal++;
      }
    }

    console.log(`\nJournal Entry Coverage:`);
    console.log(`  With journal: ${invoicesWithJournal}/${issuedInvoices.length}`);
    console.log(`  Without journal: ${invoicesWithoutJournal}/${issuedInvoices.length}`);

    const journalTestPassed = invoicesWithoutJournal === 0 && issuedInvoices.length > 0;

    if (journalTestPassed) {
      console.log('\n✅ INV-NEW-CRUD-7 PASSED: All issued invoices have journal entries\n');
    } else if (invoicesWithJournal > 0) {
      console.log('\n⚠️  INV-NEW-CRUD-7 PARTIAL: Some invoices have journal entries\n');
    } else {
      console.log('\n❌ INV-NEW-CRUD-7 FAILED: Invoices missing journal entries\n');
    }

    // ===================================================================
    // Invoice Data Structure Validation
    // ===================================================================
    console.log('=== INVOICE DATA STRUCTURE VALIDATION ===\n');

    const requiredFields = [
      'invoiceNumber',
      'customerId',
      'total',
      'currency',
      'status',
      'services',
      'issueDate'
    ];

    let allInvoicesValid = true;

    invoices.forEach((invoice, i) => {
      const missing = requiredFields.filter(field => !invoice[field]);

      if (missing.length > 0) {
        console.log(`⚠️  Invoice ${i + 1} (${invoice.invoiceNumber || 'NO-NUMBER'}) missing fields: ${missing.join(', ')}`);
        allInvoicesValid = false;
      }

      // Validate services array
      if (invoice.services) {
        if (!Array.isArray(invoice.services)) {
          console.log(`❌ Invoice ${i + 1}: services is not an array`);
          allInvoicesValid = false;
        } else if (invoice.services.length === 0) {
          console.log(`⚠️  Invoice ${i + 1}: services array is empty`);
          allInvoicesValid = false;
        } else {
          // Validate each service line item
          invoice.services.forEach((service, si) => {
            const serviceRequired = ['serviceId', 'quantity', 'unitPrice'];
            const serviceMissing = serviceRequired.filter(f => service[f] === undefined);

            if (serviceMissing.length > 0) {
              console.log(`⚠️  Invoice ${i + 1}, Service ${si + 1}: missing ${serviceMissing.join(', ')}`);
              allInvoicesValid = false;
            }
          });
        }
      }
    });

    if (allInvoicesValid) {
      console.log('✅ All invoices have complete data structure\n');
    } else {
      console.log('⚠️  Some invoices have incomplete data\n');
    }

    // ===================================================================
    // Invoice Status Analysis
    // ===================================================================
    console.log('=== INVOICE STATUS ANALYSIS ===\n');

    const statusCounts = {};
    invoices.forEach(inv => {
      const status = inv.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.keys(statusCounts).sort().forEach(status => {
      console.log(`  ${status}: ${statusCounts[status]} invoice(s)`);
    });

    // ===================================================================
    // Multi-Service Invoice Check
    // ===================================================================
    console.log('\n=== MULTI-SERVICE INVOICE CHECK (INV-NEW-CRUD-2) ===\n');

    const multiServiceInvoices = invoices.filter(inv =>
      inv.services && inv.services.length > 1
    );

    console.log(`Invoices with multiple services: ${multiServiceInvoices.length}\n`);

    if (multiServiceInvoices.length > 0) {
      multiServiceInvoices.forEach(inv => {
        console.log(`${inv.invoiceNumber}: ${inv.services.length} services, Total: ${inv.total} ${inv.currency}`);
      });
      console.log('\n✅ Multi-service invoice capability verified\n');
    } else {
      console.log('ℹ️  No multi-service invoices found (single service invoices only)\n');
    }

    // ===================================================================
    // Partner Service Check
    // ===================================================================
    console.log('=== PARTNER SERVICE CHECK (INV-NEW-CRUD-6) ===\n');

    let partnerServicesCount = 0;
    invoices.forEach(inv => {
      if (inv.services) {
        inv.services.forEach(service => {
          if (service.partnerId) {
            partnerServicesCount++;
          }
        });
      }
    });

    console.log(`Services with partner: ${partnerServicesCount}\n`);

    if (partnerServicesCount > 0) {
      console.log('✅ Partner service capability verified\n');
    } else {
      console.log('ℹ️  No partner services found (all internal services)\n');
    }

    // ===================================================================
    // Summary
    // ===================================================================
    console.log('=== TEST SUMMARY ===\n');
    console.log(`Total Invoices: ${invoices.length}`);
    console.log(`Total Amount: ${invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)} ${invoices[0]?.currency || 'SDG'}`);
    console.log(`Average: ${(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / invoices.length).toFixed(2)} ${invoices[0]?.currency || 'SDG'}`);
    console.log();
    console.log('Test Results:');
    console.log(`  INV-NEW-CRUD-7 (Journal Entries): ${journalTestPassed ? '✅ PASSED' : (invoicesWithJournal > 0 ? '⚠️  PARTIAL' : '❌ FAILED')}`);
    console.log(`  Data Structure: ${allInvoicesValid ? '✅ VALID' : '⚠️  ISSUES FOUND'}`);
    console.log(`  Multi-Service: ${multiServiceInvoices.length > 0 ? '✅ VERIFIED' : 'ℹ️  NOT TESTED'}`);
    console.log(`  Partner Services: ${partnerServicesCount > 0 ? '✅ VERIFIED' : 'ℹ️  NOT TESTED'}`);

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyInvCrudTests().then(() => process.exit(0));
