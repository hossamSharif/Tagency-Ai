# Command: /test (v2 - Self-Fixing)

> Complete autonomous testing AND fixing workflow

---

## Usage

```bash
/test [feature-branch]
```

---

## What This Does

```
/test = Generate Plan → Execute Tests → FIX BUGS → Report

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PLAN                                                  │
│  └── Generate TEST-PLAN.md from specs                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: EXECUTE + FIX (Ralph Wiggum Loop)                     │
│  ├── Run each test                                              │
│  ├── If fail: READ DOCS → FIX → COMMIT → RE-TEST                │
│  ├── Continue until all tests processed                         │
│  └── Generate TEST-REPORT.md with all fixes                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT                                                         │
│  ├── All bugs FIXED and committed                               │
│  ├── TEST-REPORT.md with fix details                            │
│  └── <promise>ALL_TESTS_COMPLETE</promise>                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   YOU ARE A DEVELOPER-TESTER                                    │
│                                                                 │
│   When you find a bug:                                          │
│   1. READ specs/[branch]/spec.md + tasks.md                     │
│   2. READ the failing component code                            │
│   3. ANALYZE root cause                                         │
│   4. FIX the bug (write code)                                   │
│   5. COMMIT the fix                                             │
│   6. RE-TEST                                                    │
│   7. CONTINUE                                                   │
│                                                                 │
│   You NEVER just report bugs.                                   │
│   You NEVER wait for humans.                                    │
│   You FIX and CONTINUE.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
You are an autonomous DEVELOPER-TESTER. Generate test plan, execute tests, and FIX all bugs yourself.

## PHASE 1: ENVIRONMENT DETECTION

1. Detect database (Supabase/Firebase)
2. Find running app (ports 3000-3005)
3. Verify correct project
4. Read specs/[branch]/ directory

## PHASE 2: GENERATE TEST-PLAN.md

From specs/[branch]/spec.md and tasks.md:
- Extract all pages/routes
- Extract all components
- Extract all features
- Generate test cases for each

Include test types:
- UI render tests
- i18n tests
- CRUD tests
- Validation tests
- Mobile tests

Add HARD STOP markers after each section.

Save to: specs/[branch]/TEST-PLAN.md

## PHASE 3: EXECUTE WITH SELF-FIXING

Use Ralph Wiggum loop:

```bash
/ralph-loop "Execute TEST-PLAN.md as DEVELOPER-TESTER.

FOR EACH TEST:

1. EXECUTE test via Chrome MCP / DB MCP

2. IF PASS:
   - Mark [x]
   - Continue

3. IF FAIL:
   
   a. CAPTURE:
      - Screenshot to specs/[branch]/screenshots/
      - Console errors
      - Expected vs actual
   
   b. READ DOCS (MANDATORY):
      ```
      cat specs/[branch]/spec.md
      cat specs/[branch]/tasks.md
      cat specs/[branch]/*.md
      cat [failing-component-path]
      ```
   
   c. ANALYZE:
      - What does spec say it should do?
      - What does code actually do?
      - Where is the mismatch?
   
   d. FIX:
      - Write code fix based on spec
      - Handle edge cases from docs
      - For i18n: add translations
      - For UI: fix components/styles
      - For CRUD: fix API/DB logic
      - For validation: fix schemas
   
   e. COMMIT:
      git add .
      git commit -m 'fix([scope]): [description]'
   
   f. RE-TEST:
      - Run same test
      - If pass: mark [x], continue
      - If fail: repeat b-f (max 3 times)
   
   g. AFTER 3 ATTEMPTS:
      - Mark BLOCKED with details
      - Continue to next test

HARD STOPS:
- Verify all section tests complete
- Note any BLOCKED
- Continue to next section

AT END:
- Generate TEST-REPORT.md
- Include all fixes with commits
- Include any BLOCKED with attempts

OUTPUT:
- <promise>ALL_TESTS_COMPLETE</promise> when done
- <promise>BLOCKED</promise> if >50% blocked
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

## PHASE 4: FINAL REPORT

Generate specs/[branch]/TEST-REPORT.md:

```markdown
# TEST REPORT: [Feature]

Status: ✅ COMPLETE

## Summary
| Metric | Count |
|--------|-------|
| Total | XX |
| Passed (First) | XX |
| Passed (Fixed) | XX |
| Blocked | XX |

## Fixes Applied
| Test | Bug | Fix | Commit |
|------|-----|-----|--------|
| ... | ... | ... | ... |

## Fix Details
### Fix #1
- Bug: ...
- Spec Reference: ...
- Solution: ...
- Commit: ...

## Blocked (if any)
### [Test ID]
- Attempt 1: ...
- Attempt 2: ...
- Attempt 3: ...
```

---

## Bug Fix Protocols

### i18n (Translation Keys Showing)

```
1. Read spec for required translations
2. Find translation files (locales/*.json)
3. Add missing keys to ALL language files
4. Check useTranslation() usage
5. Commit: fix(i18n): add [keys] translations
```

### UI (Render Issues)

```
1. Read spec for UI requirements
2. Read component source
3. Fix JSX, props, or styles
4. Handle RTL for Arabic (dir="rtl")
5. Commit: fix(ui): [description]
```

### CRUD (Data Issues)

```
1. Read spec for data requirements
2. Read API route and DB queries
3. Fix query logic or response handling
4. Verify with Supabase/Firebase MCP
5. Commit: fix(crud): [description]
```

### Validation (Form Issues)

```
1. Read spec for validation rules
2. Read form schema (zod/yup)
3. Fix validation logic
4. Commit: fix(validation): [description]
```

### Logic (Wrong Behavior)

```
1. Read spec for expected behavior
2. Trace code logic
3. Rewrite to match spec
4. Commit: fix(logic): [description]
```

---

## Output Files

```
specs/[branch]/
├── TEST-PLAN.md         # Generated test plan
├── TEST-REPORT.md       # Report with all fixes
└── screenshots/         # Failure evidence
```

---

## Success Output

```
✅ TEST-PLAN.md generated
✅ All tests executed
✅ X bugs found and FIXED
✅ X commits made
✅ TEST-REPORT.md generated

<promise>ALL_TESTS_COMPLETE</promise>
```

---

## Rules

### ALWAYS ✅
- Read docs before ANY fix
- Fix bugs yourself
- Commit each fix
- Re-test after fix
- Continue after fix or block
- Try 3 times before blocking

### NEVER ❌
- Report bugs without fixing
- Wait for human
- Skip reading docs
- Give up after 1 attempt
- Stop the loop mid-execution
```