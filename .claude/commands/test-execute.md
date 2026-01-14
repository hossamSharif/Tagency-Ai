# Command: /test-execute (v2 - Self-Fixing)

> Executes TEST-PLAN.md as a DEVELOPER-TESTER who fixes bugs, not just reports them

---

## Usage

```bash
/test-execute [feature-branch]
```

---

## 🎯 Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU ARE A DEVELOPER-TESTER                                     │
│                                                                 │
│  When you find a bug:                                           │
│  1. READ the docs (spec.md, tasks.md)                           │
│  2. FIX the bug yourself                                        │
│  3. COMMIT the fix                                              │
│  4. RE-TEST                                                     │
│  5. CONTINUE                                                    │
│                                                                 │
│  You NEVER report bugs for someone else to fix.                 │
│  You NEVER wait for human intervention.                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
You are an autonomous DEVELOPER-TESTER. Your job is to test AND fix bugs.

## STRICT RULES

1. When a test FAILS, you MUST:
   - READ docs FIRST (mandatory before any fix)
   - FIX the bug yourself
   - COMMIT the fix
   - RE-TEST
   - Only mark BLOCKED after 3 failed fix attempts

2. You NEVER:
   - Report bugs without fixing them
   - Wait for human to fix bugs
   - Skip reading docs before fixing
   - Stop the test loop (except HARD STOP verification)

---

## EXECUTION FLOW

### Setup Phase

```bash
# 1. Find running app
for PORT in 3000 3001 3002 3003 3004 3005; do
  if curl -s http://localhost:$PORT > /dev/null; then
    APP_URL="http://localhost:$PORT"
    break
  fi
done

# 2. Start if needed
if [ -z "$APP_URL" ]; then
  npm run dev &
  sleep 15
  APP_URL="http://localhost:3000"
fi

# 3. Verify correct app
# Navigate to known route, check it loads
```

### Authentication Phase

```javascript
// Login via Chrome MCP
await chrome.navigate({ url: `${APP_URL}/login` })
await chrome.type({ selector: 'input[name="email"]', text: 'hossamsharif1990@gmail.com' })
await chrome.type({ selector: 'input[name="password"]', text: 'Hossam1990@' })
await chrome.click({ selector: 'button[type="submit"]' })

// If fails, try backup accounts or create via CLI
```

### Test Execution Phase

FOR EACH test in TEST-PLAN.md:

```
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTE TEST                                                   │
│  └── Use Chrome MCP / DB MCP as specified                       │
└─────────────────────────────────────────────────────────────────┘
          │
          ├── IF PASS ────────────────────────────────────────────┐
          │                                                       │
          │   ┌───────────────────────────────────────────────┐   │
          │   │  1. Mark [x] in TEST-PLAN.md                  │   │
          │   │  2. Continue to next test                     │   │
          │   └───────────────────────────────────────────────┘   │
          │                                                       │
          └── IF FAIL ────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CAPTURE FAILURE                                        │
│  ├── Screenshot: specs/[branch]/screenshots/[ID]-fail.png       │
│  ├── Console errors: chrome.getConsoleLogs()                    │
│  └── Note: expected vs actual behavior                          │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: READ DOCS (MANDATORY - DO NOT SKIP)                    │
│                                                                 │
│  Execute these commands:                                        │
│                                                                 │
│  # Read feature spec                                            │
│  cat specs/[branch]/spec.md                                     │
│                                                                 │
│  # Read implementation tasks                                    │
│  cat specs/[branch]/tasks.md                                    │
│                                                                 │
│  # Read any other docs                                          │
│  ls specs/[branch]/*.md                                         │
│  cat specs/[branch]/[other-docs].md                             │
│                                                                 │
│  # Read failing component/page source                           │
│  cat [path/to/component.tsx]                                    │
│                                                                 │
│  # Read related files (hooks, utils, API)                       │
│  cat [related-files]                                            │
│                                                                 │
│  EXTRACT:                                                       │
│  - What should this feature do? (from spec.md)                  │
│  - How should it behave? (from spec.md)                         │
│  - What data format is expected? (from spec.md/tasks.md)        │
│  - What edge cases exist? (from docs)                           │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: ANALYZE ROOT CAUSE                                     │
│                                                                 │
│  Compare:                                                       │
│  - SPEC says: [requirement from docs]                           │
│  - CODE does: [actual behavior]                                 │
│  - DIFFERENCE: [the bug]                                        │
│                                                                 │
│  Identify bug type:                                             │
│  - i18n (missing translations)                                  │
│  - UI (render issues, RTL, missing elements)                    │
│  - CRUD (data not saving/loading)                               │
│  - Validation (form issues)                                     │
│  - Logic (wrong behavior)                                       │
│  - API (endpoint errors)                                        │
│  - Types (TypeScript errors)                                    │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: IMPLEMENT FIX                                          │
│                                                                 │
│  Based on spec requirements:                                    │
│  - Write code that matches spec                                 │
│  - Handle edge cases from docs                                  │
│  - Follow project patterns                                      │
│  - Add missing translations if needed                           │
│                                                                 │
│  For i18n bugs:                                                 │
│  - Add keys to locales/ar.json (and other langs)                │
│  - Check useTranslation() usage                                 │
│  - Check i18n config                                            │
│                                                                 │
│  For UI bugs:                                                   │
│  - Fix component JSX                                            │
│  - Fix Tailwind/CSS classes                                     │
│  - Add RTL support (dir="rtl", space-x-reverse, etc.)          │
│                                                                 │
│  For CRUD bugs:                                                 │
│  - Fix API route handler                                        │
│  - Fix database query                                           │
│  - Fix form submission                                          │
│                                                                 │
│  For validation bugs:                                           │
│  - Fix schema (zod/yup)                                         │
│  - Fix form validation logic                                    │
│                                                                 │
│  For logic bugs:                                                │
│  - Rewrite logic to match spec                                  │
│  - Handle conditions from spec                                  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: COMMIT FIX                                             │
│                                                                 │
│  git add .                                                      │
│  git commit -m "fix([scope]): [description]"                    │
│                                                                 │
│  Scope examples:                                                │
│  - fix(i18n): add expenses page translations                    │
│  - fix(ui): correct RTL alignment in sidebar                    │
│  - fix(crud): handle empty response in list                     │
│  - fix(validation): add required check for amount               │
│  - fix(api): return proper error status                         │
│  - fix(logic): calculate total correctly                        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: RE-TEST                                                │
│                                                                 │
│  Run the SAME test again                                        │
│                                                                 │
│  IF PASS:                                                       │
│  - Mark [x] in TEST-PLAN.md                                     │
│  - Log fix in TEST-REPORT.md                                    │
│  - Continue to next test                                        │
│                                                                 │
│  IF STILL FAILS:                                                │
│  - Increment attempt counter                                    │
│  - If attempts < 3: Go back to STEP 2                           │
│  - If attempts = 3: Go to STEP 7                                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼ (only after 3 attempts)
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: MARK BLOCKED (Last Resort)                             │
│                                                                 │
│  Document in TEST-PLAN.md:                                      │
│  - [BLOCKED] Test ID                                            │
│  - Attempt 1: [what was tried] → [why failed]                   │
│  - Attempt 2: [what was tried] → [why failed]                   │
│  - Attempt 3: [what was tried] → [why failed]                   │
│                                                                 │
│  CONTINUE to next test (do NOT stop)                            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  NEXT TEST                                                      │
│  └── Repeat entire flow                                         │
└─────────────────────────────────────────────────────────────────┘
```

### HARD STOP Handling

At each `### **HARD STOP**` marker:

1. Check all tests in section
2. If any [ ] remain → Go back and complete them
3. If any BLOCKED → Note but continue
4. Proceed to next section

### Report Generation

After ALL tests processed, generate `specs/[branch]/TEST-REPORT.md`:

```markdown
# TEST REPORT: [Feature Name]

Generated: [timestamp]
Duration: [X minutes]
Status: ✅ ALL PASSED | ⚠️ FIXED | ❌ HAS BLOCKED

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed (First Try) | XX |
| Passed (After Fix) | XX |
| Blocked | XX |
| Total Fixes Applied | XX |

## Fixes Applied

| Test ID | Bug Type | Root Cause | Fix | Commit |
|---------|----------|------------|-----|--------|
| EXP-i18n-1 | i18n | Missing keys | Added to ar.json | abc123 |
| EXP-UI-2 | UI | No RTL | Added dir="rtl" | def456 |

## Fix Details

### Fix #1: [Test ID]
**Bug:** [Description]
**Spec Reference:** specs/[branch]/spec.md - [Section]
**Root Cause:** [Analysis]
**Solution:** [What was fixed]
**Files Changed:** [List]
**Commit:** [Hash]

```diff
[Code diff]
```

## Blocked Tests

### [Test ID] - BLOCKED
**Attempts:**
1. Tried: [X] → Failed: [Y]
2. Tried: [X] → Failed: [Y]
3. Tried: [X] → Failed: [Y]

**Likely Cause:** [Theory]
**Files to Review:** [Paths]
```

### Completion

**If all tests PASS or FIXED:**
```
<promise>ALL_TESTS_COMPLETE</promise>
```

**If >50% tests BLOCKED after 3 attempts each:**
```
<promise>BLOCKED</promise>
```

---

## Ralph Wiggum Wrapper

```bash
/ralph-loop "Execute TEST-PLAN.md as DEVELOPER-TESTER.

CORE BEHAVIOR:
- When test fails → READ DOCS → FIX → COMMIT → RE-TEST
- Never report bugs without fixing
- Never wait for human
- Continue until all tests processed

DOC READING (MANDATORY before any fix):
cat specs/[branch]/spec.md
cat specs/[branch]/tasks.md
cat [failing-component-path]

FIX COMMIT FORMAT:
git commit -m 'fix([scope]): [desc]'

COMPLETION:
- <promise>ALL_TESTS_COMPLETE</promise> when done
- <promise>BLOCKED</promise> if >50% blocked after 3 attempts each
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## Example Fix Session

```
TEST: EXP-i18n-1 - Check translations
RESULT: FAIL - "expenses.title" showing instead of Arabic

STEP 1: Screenshot saved

STEP 2: Reading docs...
$ cat specs/expenses/spec.md
> Section 3.2: All UI text must be translated to Arabic
> Required keys: expenses.title = "المصروفات"

$ cat specs/expenses/tasks.md
> Task 4: Add i18n support using next-i18next

$ cat components/expenses/ExpensesPage.tsx
> const { t } = useTranslation('expenses')
> <h1>{t('title')}</h1>

STEP 3: Analysis
- SPEC: title should be "المصروفات"
- CODE: uses t('title') but key missing from ar.json
- ROOT CAUSE: Translation key not added

STEP 4: Implementing fix...
$ cat locales/ar.json
// Adding:
{
  "expenses": {
    "title": "المصروفات"
  }
}

STEP 5: Committing...
$ git add locales/ar.json
$ git commit -m "fix(i18n): add expenses.title Arabic translation"

STEP 6: Re-testing...
RESULT: PASS ✅

Moving to next test...
```

---

## DO NOT

- ❌ Report bugs without attempting fix
- ❌ Wait for human to fix anything
- ❌ Skip reading docs before fixing
- ❌ Give up after 1 failed attempt (try 3 times)
- ❌ Stop the loop (except HARD STOP)
- ❌ Mark BLOCKED without 3 genuine fix attempts
```