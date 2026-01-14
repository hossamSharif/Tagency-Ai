# TEST-PLAN: Settings Module

Generated: 2026-01-10
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase Firestore
App URL: http://localhost:3001

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login with primary account | Navigate to /ar/login, enter hossamsharif1990@gmail.com / Hossam1990@, click login | Redirect to dashboard | Chrome | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Can access dashboard

---

## Page: /settings (Profile Settings)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-UI-1 | Load settings page | Navigate to /ar/settings | Page renders with 3 cards | Chrome | [ ] |
| SET-UI-2 | Profile card renders | Check profile settings card | Shows email, name, phone fields | Chrome | [ ] |
| SET-UI-3 | Password card renders | Check password settings card | Shows current, new, confirm password fields | Chrome | [ ] |
| SET-UI-4 | Preferences card renders | Check preferences card | Shows theme and language selectors | Chrome | [ ] |
| SET-UI-5 | Email field disabled | Check email input | Email is read-only/disabled | Chrome | [ ] |
| SET-UI-6 | Role badge displays | Check user role | Role badge shows (owner/admin/staff) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-i18n-1 | Page title Arabic | Check page heading | Shows "الإعدادات" | Chrome | [ ] |
| SET-i18n-2 | Profile label Arabic | Check profile card title | Shows "الملف الشخصي" | Chrome | [ ] |
| SET-i18n-3 | Password label Arabic | Check password card | Shows "كلمة المرور" | Chrome | [ ] |
| SET-i18n-4 | Theme labels Arabic | Check theme options | Shows "فاتح", "داكن", "تلقائي" | Chrome | [ ] |
| SET-i18n-5 | Language labels Arabic | Check language options | Shows "العربية", "English" | Chrome | [ ] |
| SET-i18n-6 | No raw keys | Scan entire page | No translation keys like "settings.xxx" visible | Chrome | [ ] |

### CRUD Tests - Profile
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-CRUD-1 | Update display name | Change name, click save | Success toast, name persists on reload | Chrome | [ ] |
| SET-CRUD-2 | Update phone | Change phone, click save | Success toast, phone persists on reload | Chrome | [ ] |
| SET-CRUD-3 | Profile validation | Submit empty name | Validation error shown | Chrome | [ ] |

### CRUD Tests - Password
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-CRUD-4 | Password mismatch | Enter different passwords | Error: passwords don't match | Chrome | [ ] |
| SET-CRUD-5 | Wrong current password | Enter wrong current password | Error: current password incorrect | Chrome | [ ] |
| SET-CRUD-6 | Password validation | Enter weak password | Validation error for weak password | Chrome | [ ] |

### Functional Tests - Preferences
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-FUNC-1 | Switch to dark theme | Click dark theme button | Theme changes to dark | Chrome | [ ] |
| SET-FUNC-2 | Switch to light theme | Click light theme button | Theme changes to light | Chrome | [ ] |
| SET-FUNC-3 | Switch to system theme | Click system theme button | Theme follows system preference | Chrome | [ ] |
| SET-FUNC-4 | Switch to English | Click English language | URL changes to /en/settings, UI in English | Chrome | [ ] |
| SET-FUNC-5 | Switch back to Arabic | Click Arabic language | URL changes to /ar/settings, UI in Arabic | Chrome | [ ] |
| SET-FUNC-6 | Theme persists | Change theme, reload page | Theme setting persists | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SET-MOB-1 | Responsive layout | Set viewport 375x812 | Cards stack vertically | Chrome | [ ] |
| SET-MOB-2 | Theme buttons mobile | Check theme selector | Buttons fit and are tappable | Chrome | [ ] |
| SET-MOB-3 | Language buttons mobile | Check language selector | Buttons fit and are tappable | Chrome | [ ] |

### **HARD STOP** - Profile Settings Complete
- [ ] All profile setting tests pass
- [ ] Theme switching works
- [ ] Language switching works

---

## Page: /settings/workspace (Workspace Settings)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-UI-1 | Load workspace page | Navigate to /ar/settings/workspace | Page renders with tabs | Chrome | [ ] |
| WS-UI-2 | Tabs render | Check tab navigation | Shows "عام" and "العلامة التجارية" tabs | Chrome | [ ] |
| WS-UI-3 | General tab content | Click General tab | Shows office info form | Chrome | [ ] |
| WS-UI-4 | Branding tab content | Click Branding tab | Shows logo upload and color settings | Chrome | [ ] |
| WS-UI-5 | Danger zone renders | Scroll to bottom | Shows danger zone with delete workspace (disabled) | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-i18n-1 | Page title Arabic | Check page heading | Shows "مساحة العمل" | Chrome | [ ] |
| WS-i18n-2 | Tab labels Arabic | Check tab labels | Shows "عام" and "العلامة التجارية" | Chrome | [ ] |
| WS-i18n-3 | Office info label | Check card title | Shows "معلومات المكتب" | Chrome | [ ] |
| WS-i18n-4 | Danger zone Arabic | Check danger zone | Shows "منطقة الخطر" | Chrome | [ ] |
| WS-i18n-5 | No raw keys | Scan entire page | No translation keys visible | Chrome | [ ] |

### CRUD Tests - Office Settings
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-CRUD-1 | Update office name | Change office name, save | Success toast, persists on reload | Chrome | [ ] |
| WS-CRUD-2 | Update office email | Change email, save | Success toast, persists on reload | Chrome | [ ] |
| WS-CRUD-3 | Update office phone | Change phone, save | Success toast, persists on reload | Chrome | [ ] |
| WS-CRUD-4 | Update address | Change address, save | Success toast, persists on reload | Chrome | [ ] |

### CRUD Tests - Regional Settings
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-CRUD-5 | Update default language | Change language setting, save | Setting persists | Chrome | [ ] |
| WS-CRUD-6 | Update default currency | Change currency setting, save | Setting persists | Chrome | [ ] |
| WS-CRUD-7 | Update timezone | Change timezone, save | Setting persists | Chrome | [ ] |

### Authorization Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-AUTH-1 | Admin can access | Login as admin, navigate to workspace | Page loads | Chrome | [ ] |
| WS-AUTH-2 | Delete workspace disabled | Check delete button | Button is disabled | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| WS-MOB-1 | Responsive layout | Set viewport 375x812 | Layout adapts properly | Chrome | [ ] |
| WS-MOB-2 | Tabs mobile | Check tab navigation | Tabs fit and are tappable | Chrome | [ ] |

### **HARD STOP** - Workspace Settings Complete
- [ ] All workspace setting tests pass
- [ ] Tab navigation works
- [ ] Forms save correctly

---

## Page: /settings/team (Team Management)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| TM-UI-1 | Load team page | Navigate to /ar/settings/team | Page renders with invite form and team list | Chrome | [ ] |
| TM-UI-2 | Invite form renders | Check invite card | Shows email input and role selector | Chrome | [ ] |
| TM-UI-3 | Team list renders | Check team members card | Shows list of current team members | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| TM-i18n-1 | Page title Arabic | Check page heading | Shows "الفريق" | Chrome | [ ] |
| TM-i18n-2 | Invite user label | Check invite card title | Shows "دعوة مستخدم" | Chrome | [ ] |
| TM-i18n-3 | Role labels Arabic | Check role dropdown | Shows "مالك", "مدير", "موظف" | Chrome | [ ] |
| TM-i18n-4 | No raw keys | Scan entire page | No translation keys visible | Chrome | [ ] |

### CRUD Tests - Team Invites
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| TM-CRUD-1 | Send valid invite | Enter valid email, select role, submit | Success toast, invite sent | Chrome | [ ] |
| TM-CRUD-2 | Invalid email | Enter invalid email, submit | Validation error | Chrome | [ ] |
| TM-CRUD-3 | Duplicate invite | Enter existing member email | Error: user already in team | Chrome | [ ] |

### Authorization Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| TM-AUTH-1 | Owner can manage | Login as owner, check actions | Can invite and remove members | Chrome | [ ] |
| TM-AUTH-2 | Admin can manage | Login as admin, check actions | Can invite members | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| TM-MOB-1 | Responsive layout | Set viewport 375x812 | Cards stack vertically | Chrome | [ ] |
| TM-MOB-2 | Invite form mobile | Check form | Form usable on mobile | Chrome | [ ] |

### **HARD STOP** - Team Management Complete
- [ ] All team management tests pass
- [ ] Invite flow works
- [ ] Role assignment works

---

## Page: /settings/subscription (Subscription Management)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SUB-UI-1 | Load subscription page | Navigate to /ar/settings/subscription | Page renders with subscription info | Chrome | [ ] |
| SUB-UI-2 | Current plan displays | Check plan section | Shows current plan details | Chrome | [ ] |
| SUB-UI-3 | Billing info displays | Check billing section | Shows billing information | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SUB-i18n-1 | Page title Arabic | Check page heading | Shows "إدارة الاشتراك" | Chrome | [ ] |
| SUB-i18n-2 | Plan labels Arabic | Check plan labels | Arabic labels for plans | Chrome | [ ] |
| SUB-i18n-3 | No raw keys | Scan entire page | No translation keys visible | Chrome | [ ] |

### Authorization Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SUB-AUTH-1 | Owner only access | Navigate as owner | Page loads | Chrome | [ ] |
| SUB-AUTH-2 | Admin redirected | Navigate as admin | Redirected (permission denied) | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SUB-MOB-1 | Responsive layout | Set viewport 375x812 | Layout adapts | Chrome | [ ] |

### **HARD STOP** - Subscription Management Complete
- [ ] All subscription tests pass
- [ ] Permission checks work

---

## Cross-Page Tests

### Navigation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NAV-1 | Settings sidebar nav | Click settings in sidebar | Navigate to /settings | Chrome | [ ] |
| NAV-2 | Settings subpages nav | Check if there's submenu | Navigate between settings subpages | Chrome | [ ] |
| NAV-3 | Breadcrumbs | Check page breadcrumbs | Show correct path | Chrome | [ ] |

### RTL Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RTL-1 | Page direction Arabic | Check HTML dir attribute | dir="rtl" in Arabic | Chrome | [ ] |
| RTL-2 | Form alignment Arabic | Check form layout | Labels and inputs aligned RTL | Chrome | [ ] |
| RTL-3 | Icons position Arabic | Check icon positions | Icons on correct side for RTL | Chrome | [ ] |

### English Locale Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EN-1 | Settings page English | Navigate to /en/settings | All labels in English | Chrome | [ ] |
| EN-2 | Theme labels English | Check theme options | "Light", "Dark", "System" | Chrome | [ ] |
| EN-3 | No raw keys English | Scan page | No translation keys visible | Chrome | [ ] |
| EN-4 | LTR direction | Check HTML dir | dir="ltr" | Chrome | [ ] |

---

## Console Error Monitoring

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CON-1 | Profile page errors | Load /settings, check console | No critical errors | Chrome | [ ] |
| CON-2 | Workspace page errors | Load /settings/workspace, check console | No critical errors | Chrome | [ ] |
| CON-3 | Team page errors | Load /settings/team, check console | No critical errors | Chrome | [ ] |
| CON-4 | Subscription page errors | Load /settings/subscription, check console | No critical errors | Chrome | [ ] |

---

## Success Criteria

- All [ ] marked as [x] when passing
- All HARD STOPs verified
- All fixes committed with proper messages
- Console errors logged (non-blocking)
- Screenshots saved for failures

Upon completion:
```
<promise>ALL_TESTS_COMPLETE</promise>
```

If blocked (>50% tests fail after retries):
```
<promise>BLOCKED</promise>
```
