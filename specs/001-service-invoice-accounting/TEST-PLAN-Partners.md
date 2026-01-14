# TEST-PLAN: Partners Section

Generated: 2026-01-08 15:30
Spec Source: specs/001-service-invoice-accounting/spec.md, tasks.md (Phase 7 - User Story 4)
Executed By: Claude Code + Ralph Wiggum

---

## 🔧 Environment

| Setting | Value |
|---------|-------|
| App URL | http://localhost:3000 |
| Database | Firebase |
| Auth Account | hossamsharif1990@gmail.com |
| Viewports | Desktop (1920x1080), Mobile (375x812) |
| Feature Branch | 001-service-invoice-accounting |

---

## 🔐 Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate to /login → Enter credentials (hossamsharif1990@gmail.com / Hossam1990@) → Submit | Redirect to dashboard | Chrome MCP | [ ] |
| AUTH-2 | Session | Refresh page | Stay logged in | Chrome MCP | [ ] |
| AUTH-3 | Role Check | Verify user role | User has admin role for partner management | Firebase | [ ] |

### **HARD STOP** - Authentication Checkpoint
- [ ] Logged in successfully
- [ ] Correct user role (admin)
- [ ] Session persisted

---

## 📄 Page: /partners (Partners List)

### UI Tests - Desktop
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNERS-UI-1 | Page Load | Navigate to /partners | Page renders without errors | Chrome | [ ] |
| PARTNERS-UI-2 | Header | Check page header | Title "Partners" (EN) or "الشركاء" (AR) visible | Chrome | [ ] |
| PARTNERS-UI-3 | Add Button | Check add button | "Add Partner" button visible with Plus icon | Chrome | [ ] |
| PARTNERS-UI-4 | Loading State | Check during data fetch | Loading spinner or skeleton visible | Chrome | [ ] |
| PARTNERS-UI-5 | Empty State | Check with no partners | Empty state message displayed | Chrome | [ ] |
| PARTNERS-UI-6 | Partner Cards | Check with partners | Partner cards display with correct info | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNERS-i18n-1 | Translations EN | Set locale to EN → Navigate to /partners | No translation keys visible (e.g., "partners.title") | Chrome | [ ] |
| PARTNERS-i18n-2 | Translations AR | Set locale to AR → Navigate to /ar/partners | All text in Arabic, no keys visible | Chrome | [ ] |
| PARTNERS-i18n-3 | RTL Layout | Check AR locale | Text aligned right, icons on correct side | Chrome | [ ] |
| PARTNERS-i18n-4 | Status Labels | Check status badges | Status labels translated (Active/نشط, Suspended/موقوف) | Chrome | [ ] |

### Partner List Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNERS-LIST-1 | Display Info | View partner cards | Name, code, status, contact person, commission rate displayed | Chrome | [ ] |
| PARTNERS-LIST-2 | Status Badge | Check status badges | Color-coded badges (green=active, red=suspended, yellow=pending) | Chrome | [ ] |
| PARTNERS-LIST-3 | Commission Display | Check commission info | Pending commissions, total earned, total paid visible | Chrome | [ ] |
| PARTNERS-LIST-4 | Click Card | Click on partner card | Navigate to partner detail page | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNERS-MOB-1 | Layout | Set viewport 375x812 → Navigate to /partners | Responsive layout, cards stack vertically | Chrome | [ ] |
| PARTNERS-MOB-2 | RTL Mobile | Set AR locale + mobile viewport | Correct RTL alignment on mobile | Chrome | [ ] |
| PARTNERS-MOB-3 | Touch Target | Check button sizes | Add button has adequate touch target (min 44px) | Chrome | [ ] |

### **HARD STOP** - Partners List Complete
- [ ] All UI elements render correctly
- [ ] All translations work (EN/AR)
- [ ] RTL layout correct
- [ ] Mobile responsive

---

## 📄 Page: /partners/new (Create New Partner)

### UI Tests - Desktop
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NEW-PARTNER-UI-1 | Page Load | Navigate to /partners/new | Form page renders without errors | Chrome | [ ] |
| NEW-PARTNER-UI-2 | Form Fields | Check all fields | Name, code, contact person, email, phone, commission %, bank details visible | Chrome | [ ] |
| NEW-PARTNER-UI-3 | Required Indicators | Check required fields | Required fields marked with asterisk | Chrome | [ ] |
| NEW-PARTNER-UI-4 | Save Button | Check save button | "Create Partner" button visible and enabled | Chrome | [ ] |
| NEW-PARTNER-UI-5 | Cancel Button | Check cancel button | Cancel/Back button visible | Chrome | [ ] |

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NEW-PARTNER-VAL-1 | Empty Form | Click save without filling | Error messages for required fields (name, code, contact, email, commission) | Chrome | [ ] |
| NEW-PARTNER-VAL-2 | Invalid Email | Enter invalid email → Save | Email validation error displayed | Chrome | [ ] |
| NEW-PARTNER-VAL-3 | Invalid Phone | Enter invalid phone → Save | Phone validation error displayed | Chrome | [ ] |
| NEW-PARTNER-VAL-4 | Commission Range | Enter commission > 100 or < 0 | Validation error for commission percentage | Chrome | [ ] |
| NEW-PARTNER-VAL-5 | Duplicate Code | Enter existing partner code → Save | Error: Code already exists | Chrome + Firebase | [ ] |

### CRUD Tests - Create
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NEW-PARTNER-CRUD-1 | Create Partner | Fill all fields → Save | Partner created successfully | Chrome + Firebase | [ ] |
| NEW-PARTNER-CRUD-2 | Verify in DB | After create | Partner document exists in Firestore partnerOffices collection | Firebase | [ ] |
| NEW-PARTNER-CRUD-3 | Verify Account | After create | Partner account created in accounts collection | Firebase | [ ] |
| NEW-PARTNER-CRUD-4 | Initial Values | Check new partner | totalCommissionsEarned=0, totalCommissionsPaid=0, pendingCommissions=0 | Firebase | [ ] |
| NEW-PARTNER-CRUD-5 | Default Status | Check status | Status set to 'active' by default | Firebase | [ ] |
| NEW-PARTNER-CRUD-6 | Redirect | After successful create | Redirect to partner detail page | Chrome | [ ] |
| NEW-PARTNER-CRUD-7 | Success Message | After create | Success toast/notification displayed | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NEW-PARTNER-i18n-1 | Form Labels EN | Set EN locale | All form labels in English | Chrome | [ ] |
| NEW-PARTNER-i18n-2 | Form Labels AR | Set AR locale | All form labels in Arabic | Chrome | [ ] |
| NEW-PARTNER-i18n-3 | Validation AR | Set AR + trigger validation | Validation messages in Arabic | Chrome | [ ] |
| NEW-PARTNER-i18n-4 | RTL Form | Check AR locale | Form fields right-aligned | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NEW-PARTNER-MOB-1 | Form Layout | Set viewport 375x812 | Form fields stack vertically, full width | Chrome | [ ] |
| NEW-PARTNER-MOB-2 | Input Focus | Tap on input fields | Proper keyboard display, no zoom | Chrome | [ ] |
| NEW-PARTNER-MOB-3 | RTL Mobile | AR locale + mobile | Correct RTL on mobile form | Chrome | [ ] |

### **HARD STOP** - Create Partner Complete
- [ ] All form fields work correctly
- [ ] All validations pass
- [ ] Partner created in DB
- [ ] Partner account created
- [ ] Mobile responsive

---

## 📄 Page: /partners/[partnerId] (Partner Detail)

### UI Tests - Desktop
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-DETAIL-UI-1 | Page Load | Navigate to partner detail | Partner details page renders | Chrome | [ ] |
| PARTNER-DETAIL-UI-2 | Partner Info | Check info section | Name, code, status, contact details displayed | Chrome | [ ] |
| PARTNER-DETAIL-UI-3 | Commission Summary | Check commission section | Total earned, total paid, pending displayed | Chrome | [ ] |
| PARTNER-DETAIL-UI-4 | Bank Details | Check bank section | Bank account info displayed if available | Chrome | [ ] |
| PARTNER-DETAIL-UI-5 | Edit Button | Check edit button | "Edit" button visible | Chrome | [ ] |
| PARTNER-DETAIL-UI-6 | Status Change | Check status dropdown/button | Option to change status visible | Chrome | [ ] |

### Commission Summary Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-COMM-1 | Display Values | View commission summary | All commission values match DB records | Chrome + Firebase | [ ] |
| PARTNER-COMM-2 | Calculation | Check pending = earned - paid | Pending commissions = totalCommissionsEarned - totalCommissionsPaid | Chrome + Firebase | [ ] |
| PARTNER-COMM-3 | Currency Format | Check currency display | Values formatted with correct currency symbol | Chrome | [ ] |

### Edit Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-EDIT-1 | Edit Mode | Click edit button | Form fields become editable | Chrome | [ ] |
| PARTNER-EDIT-2 | Update Info | Modify fields → Save | Partner info updated in DB | Chrome + Firebase | [ ] |
| PARTNER-EDIT-3 | Cancel Edit | Click cancel after changes | Changes discarded, original values restored | Chrome | [ ] |
| PARTNER-EDIT-4 | Validation | Enter invalid data → Save | Validation errors displayed | Chrome | [ ] |
| PARTNER-EDIT-5 | Success Message | After successful update | Success notification displayed | Chrome | [ ] |

### Status Change Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-STATUS-1 | Active to Suspended | Change active partner to suspended → Save | Status updated in DB | Chrome + Firebase | [ ] |
| PARTNER-STATUS-2 | Suspended to Active | Change suspended partner to active → Save | Status updated in DB | Chrome + Firebase | [ ] |
| PARTNER-STATUS-3 | Pending to Active | Change pending partner to active → Save | Status updated in DB | Chrome + Firebase | [ ] |
| PARTNER-STATUS-4 | Confirmation | Attempt status change | Confirmation dialog appears | Chrome | [ ] |
| PARTNER-STATUS-5 | Badge Update | After status change | Status badge updates immediately | Chrome | [ ] |

### Settlement List Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-SETTLE-1 | Display Settlements | View partner with settlements | Settlement list displayed | Chrome | [ ] |
| PARTNER-SETTLE-2 | Settlement Info | Check settlement items | Amount, period, status, payment method displayed | Chrome | [ ] |
| PARTNER-SETTLE-3 | No Settlements | View partner without settlements | Empty state displayed | Chrome | [ ] |
| PARTNER-SETTLE-4 | Status Badges | Check settlement statuses | Color-coded badges (pending/approved/paid/disputed) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-DETAIL-i18n-1 | Labels EN | Set EN locale | All labels in English | Chrome | [ ] |
| PARTNER-DETAIL-i18n-2 | Labels AR | Set AR locale | All labels in Arabic | Chrome | [ ] |
| PARTNER-DETAIL-i18n-3 | RTL Layout | Check AR locale | Content right-aligned, proper RTL layout | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-DETAIL-MOB-1 | Layout | Set viewport 375x812 | Content stacks vertically, readable | Chrome | [ ] |
| PARTNER-DETAIL-MOB-2 | Commission Cards | Check on mobile | Commission summary cards stack properly | Chrome | [ ] |
| PARTNER-DETAIL-MOB-3 | RTL Mobile | AR locale + mobile | Correct RTL on mobile | Chrome | [ ] |

### **HARD STOP** - Partner Detail Complete
- [ ] All partner info displays correctly
- [ ] Edit functionality works
- [ ] Status changes work
- [ ] Settlements display correctly
- [ ] Mobile responsive

---

## 🔗 Integration: Partner Payments (from Payments Page)

### Partner Payment Form Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-PAY-1 | Access Form | Navigate to /payments → Partner Payments section | Partner payment form visible | Chrome | [ ] |
| PARTNER-PAY-2 | Select Partner | Select partner from dropdown | Partner's pending balance displayed | Chrome | [ ] |
| PARTNER-PAY-3 | Commission Breakdown | Check commission info | Gross amount, commission %, net payable shown | Chrome | [ ] |
| PARTNER-PAY-4 | Payment Method | Select payment method | Cash/Bank account options available | Chrome | [ ] |
| PARTNER-PAY-5 | Amount Validation | Enter amount > pending | Validation error displayed | Chrome | [ ] |

### Payment Recording Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-PAY-REC-1 | Record Payment | Fill form → Submit payment | Payment recorded successfully | Chrome + Firebase | [ ] |
| PARTNER-PAY-REC-2 | Update Balance | After payment | Partner totalCommissionsPaid updated | Firebase | [ ] |
| PARTNER-PAY-REC-3 | Pending Balance | After payment | Pending balance reduced correctly | Firefox + Firebase | [ ] |
| PARTNER-PAY-REC-4 | Journal Entry | After payment | Journal entry created (Debit: Partner account, Credit: Cash/Bank) | Firebase | [ ] |
| PARTNER-PAY-REC-5 | Transaction Number | After payment | Unique transaction number generated | Firebase | [ ] |
| PARTNER-PAY-REC-6 | Payment History | View partner detail | Payment appears in payment history | Chrome | [ ] |

### Invoice Commission Status Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-PAY-INV-1 | Commission Paid Flag | Record payment for partner | Related invoices marked with commission paid | Firebase | [ ] |
| PARTNER-PAY-INV-2 | Partial Payment | Pay partial amount | Proportional invoices marked as paid | Firebase | [ ] |

### **HARD STOP** - Partner Payments Complete
- [ ] Partner payment form works
- [ ] Payments recorded correctly
- [ ] Balances update correctly
- [ ] Journal entries created
- [ ] Invoice commission status updated

---

## 🔗 Integration: Partners in Invoices

### Service Line Item Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-INV-1 | Partner Selection | Add service to invoice → Select partner-provided service | Partner dropdown appears | Chrome | [ ] |
| PARTNER-INV-2 | Commission Entry | Select partner for service | Commission percentage field appears (pre-filled with partner default) | Chrome | [ ] |
| PARTNER-INV-3 | Commission Calc | Enter service price + commission % | Commission amount calculated and displayed | Chrome | [ ] |
| PARTNER-INV-4 | Partner Required | Select partner service type → Leave partner empty → Save | Validation error: Partner required | Chrome | [ ] |

### Invoice Commission Tracking Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-INV-COMM-1 | Track Commission | Create invoice with partner service → Issue invoice | Partner totalCommissionsEarned increased | Firebase | [ ] |
| PARTNER-INV-COMM-2 | Commission Total | Invoice with multiple partner services | Total commission = sum of all partner service commissions | Chrome + Firebase | [ ] |
| PARTNER-INV-COMM-3 | Partner Balance | After invoice issue | Partner pendingCommissions updated | Firebase | [ ] |

### Quick-Add Partner Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-QUICK-1 | Quick-Add Button | In invoice form → Click "+" next to partner dropdown | Partner creation modal opens | Chrome | [ ] |
| PARTNER-QUICK-2 | Create Partner | Fill modal form → Save | Partner created without leaving invoice page | Chrome + Firebase | [ ] |
| PARTNER-QUICK-3 | Auto-Select | After quick-add | New partner auto-selected in service line | Chrome | [ ] |
| PARTNER-QUICK-4 | Modal Close | Click outside or cancel | Modal closes without creating partner | Chrome | [ ] |

### **HARD STOP** - Partner Invoice Integration Complete
- [ ] Partner selection in services works
- [ ] Commission calculations correct
- [ ] Partner balances update on invoice issue
- [ ] Quick-add partner works

---

## 🔗 Integration: Partner Accounts (Chart of Accounts)

### Account Creation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-ACC-1 | Auto-Create Account | Create new partner | Corresponding account created in chart of accounts | Firebase | [ ] |
| PARTNER-ACC-2 | Account Type | Check created account | Account type = "Partner Liability" | Firebase | [ ] |
| PARTNER-ACC-3 | Account Name | Check account | Account name = "Partner: [Partner Name]" | Firebase | [ ] |
| PARTNER-ACC-4 | Account Balance | Check new account | Initial balance = 0 | Firebase | [ ] |

### Account Balance Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-ACC-BAL-1 | After Commission | Issue invoice with partner service | Partner account balance increases (credit) | Firebase | [ ] |
| PARTNER-ACC-BAL-2 | After Payment | Record partner payment | Partner account balance decreases (debit) | Firebase | [ ] |
| PARTNER-ACC-BAL-3 | Balance Reconciliation | Check partner balance vs account balance | Partner pendingCommissions = Partner account balance | Firebase | [ ] |

### **HARD STOP** - Partner Accounts Complete
- [ ] Partner accounts auto-created
- [ ] Account balances update correctly
- [ ] Balances reconcile with partner records

---

## 🔗 Integration: Partner Statements

### Statement Generation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-STMT-1 | Generate Statement | Navigate to /statements → Select partner → Generate | Partner statement displays | Chrome | [ ] |
| PARTNER-STMT-2 | Transaction List | View statement | All partner transactions listed (commissions, payments) | Chrome | [ ] |
| PARTNER-STMT-3 | Running Balance | Check balance column | Running balance calculated correctly | Chrome + Firebase | [ ] |
| PARTNER-STMT-4 | Commission Detail | Check commission entries | Invoice reference, commission amount, commission % shown | Chrome | [ ] |
| PARTNER-STMT-5 | Payment Detail | Check payment entries | Payment method, transaction number, amount shown | Chrome | [ ] |
| PARTNER-STMT-6 | Date Range Filter | Apply date filter | Only transactions in range displayed | Chrome | [ ] |

### Statement Export Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-STMT-EXP-1 | Export PDF | Generate statement → Click export | PDF download initiated | Chrome | [ ] |
| PARTNER-STMT-EXP-2 | PDF Content | Open exported PDF | All statement data present and formatted | Chrome | [ ] |
| PARTNER-STMT-EXP-3 | PDF RTL | Export AR statement | PDF has proper RTL layout | Chrome | [ ] |

### **HARD STOP** - Partner Statements Complete
- [ ] Statements generate correctly
- [ ] All transactions appear
- [ ] Running balance accurate
- [ ] PDF export works

---

## 📊 Data Verification Tests

### Database Consistency Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-DB-1 | Partner Collection | Check Firestore | Partners in tenants/{tenantId}/partnerOffices collection | Firebase | [ ] |
| PARTNER-DB-2 | Required Fields | Check partner docs | All required fields present (id, name, code, status, etc.) | Firebase | [ ] |
| PARTNER-DB-3 | Timestamps | Check timestamps | createdAt and updatedAt are valid Firestore Timestamps | Firebase | [ ] |
| PARTNER-DB-4 | Commission Totals | Check partner doc | totalCommissionsEarned, totalCommissionsPaid, pendingCommissions fields exist | Firebase | [ ] |
| PARTNER-DB-5 | Account Link | For each partner | Corresponding account exists in accounts collection | Firebase | [ ] |

### Balance Accuracy Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-BAL-1 | Pending Calculation | pendingCommissions = totalCommissionsEarned - totalCommissionsPaid | Calculation accurate for all partners | Firebase | [ ] |
| PARTNER-BAL-2 | Account Reconciliation | Partner balance = Partner account balance | Values match exactly | Firebase | [ ] |
| PARTNER-BAL-3 | Commission Sum | Sum all invoice line commissions for partner | Equals partner totalCommissionsEarned | Firebase | [ ] |
| PARTNER-BAL-4 | Payment Sum | Sum all partner payments | Equals partner totalCommissionsPaid | Firebase | [ ] |

### **HARD STOP** - Data Verification Complete
- [ ] Database structure correct
- [ ] All required fields present
- [ ] Balance calculations accurate
- [ ] Data consistency verified

---

## 🧪 Edge Cases & Error Handling

### Edge Case Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-EDGE-1 | Negative Balance | Record payment > pending commissions | Error or warning displayed | Chrome | [ ] |
| PARTNER-EDGE-2 | Delete Active Partner | Attempt to delete partner with pending commissions | Error: Cannot delete partner with pending balance | Chrome + Firebase | [ ] |
| PARTNER-EDGE-3 | Zero Commission | Add partner service with 0% commission | Invoice created, no commission tracked | Chrome + Firebase | [ ] |
| PARTNER-EDGE-4 | Concurrent Edit | Two users edit same partner simultaneously | Second save shows version conflict error | Chrome | [ ] |
| PARTNER-EDGE-5 | Status Loop | Try invalid status transitions (e.g., pending → suspended directly) | Transition blocked or validated | Chrome | [ ] |

### Error Handling Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PARTNER-ERR-1 | Network Error | Disconnect network → Try to save partner | Error message displayed gracefully | Chrome | [ ] |
| PARTNER-ERR-2 | Permission Error | Test with non-admin user (if possible) | Access denied or redirect | Chrome | [ ] |
| PARTNER-ERR-3 | Missing Data | Load partner detail with deleted partner ID | 404 or error page displayed | Chrome | [ ] |
| PARTNER-ERR-4 | File Upload Error | Upload invalid file as attachment | Error message, form still usable | Chrome | [ ] |

### **HARD STOP** - Edge Cases Complete
- [ ] Edge cases handled correctly
- [ ] Error messages clear and helpful
- [ ] No data corruption on errors

---

## 🚨 Blocked Protocol

If unable to proceed after 3 attempts on any test:

1. Mark test as **BLOCKED**
2. Document issue here:
   - Issue description:
   - Error messages:
   - Attempted solutions:
3. Take screenshot and save to `specs/001-service-invoice-accounting/screenshots/`
4. Continue to next test
5. If >50% tests blocked: Output `<promise>BLOCKED</promise>`

### Blocked Tests Log

| Test ID | Issue | Error | Attempts | Status |
|---------|-------|-------|----------|--------|
| | | | | |

---

## ✅ Success Criteria

All must be true to output `<promise>ALL_TESTS_COMPLETE</promise>`:

- [ ] All test cases marked [x] or BLOCKED
- [ ] All HARD STOPs passed
- [ ] All critical bugs fixed and committed
- [ ] Partners list page fully functional
- [ ] Create partner fully functional
- [ ] Partner detail page fully functional
- [ ] Partner payments integration working
- [ ] Partner invoice integration working
- [ ] Partner accounts integration working
- [ ] Partner statements working
- [ ] Data consistency verified
- [ ] Mobile responsive verified
- [ ] RTL layout verified for Arabic
- [ ] TEST-REPORT-Partners.md generated
- [ ] Screenshots saved for any failures

---

## 🔄 Ralph Wiggum Execution

Run this plan with:

```bash
/ralph-loop "Execute specs/001-service-invoice-accounting/TEST-PLAN-Partners.md autonomously.

RULES:
1. Read each test case in order
2. Execute using Chrome MCP + Firebase tools
3. Mark [x] when passed
4. Fix failures immediately, commit with: git commit -m 'fix(partners): [description]'
5. Re-test after fix (max 3 attempts)
6. Pause at HARD STOP markers for verification
7. Log console errors to report (don't stop)
8. Take screenshots on failure (save to specs/001-service-invoice-accounting/screenshots/)
9. After 3 failed fix attempts: mark BLOCKED, continue
10. Use test accounts from CLAUDE.md
11. Test both EN and AR locales
12. Test both desktop (1920x1080) and mobile (375x812) viewports

OUTPUT:
- <promise>BLOCKED</promise> if >50% tests blocked
- <promise>ALL_TESTS_COMPLETE</promise> when all pass
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## 📝 Notes

- **Partners Section Scope**: This plan covers User Story 4 (Record Partner Payments) and all partner-related functionality
- **Integration Points**: Partners integrate with invoices, payments, accounts, and statements
- **Commission Flow**: Invoice issue → Commission earned → Payment recorded → Commission paid → Balance updated
- **Database**: Firebase Firestore, collection path: `tenants/{tenantId}/partnerOffices/{partnerId}`
- **Accounting**: Partner accounts auto-created, type: "Partner Liability"
- **Double-Entry**: Partner commissions = Credit Partner account, Debit Revenue; Partner payments = Debit Partner account, Credit Cash/Bank
- **Console Errors**: Log but don't stop unless critical
- **Fix Protocol**: Fix → Commit → Re-test (3x max per test)
- **Screenshots**: Save to `specs/001-service-invoice-accounting/screenshots/PARTNER-[TEST-ID]-[timestamp].png`

---

## 📋 Test Summary

| Category | Total Tests |
|----------|-------------|
| Authentication | 3 |
| Partners List UI | 6 |
| Partners List i18n | 4 |
| Partners List Functionality | 4 |
| Partners List Mobile | 3 |
| Create Partner UI | 5 |
| Create Partner Validation | 5 |
| Create Partner CRUD | 7 |
| Create Partner i18n | 4 |
| Create Partner Mobile | 3 |
| Partner Detail UI | 6 |
| Partner Detail Commission | 3 |
| Partner Detail Edit | 5 |
| Partner Detail Status | 5 |
| Partner Detail Settlements | 4 |
| Partner Detail i18n | 3 |
| Partner Detail Mobile | 3 |
| Partner Payment Form | 5 |
| Partner Payment Recording | 6 |
| Partner Payment Invoice Status | 2 |
| Partners in Invoices | 4 |
| Invoice Commission Tracking | 3 |
| Quick-Add Partner | 4 |
| Partner Account Creation | 4 |
| Partner Account Balance | 3 |
| Partner Statement Generation | 6 |
| Partner Statement Export | 3 |
| Database Consistency | 5 |
| Balance Accuracy | 4 |
| Edge Cases | 5 |
| Error Handling | 4 |
| **TOTAL** | **129 tests** |

---

**Generated by**: Claude Code (Sonnet 4.5)
**Plan Version**: 1.0
**Ready for Execution**: ✅
