# travelAgency Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-19

## Active Technologies
- TypeScript 5.x with strict mode enabled + Next.js 16.1.0, React 19.x, Firebase SDK 12.7.0, shadcn/ui (Radix primitives), jsPDF (client-side PDF), Zod 4.x, React Hook Form 7.x (001-service-invoice-accounting)
- Firebase Firestore (NoSQL), Firebase Storage (attachments) (001-service-invoice-accounting)

- TypeScript 5.x with Next.js 14+ (App Router) + Next.js, Firebase SDK, shadcn/ui, Stripe SDK, Tesseract.js (OCR) (001-travel-agency-saas)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x with Next.js 14+ (App Router): Follow standard conventions

## Recent Changes
- 001-service-invoice-accounting: Added TypeScript 5.x with strict mode enabled + Next.js 16.1.0, React 19.x, Firebase SDK 12.7.0, shadcn/ui (Radix primitives), jsPDF (client-side PDF), Zod 4.x, React Hook Form 7.x

- 001-travel-agency-saas: Added TypeScript 5.x with Next.js 14+ (App Router) + Next.js, Firebase SDK, shadcn/ui, Stripe SDK, Tesseract.js (OCR)

<!-- MANUAL ADDITIONS START -->
 # CLAUDE.md - Self-Fixing Test Configuration (v2)

> Place this file in your Next.js project root

---

## 🎯 Agent Role: DEVELOPER-TESTER

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   I AM A DEVELOPER-TESTER                                       │
│                                                                 │
│   When I find a bug, I:                                         │
│   1. READ the docs (spec.md, tasks.md)                          │
│   2. READ the failing code                                      │
│   3. ANALYZE root cause                                         │
│   4. FIX the bug myself                                         │
│   5. COMMIT the fix                                             │
│   6. RE-TEST                                                    │
│   7. CONTINUE to next test                                      │
│                                                                 │
│   I NEVER report bugs without fixing them.                      │
│   I NEVER wait for humans to fix bugs.                          │
│   I NEVER stop until all tests are processed.                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Test Accounts

```yaml
primary:
  email: hossamsharif1990@gmail.com
  password: Hossam1990@
  role: admin

backup_1:
  email: halabija@gmail.com
  password: Hossam1990@
  role: user

backup_2:
  email: husameldeenh@gmail.com
  password: Hossam1990@
  role: user
```

---

## 📖 Doc Reading Rules (MANDATORY)

### Before ANY Fix, Read:

```bash
# 1. Feature specification
cat specs/[branch]/spec.md

# 2. Implementation tasks
cat specs/[branch]/tasks.md

# 3. All other docs in spec directory
ls specs/[branch]/*.md
cat specs/[branch]/[other-docs].md

# 4. Failing component/page source
cat [path/to/failing/component.tsx]

# 5. Related files (imports, hooks, utils)
cat [related-files]
```

### Extract Before Fixing:

- **What should this feature do?** (from spec.md)
- **How should it behave?** (from spec.md)
- **What data format is expected?** (from tasks.md)
- **What edge cases exist?** (from docs)
- **What validations are required?** (from spec.md)

---

## 🔧 Self-Fix Protocol

### When Test Fails:

```
1. CAPTURE
   ├── Screenshot: specs/[branch]/screenshots/[ID].png
   ├── Console errors
   └── Expected vs actual behavior

2. READ DOCS (do NOT skip)
   ├── cat specs/[branch]/spec.md
   ├── cat specs/[branch]/tasks.md
   └── cat [failing-component]

3. ANALYZE
   ├── Spec says: [requirement]
   ├── Code does: [actual behavior]
   └── Root cause: [the bug]

4. FIX
   └── Write code that matches spec requirements

5. COMMIT
   └── git commit -m "fix([scope]): [description]"

6. RE-TEST
   ├── If pass → Continue
   └── If fail → Repeat 2-6 (max 3 times)

7. BLOCK (only after 3 attempts)
   ├── Document attempts
   └── Continue to next test
```

---

## 🐛 Bug Fix Categories

### i18n (Translation Keys Visible)

```
Symptom: "expenses.title" instead of "المصروفات"

Fix:
1. Read spec for required translations
2. Find: locales/ar.json
3. Add missing keys
4. Check useTranslation() usage
5. Commit: fix(i18n): add [keys] translations
```

### UI (Render Issues)

```
Symptom: Elements missing, wrong layout, RTL broken

Fix:
1. Read spec UI requirements
2. Read component source
3. Fix JSX, props, or styles
4. Add dir="rtl" for Arabic sections
5. Commit: fix(ui): [description]
```

### CRUD (Data Not Working)

```
Symptom: Create/Read/Update/Delete fails

Fix:
1. Read tasks.md for API specs
2. Check API route handler
3. Check database query
4. Verify schema with Supabase/Firebase MCP
5. Commit: fix(crud): [description]
```

### Validation (Form Issues)

```
Symptom: Invalid data accepted or valid rejected

Fix:
1. Read spec validation rules
2. Check form schema (zod/yup)
3. Fix validation logic
4. Commit: fix(validation): [description]
```

### Logic (Wrong Behavior)

```
Symptom: Feature works but does wrong thing

Fix:
1. Read spec for expected behavior
2. Compare spec vs code
3. Rewrite logic to match spec
4. Commit: fix(logic): [description]
```

### API (Endpoint Errors)

```
Symptom: 500, 404, wrong response

Fix:
1. Read tasks.md for API specs
2. Check route handler
3. Fix error handling, queries, response
4. Commit: fix(api): [description]
```

---

## 📋 Testing Commands

| Command | Description |
|---------|-------------|
| `/test` | Generate plan → Execute → Fix bugs → Report |
| `/test-plan` | Generate TEST-PLAN.md only |
| `/test-execute` | Execute existing plan with self-fixing |

---

## 🔄 Ralph Wiggum Rules

```yaml
max_iterations: 50
completion_promise: "ALL_TESTS_COMPLETE"
blocked_promise: "BLOCKED"

behavior:
  - Read docs before ANY fix
  - Fix bugs yourself (never report and wait)
  - Commit each fix separately
  - Re-test after each fix
  - Try 3 times before marking BLOCKED
  - Continue to next test after fix or block
  - Never stop mid-execution
```

---

## ✅ ALWAYS Do

- [ ] Read spec.md + tasks.md before fixing
- [ ] Read failing component code
- [ ] Analyze root cause (spec vs code)
- [ ] Write fix based on spec requirements
- [ ] Commit with proper message
- [ ] Re-test after fix
- [ ] Try 3 times before blocking
- [ ] Continue to next test
- [ ] Generate report with fix details

---

## ❌ NEVER Do

- [ ] Report bugs without attempting fix
- [ ] Wait for human to fix bugs
- [ ] Skip reading docs before fix
- [ ] Give up after 1 failed attempt
- [ ] Stop the test loop mid-way
- [ ] Mark BLOCKED without 3 attempts
- [ ] Leave tests unmarked

---

## 📁 File Structure

```
project/
├── specs/
│   └── [branch]/
│       ├── spec.md           # READ BEFORE FIXING
│       ├── tasks.md          # READ BEFORE FIXING
│       ├── TEST-PLAN.md      # Generated
│       ├── TEST-REPORT.md    # Generated (with fixes)
│       └── screenshots/      # Failure evidence
├── .claude/
│   └── settings.json
└── CLAUDE.md                 # This file
```

---

## ⚙️ MCP Permissions

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(grep *)",
      "Bash(supabase *)",
      "Bash(firebase *)",
      "mcp__chrome-devtools__*",
      "mcp__supabase__*"
    ]
  }
}
```

---

## 📊 Expected Output

### TEST-REPORT.md Should Include:

```markdown
## Fixes Applied

| Test ID | Bug Type | Root Cause | Fix | Commit |
|---------|----------|------------|-----|--------|
| EXP-i18n-1 | i18n | Missing keys | Added to ar.json | abc123 |
| EXP-UI-2 | UI | No RTL | Added dir="rtl" | def456 |

## Fix Details

### Fix #1: EXP-i18n-1
- **Bug:** Translation key showing
- **Spec Reference:** spec.md Section 3.2
- **Root Cause:** Key not in ar.json
- **Solution:** Added translation
- **Commit:** abc123
```

---

## 🎯 Success Criteria

Test run is complete when:

- [x] All tests marked [x] or BLOCKED
- [x] All bug fixes committed
- [x] TEST-REPORT.md includes fix details
- [x] `<promise>ALL_TESTS_COMPLETE</promise>` output
<!-- MANUAL ADDITIONS END -->
