# Command: /test-plan (v2)

> Generates TEST-PLAN.md optimized for self-fixing execution

---

## Usage

```bash
/test-plan [feature-branch]
```

---

## Execution Prompt

```
Generate a comprehensive TEST-PLAN.md for autonomous self-fixing execution.

## PHASE 1: ENVIRONMENT DETECTION

1. Detect database type:
   - Check supabase/config.toml or firebase.json
   - Check package.json dependencies
   - Check .env files

2. Find running app:
   - Check ports 3000-3005
   - Verify correct project
   - Start if needed (npm run dev)

3. Identify spec directory:
   - Use provided branch or current git branch
   - Path: specs/[branch]/

## PHASE 2: READ SPECS

Read and analyze:
- specs/[branch]/spec.md → Feature requirements
- specs/[branch]/tasks.md → Implementation details
- specs/[branch]/*.md → Additional docs

Extract:
- All pages/routes
- All components
- All API endpoints
- Database schema
- Form validations
- i18n requirements
- User roles

## PHASE 3: GENERATE TEST-PLAN.md

Output: specs/[branch]/TEST-PLAN.md

Structure:

```markdown
# TEST-PLAN: [Feature Name]

Generated: [timestamp]
Spec Source: specs/[branch]/
Mode: SELF-FIXING (agent fixes bugs, not just reports)

---

## 🔧 Environment

| Setting | Value |
|---------|-------|
| App URL | http://localhost:[port] |
| Database | [supabase/firebase] |
| Auth Account | hossamsharif1990@gmail.com |
| Viewports | Desktop (1920x1080), Mobile (375x812) |

---

## 📖 Reference Docs (Read Before Fixing)

| Doc | Path | Purpose |
|-----|------|---------|
| Feature Spec | specs/[branch]/spec.md | Requirements |
| Tasks | specs/[branch]/tasks.md | Implementation |
| [Others] | specs/[branch]/[name].md | [Purpose] |

---

## 🔐 Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate → Enter creds → Submit | Dashboard | Chrome | [ ] |
| AUTH-2 | Session | Refresh page | Stay logged in | Chrome | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/spec.md - Auth section
2. Check: Login form, auth API, middleware
3. Fix: Based on spec requirements
4. Commit: fix(auth): [description]

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Correct user role

---

## 📄 Page: [/route-name]

### Reference
- Spec Section: [X.X]
- Component: [path/to/component]
- API: [/api/route]

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-UI-1 | Page Load | Navigate | Renders | Chrome | [ ] |
| [PAGE]-UI-2 | Elements | Check presence | All visible | Chrome | [ ] |
| [PAGE]-UI-3 | RTL | Check alignment | Right-aligned | Chrome | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/spec.md - Section [X]
2. Read: [component-path]
3. Fix: JSX, props, styles, RTL
4. Commit: fix(ui): [description]

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-i18n-1 | Translations | Scan text | No raw keys | Chrome | [ ] |
| [PAGE]-i18n-2 | Arabic | Check text | Proper Arabic | Chrome | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/spec.md - i18n section
2. Find: locales/ar.json or equivalent
3. Add: Missing translation keys
4. Check: useTranslation() usage
5. Commit: fix(i18n): add [keys] translations

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-CRUD-1 | Create | Fill form → Submit | New DB record | Chrome+DB | [ ] |
| [PAGE]-CRUD-2 | Read | Load page | Data from DB | Chrome+DB | [ ] |
| [PAGE]-CRUD-3 | Update | Edit → Save | DB updated | Chrome+DB | [ ] |
| [PAGE]-CRUD-4 | Delete | Remove → Confirm | DB record gone | Chrome+DB | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/tasks.md - CRUD section
2. Check: API route handler
3. Check: Database query
4. Check: Form submission logic
5. Verify: DB schema with Supabase/Firebase MCP
6. Fix: Based on spec data requirements
7. Commit: fix(crud): [description]

### Validation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-VAL-1 | Required | Submit empty | Error message | Chrome | [ ] |
| [PAGE]-VAL-2 | Format | Invalid input | Validation error | Chrome | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/spec.md - Validation rules
2. Check: Form schema (zod/yup)
3. Fix: Validation logic
4. Commit: fix(validation): [description]

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-MOB-1 | Layout | 375x812 viewport | Responsive | Chrome | [ ] |
| [PAGE]-MOB-2 | RTL Mobile | Check alignment | Correct | Chrome | [ ] |

**Fix Protocol (if fails):**
1. Read: specs/[branch]/spec.md - Responsive requirements
2. Check: Tailwind classes, media queries
3. Fix: Add responsive/RTL classes
4. Commit: fix(ui): responsive [page]

### **HARD STOP** - [Page Name] Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] All CRUD verified
- [ ] Mobile tested

---

[REPEAT FOR EACH PAGE]

---

## 🔄 Self-Fix Protocol Summary

When ANY test fails:

1. **CAPTURE** - Screenshot, console errors
2. **READ DOCS** - spec.md, tasks.md, component code
3. **ANALYZE** - Spec says X, code does Y
4. **FIX** - Write code to match spec
5. **COMMIT** - fix([scope]): [description]
6. **RE-TEST** - Run same test
7. **REPEAT** - Up to 3 attempts
8. **BLOCK** - Only after 3 failed fixes

---

## ✅ Success Criteria

```
- All [ ] marked [x] OR documented as BLOCKED
- All fixes committed with proper messages
- TEST-REPORT.md generated
- <promise>ALL_TESTS_COMPLETE</promise>
```

---

## 🔄 Execution Command

\`\`\`bash
/ralph-loop "Execute this TEST-PLAN.md as DEVELOPER-TESTER.
Read docs before fixing. Fix bugs yourself. Commit each fix.
Output <promise>ALL_TESTS_COMPLETE</promise> when done."
--max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
\`\`\`
```

---

## Key Additions for Self-Fixing

1. **Reference Docs Section** - Lists all docs to read
2. **Fix Protocol per Test Type** - Specific instructions
3. **Component Paths** - Where to look for code
4. **Spec Section References** - Which part of spec to read
```