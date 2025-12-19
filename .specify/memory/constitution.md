<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: 1.1.0 → 2.0.0 (MAJOR - Database paradigm replacement + new payment principle)

Modified Principles:
  - Principle II: "Database Operations via Supabase MCP" → "Database Operations via Firebase CLI"
  - MCP Tool Requirements: Replaced Supabase tools with Firebase CLI commands

Added Sections:
  - Principle VIII: Payment Operations via Stripe CLI
  - Stripe CLI Commands reference table
  - Configuration Keys Reference section

Removed Sections:
  - Supabase MCP Tools table (replaced with Firebase CLI)
  - Supabase branching workflow

Templates Status:
  ✅ .specify/templates/plan-template.md - Compatible (no database-specific references)
  ✅ .specify/templates/spec-template.md - Compatible (technology-agnostic)
  ✅ .specify/templates/tasks-template.md - Compatible (generic task structure)

Follow-up TODOs: None

Previous Version: 1.1.0 (2025-12-19)
Current Amendment: 2025-12-19
================================================================================
-->

# Travel Agency SaaS Constitution

## Core Principles

### I. MCP-First Development

The AI agent MUST prioritize MCP (Model Context Protocol) tools over manual operations
for all supported tasks. MCP tools provide structured, reliable, and auditable
interactions with external services.

**Non-negotiable rules:**
- Before searching for documentation or technical guidance, the agent MUST use Ref MCP tools
- Before performing browser-based testing or validation, the agent MUST use Chrome MCP tools
- For database operations, the agent MUST use Firebase CLI commands
- For payment operations, the agent MUST use Stripe CLI commands
- Manual alternatives are ONLY permitted when no CLI/MCP tool exists for the required operation
- The agent MUST document which tool was used for each significant operation

**Rationale:** CLI tools and MCP tools ensure consistent, reproducible operations and provide
audit trails for all external service interactions.

### II. Database Operations via Firebase CLI

All database and backend operations MUST use Firebase CLI when applicable.

**Configuration Keys:**
The Firebase configuration is stored in `myKeys.md` and MUST be used for all Firebase operations:
- Project ID: `tagency-ai`
- Auth Domain: `tagency-ai.firebaseapp.com`
- Storage Bucket: `tagency-ai.firebasestorage.app`

**Mandatory Firebase CLI usage:**
- `firebase init` - MUST be used to initialize Firebase in the project
- `firebase login` - MUST be used to authenticate before any Firebase operation
- `firebase deploy` - MUST be used for ALL deployment operations
- `firebase firestore:indexes` - MUST be used to manage Firestore indexes
- `firebase emulators:start` - MUST be used for local development and testing
- `firebase functions:log` - MUST be used for debugging Cloud Functions
- `firebase hosting:channel:deploy` - MUST be used for preview deployments

**Database operations:**
- `firebase firestore:delete` - Use for document/collection deletion
- `firebase firestore:export` - Use for data backup
- `firebase firestore:import` - Use for data restoration

**Authentication operations:**
- `firebase auth:export` - Use for exporting user accounts
- `firebase auth:import` - Use for importing user accounts

**Rationale:** Firebase CLI ensures all database operations are tracked, reversible,
and consistent with the Firebase project configuration.

### III. Documentation-Driven Development via Ref MCP

The AI agent MUST use Ref MCP tools for all documentation lookup and research tasks.

**Mandatory MCP tool usage:**
- `mcp__Ref__ref_search_documentation` - MUST be used when searching for:
  - Framework documentation (Next.js, React, Firebase, etc.)
  - Library APIs (Stripe SDK, Tesseract.js, shadcn/ui)
  - Best practices and implementation patterns
  - Troubleshooting and error resolution
- `mcp__Ref__ref_read_url` - MUST be used to read full content from search results

**Query requirements:**
- Queries MUST include programming language (TypeScript)
- Queries MUST include relevant framework/library names
- Add `ref_src=private` when searching private documentation

**Rationale:** Ref MCP provides curated, up-to-date documentation access and ensures
the agent uses authoritative sources rather than outdated or unreliable information.

### IV. Browser Automation via Chrome MCP

All browser-based testing, validation, and UI automation MUST use Chrome MCP tools.

**Mandatory MCP tool usage:**
- `chrome_navigate` - Navigate to application URLs for testing
- `chrome_screenshot` - Capture visual state for verification
- `chrome_click` - Interact with UI elements during testing
- `chrome_fill` - Fill form fields for end-to-end testing
- `chrome_evaluate` - Execute JavaScript for advanced testing scenarios
- `chrome_get_content` - Extract page content for validation
- `chrome_scroll` - Test scroll behavior and lazy loading
- `chrome_select` - Test dropdown and select interactions
- `chrome_hover` - Test hover states and tooltips

**Testing workflow:**
1. Use `chrome_navigate` to load the target page
2. Use `chrome_screenshot` to capture initial state
3. Perform interactions using appropriate tools
4. Use `chrome_screenshot` to capture final state
5. Use `chrome_get_content` to validate expected content

**Rationale:** Chrome MCP provides programmatic, repeatable browser interactions
essential for reliable UI testing and validation.

### V. Test-First Development

Test-Driven Development (TDD) is mandatory for all feature implementation.

**Non-negotiable rules:**
- Tests MUST be written before implementation code
- Tests MUST fail before implementation begins (Red phase)
- Implementation MUST make tests pass (Green phase)
- Refactoring MUST maintain passing tests (Refactor phase)
- Use Chrome MCP for end-to-end UI tests
- Use standard testing frameworks (Jest, Playwright) for unit/integration tests

**Rationale:** TDD ensures code correctness, prevents regressions, and produces
self-documenting code through comprehensive test suites.

### VI. Simplicity and YAGNI

Start with the simplest solution that works. Avoid premature optimization and abstraction.

**Non-negotiable rules:**
- Implement only what is explicitly required
- Avoid adding features "just in case"
- Prefer composition over inheritance
- Keep functions and components focused and small
- Refactor only when complexity becomes a measurable problem

**Rationale:** Simple code is easier to understand, test, maintain, and debug.
Unnecessary complexity increases technical debt and slows development.

### VII. Commit and Push on Implementation Completion

The AI agent MUST commit all changes and push to remote after completing `/speckit.implement` tasks.

**Non-negotiable rules:**
- After ALL tasks in `tasks.md` are marked complete, the agent MUST:
  1. Run `git status` to verify all changes are tracked
  2. Run `git add .` to stage all modified and new files
  3. Run `git commit` with a descriptive message following conventional commits format
  4. Run `git push` to push changes to the remote repository
- Commit message format MUST follow: `feat(<scope>): <description>` or `fix(<scope>): <description>`
- The agent MUST NOT leave uncommitted changes after implementation completion
- If push fails due to remote changes, the agent MUST pull, resolve conflicts, and push again
- The agent MUST verify push success before reporting implementation complete

**Commit message requirements:**
- Use `feat:` for new features
- Use `fix:` for bug fixes
- Use `refactor:` for code restructuring
- Use `docs:` for documentation changes
- Use `test:` for test additions/modifications
- Include task reference in commit body when applicable

**Post-implementation verification:**
```bash
# Required sequence after /speckit.implement completion:
git status                    # Verify working tree state
git add .                     # Stage all changes
git commit -m "feat(<feature>): implement <description>"
git push origin <branch>      # Push to remote
git status                    # Confirm clean working tree
```

**Rationale:** Automatic commit and push ensures all implementation work is preserved,
shared with the team, and backed up to remote. This prevents work loss and maintains
continuous integration flow.

### VIII. Payment Operations via Stripe CLI

All payment-related operations MUST use Stripe CLI when applicable.

**Configuration Keys:**
The Stripe secret key is stored in `myKeys.md` and MUST be used for all Stripe operations.
Environment variable: `STRIPE_SECRET_KEY`

**Mandatory Stripe CLI usage:**
- `stripe login` - MUST be used to authenticate before any Stripe operation
- `stripe listen` - MUST be used for webhook development and testing
- `stripe trigger` - MUST be used to simulate webhook events during development
- `stripe logs tail` - MUST be used for debugging payment issues
- `stripe customers` - MUST be used for customer management operations
- `stripe products` - MUST be used for product/pricing management
- `stripe subscriptions` - MUST be used for subscription management
- `stripe invoices` - MUST be used for invoice operations
- `stripe payment_intents` - MUST be used for payment intent operations

**Webhook development workflow:**
1. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Use `stripe trigger <event>` to simulate payment events
3. Verify webhook handling in application logs

**Testing payments:**
- ALWAYS use Stripe test mode for development
- Use `stripe fixtures` for consistent test data
- Use `stripe samples` for reference implementations

**Rationale:** Stripe CLI provides secure, auditable payment operations with proper
test mode isolation. Direct API calls bypass logging and may introduce payment errors.

## CLI Tool Requirements

This section provides the complete reference of CLI tools that the AI agent
MUST use for applicable operations.

### Ref MCP Tools (Documentation)

| Tool | Description | When to Use |
|------|-------------|-------------|
| `mcp__Ref__ref_search_documentation` | Search for documentation on web, GitHub, or private resources | Before implementing any feature requiring external library/framework knowledge |
| `mcp__Ref__ref_read_url` | Read URL content as markdown | After finding relevant documentation via search |

### Firebase CLI Commands (Database & Backend)

| Command | Description | When to Use |
|---------|-------------|-------------|
| `firebase login` | Authenticate with Firebase | Before any Firebase operation |
| `firebase init` | Initialize Firebase in project | Project setup |
| `firebase deploy` | Deploy to Firebase | ALL deployment operations |
| `firebase deploy --only functions` | Deploy Cloud Functions only | Function-specific deployments |
| `firebase deploy --only firestore` | Deploy Firestore rules/indexes | Database rule changes |
| `firebase deploy --only hosting` | Deploy hosting only | Frontend deployments |
| `firebase emulators:start` | Start local emulators | Local development and testing |
| `firebase emulators:exec` | Run command with emulators | CI/CD testing |
| `firebase firestore:indexes` | Deploy Firestore indexes | Index management |
| `firebase firestore:delete` | Delete documents/collections | Data cleanup |
| `firebase firestore:export` | Export Firestore data | Backups |
| `firebase firestore:import` | Import Firestore data | Data restoration |
| `firebase functions:log` | View function logs | Debugging Cloud Functions |
| `firebase functions:shell` | Interactive function shell | Function testing |
| `firebase auth:export` | Export user accounts | User data backup |
| `firebase auth:import` | Import user accounts | User migration |
| `firebase hosting:channel:deploy` | Create preview deployment | PR previews |

### Stripe CLI Commands (Payments)

| Command | Description | When to Use |
|---------|-------------|-------------|
| `stripe login` | Authenticate with Stripe | Before any Stripe operation |
| `stripe listen` | Forward webhooks to local server | Webhook development |
| `stripe trigger <event>` | Trigger test webhook event | Testing webhook handlers |
| `stripe logs tail` | Stream API logs | Debugging payment issues |
| `stripe customers list` | List customers | Customer management |
| `stripe customers create` | Create customer | New customer setup |
| `stripe products list` | List products | Product catalog management |
| `stripe products create` | Create product | Adding new products |
| `stripe prices list` | List prices | Pricing management |
| `stripe prices create` | Create price | Setting up pricing |
| `stripe subscriptions list` | List subscriptions | Subscription management |
| `stripe subscriptions create` | Create subscription | New subscriptions |
| `stripe invoices list` | List invoices | Invoice management |
| `stripe payment_intents list` | List payment intents | Payment tracking |
| `stripe payment_intents create` | Create payment intent | Processing payments |
| `stripe fixtures` | Load test fixtures | Consistent test data |
| `stripe samples` | Download sample code | Reference implementations |

### Chrome MCP Tools (Browser Automation)

| Tool | Description | When to Use |
|------|-------------|-------------|
| `chrome_navigate` | Navigate to a URL | Starting any browser-based test |
| `chrome_screenshot` | Take page screenshot | Capturing visual state for verification |
| `chrome_click` | Click on an element | Interacting with UI elements |
| `chrome_fill` | Fill form fields/inputs | Testing form submissions |
| `chrome_evaluate` | Execute JavaScript in browser | Advanced testing scenarios |
| `chrome_get_content` | Get page content (HTML/text) | Validating page content |
| `chrome_scroll` | Scroll the page | Testing scroll behavior, lazy loading |
| `chrome_select` | Select dropdown options | Testing select/dropdown elements |
| `chrome_hover` | Hover over elements | Testing hover states, tooltips |

## Configuration Keys Reference

All sensitive configuration keys are stored in `myKeys.md` at the project root.

**Firebase Configuration:**
- API Key: Stored in `myKeys.md`
- Auth Domain: `tagency-ai.firebaseapp.com`
- Project ID: `tagency-ai`
- Storage Bucket: `tagency-ai.firebasestorage.app`
- Messaging Sender ID: Stored in `myKeys.md`
- App ID: Stored in `myKeys.md`

**Stripe Configuration:**
- Secret Key: Stored in `myKeys.md` as `STRIPE_SECRET_KEY`
- Mode: Test mode (sk_test_*) for development

**IMPORTANT:** Never commit `myKeys.md` to version control. Ensure it is listed in `.gitignore`.

## Development Workflow

### Pre-Implementation Checklist

Before implementing any feature, the AI agent MUST:

1. **Research Phase**
   - [ ] Use `mcp__Ref__ref_search_documentation` to find relevant documentation
   - [ ] Use `mcp__Ref__ref_read_url` to read detailed implementation guidance

2. **Database Phase** (if applicable)
   - [ ] Run `firebase login` to ensure authentication
   - [ ] Run `firebase emulators:start` for local development
   - [ ] Define Firestore security rules
   - [ ] Create/update Firestore indexes as needed
   - [ ] Test with Firebase emulators before deployment

3. **Payment Phase** (if applicable)
   - [ ] Run `stripe login` to ensure authentication
   - [ ] Start webhook listener with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - [ ] Use `stripe trigger` to test webhook handlers
   - [ ] Verify all payment flows in test mode

4. **Implementation Phase**
   - [ ] Write tests first (TDD)
   - [ ] Implement feature to pass tests
   - [ ] Use CLI tools for all external operations

5. **Validation Phase**
   - [ ] Use Chrome MCP tools for UI testing
   - [ ] Use `firebase functions:log` to verify backend operations
   - [ ] Use `stripe logs tail` to verify payment operations
   - [ ] Capture screenshots for documentation

### Post-Implementation Checklist (MANDATORY after /speckit.implement)

After ALL implementation tasks are complete, the AI agent MUST:

6. **Commit Phase**
   - [ ] Run `git status` to review all changes
   - [ ] Run `git diff` to verify changes are correct
   - [ ] Run `git add .` to stage all changes
   - [ ] Run `git commit -m "<type>(<scope>): <description>"` with conventional commit message
   - [ ] Verify commit succeeded

7. **Push Phase**
   - [ ] Run `git push origin <branch>` to push to remote
   - [ ] If push fails, run `git pull --rebase` and resolve conflicts
   - [ ] Retry push until successful
   - [ ] Run `git status` to confirm clean working tree

8. **Completion Verification**
   - [ ] Confirm all tasks in `tasks.md` are marked complete
   - [ ] Confirm working tree is clean (no uncommitted changes)
   - [ ] Confirm push to remote succeeded
   - [ ] Report implementation complete to user

### CLI Tool Selection Decision Tree

```
Is this a documentation/research task?
├── YES → Use mcp__Ref__ref_search_documentation + mcp__Ref__ref_read_url
└── NO ↓

Is this a database/backend operation?
├── YES → Use appropriate firebase <command>
└── NO ↓

Is this a payment operation?
├── YES → Use appropriate stripe <command>
└── NO ↓

Is this a browser/UI operation?
├── YES → Use appropriate chrome_* tool
└── NO ↓

Is this a code/file operation?
├── YES → Use standard file operations (Read, Write, Edit)
└── NO ↓

Is implementation complete (/speckit.implement finished)?
└── YES → Execute commit and push sequence (Principle VII)
```

## Governance

### Constitution Authority

This Constitution supersedes all other development practices for the Travel Agency SaaS
project. All development decisions MUST align with the principles defined herein.

### Amendment Procedure

1. Proposed amendments MUST be documented with rationale
2. Amendments MUST include migration plan for existing code
3. Version number MUST be updated according to semantic versioning:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or section addition
   - PATCH: Clarifications and wording improvements

### Compliance Review

- All code reviews MUST verify CLI tool usage compliance
- Pull requests MUST document which CLI tools were used
- Violations MUST be justified or corrected before merge
- Implementation completion MUST include commit and push verification
- Payment operations MUST always use Stripe test mode during development

### Enforcement

The AI agent MUST:
- Self-audit CLI tool usage during development
- Report when manual alternatives are used (with justification)
- Prioritize Firebase CLI for database operations
- Prioritize Stripe CLI for payment operations
- Commit and push all changes after `/speckit.implement` completion
- Never leave uncommitted work after implementation tasks are done
- Never use production Stripe keys during development

**Version**: 2.0.0 | **Ratified**: 2025-12-19 | **Last Amended**: 2025-12-19
