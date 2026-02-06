# AVATAR AGENCY — COMPLETE BUILD AUDIT
**Comprehensive, Stateful, Resumable Audit Report**

---

# 🔄 AUDIT STATUS TRACKER

**Audit Run**: #1
**Started**: 2026-02-06 15:45 IST
**Completed**: [ ] Not yet
**Last Updated**: 2026-02-06 19:15 IST

**Current Stage**:
- [✓] Discovery (Domain understanding complete)
- [✓] Audit (Findings documented)
- [✓] Remediation - CRITICAL (All 6/6 CRITICAL issues FIXED! 🎉)
- [→] Remediation - HIGH/MEDIUM/LOW (In progress)
- [ ] Verification (Not started)
- [ ] Complete

## Progress Dashboard
**Total Findings**: 38

- **CRITICAL**: 6 findings (✅ Fixed: 6, In Progress: 0, Pending: 0) ← ALL CRITICAL FIXED!
- **HIGH**: 9 findings (Fixed: 0, In Progress: 0, Pending: 9)
- **MEDIUM**: 14 findings (Fixed: 0, In Progress: 0, Pending: 14)
- **LOW**: 9 findings (Fixed: 0, In Progress: 0, Pending: 9)

**Requirements Coverage**:
- Total v1 Requirements: 54
- Blocked by Critical Issues: 0 requirements (down from 12! 🎉)
- Blocked by High Issues: 8 requirements
- Total Blocked: 8 requirements (15%, down from 37%)

---

# 📋 HOW TO USE THIS AUDIT FILE

## To Continue This Audit (Resume Work):
1. Read the **Current Stage** above to see where we are
2. Check **Progress Dashboard** to see what's completed
3. Jump to **FINDINGS** section below
4. Find the next `[ ] PENDING` finding with highest priority
5. Update its status to `[→] IN PROGRESS` when you start
6. After fixing: Update to `[✓] FIXED`, add commit hash, verify against requirements
7. Update the **Progress Dashboard** counts

## To Re-Run Fresh Audit (Future):
1. Archive this completed audit:
   ```bash
   mkdir -p .planning/ARCHIVE
   mv .planning/COMPLETE-AUDIT.md .planning/ARCHIVE/AUDIT-2026-02-06.md
   ```
2. In new chat, tell agent:
   > "Run a fresh audit using the methodology from `.planning/ARCHIVE/AUDIT-2026-02-06.md`"
3. Agent will create new `COMPLETE-AUDIT.md` with same methodology, fresh findings

## Commands to Resume in New Chat:
```
"Continue the audit from .planning/COMPLETE-AUDIT.md"
"What's the next critical finding to fix?"
"Show me findings blocking requirement HOOK-02"
"Mark finding B1 as fixed and verify"
```

---

# 🎯 PART 1: AUDIT & REMEDIATION METHODOLOGY

## Why This Methodology Matters

**The Problem**: Auditing code in isolation leads to:
- Fixing things that aren't broken (misunderstood use cases)
- Breaking things while fixing (domino effect)
- Inefficient debugging loops (fix A → breaks B → fix B → breaks C)
- Context rot (forgetting what you learned, repeating work)

**The Solution**: Systematic, requirement-driven, foundation-first approach.

---

## 1.1 THE AUDIT PROCESS (5 Steps)

### Step 1: Domain Understanding FIRST
**Before looking at a single line of code, understand:**
- What does this product DO? (end-to-end workflows)
- Who uses it? (user roles and permissions)
- What are the critical paths? (must-work scenarios)
- What are the requirements? (documented in requirements docs)
- What external systems does it integrate with? (APIs, webhooks, services)

**Tools**:
- Parallel explore agents (3 max) to read:
  - All planning/requirements docs
  - Roadmap and phase definitions
  - Architecture decision records
- Map the domain model BEFORE judging code

**Output**: A clear mental model of "how it's supposed to work"

---

### Step 2: Map Requirements → Implementation
**For each requirement, trace it to code:**
- Which files implement this requirement?
- Which database fields support it?
- Which API endpoints expose it?
- Which UI components surface it?

**Tools**:
- Grep for requirement IDs in code comments
- Trace user workflows through the codebase
- Build a requirements traceability matrix

**Output**: Know which code delivers which requirement (and which code doesn't map to any requirement)

---

### Step 3: Find Gaps & Breaks
**Three types of issues:**

1. **Code that BREAKS requirements** (Critical/High)
   - Functionality that fails when used as documented
   - Security holes that violate access control requirements
   - Data integrity issues that corrupt state

2. **Code that MISSES requirements** (Medium/High)
   - Required features not implemented
   - Partial implementations
   - Missing error handling on critical paths

3. **Code that's POOR but functional** (Low/Medium)
   - Works but inefficient
   - Works but unmaintainable
   - Works but violates best practices

**Tools**:
- Parallel audit agents for each layer (schema, API, UI, services)
- Cross-reference findings across agents (de-duplicate)
- Validate each finding by tracing through actual workflow

**Output**: Categorized list of issues with severity ratings

---

### Step 4: Validate Findings (Don't Assume)
**For each finding, confirm:**
- Does this ACTUALLY break a requirement? (trace it through)
- Is this dead code or misunderstood code? (check usage)
- What's the blast radius if we fix this? (dependency analysis)
- Can we reproduce the issue? (test it)

**Anti-Pattern to Avoid**:
- ❌ "This field is never used" → Fix: Delete it → Result: Breaks webhook callback
- ✓ "This field is never READ" → Check: Is it written by external webhook? → Result: It IS used, just async

**Tools**:
- Grep for all usages of suspect code
- Trace through actual user workflows
- Check git history for context ("why was this added?")

**Output**: High-confidence findings with confirmed impact

---

### Step 5: Prioritize by Impact
**Priority Matrix:**

| Severity | Definition | Examples |
|----------|------------|----------|
| **CRITICAL** | Blocks core workflow OR causes data corruption/security breach | Can't create projects, webhooks fail silently, SSRF vulnerability |
| **HIGH** | Breaks requirement OR significant data/security risk | Missing validation, race conditions, soft delete not filtered |
| **MEDIUM** | Poor design that WILL cause bugs later OR blocks non-critical requirement | Duplicated logic, inconsistent patterns, missing indexes |
| **LOW** | Code quality issue that doesn't block functionality | Dead code, poor naming, missing comments |

**Tiebreaker**: If two findings have same severity, prioritize the one that blocks MORE requirements.

**Output**: Ordered list of findings (fix critical first, low last)

---

## 1.2 THE REMEDIATION PROCESS (6 Steps)

### Step 1: Map Dependency Graph FIRST
**Before fixing anything, understand dependencies:**
- What depends on the code I'm about to change?
- What does this code depend on?
- If I change this, what else might break?

**Tools**:
- Grep for imports/usages
- Trace call chains (function A calls B calls C)
- Check database foreign keys and indexes

**Output**: Dependency map showing what's safe to change vs. what's risky

---

### Step 2: Fix Foundation Before Top Floor
**Fixing Order (Bottom-Up):**
1. **Database schema** (Prisma models, fields, indexes, enums)
2. **Services/Business Logic** (lib/services, lib/actions, state machines)
3. **API Routes** (input validation, error handling, response formats)
4. **UI Components** (pages, forms, client-side logic)
5. **Polish** (dead code removal, refactoring, constants extraction)

**Why This Order?**
- Changing schema breaks everything above it
- Changing services breaks routes and UI
- Changing routes breaks UI
- UI changes don't break anything below

**Anti-Pattern**:
- ❌ Fix UI component → Then fix API → Then fix service → Redo UI
- ✓ Fix schema → Fix service → Fix API → Fix UI (one pass)

---

### Step 3: Use Atomic Commits Per Fix
**One Issue = One Commit**

**Commit Message Format**:
```
fix(area): brief description of what was fixed

- Requirement: HOOK-02
- Issue: #B3 (Fire-and-forget webhooks)
- Files: project-actions.ts, webhook-orchestrator.ts
- Verified: Tested project creation → research webhook → callback
```

**Why Atomic?**
- Easy rollback if fix breaks something
- Clear history of what was fixed when
- Easy to review changes
- Can cherry-pick fixes to different branches

**Tools**:
- Git commit after each fix
- Don't batch unrelated fixes

---

### Step 4: Verify Each Fix Against Requirements
**After fixing, test the requirement end-to-end:**

Example for finding B3 (Fire-and-forget webhooks):
1. Create a project (requirement PROJ-01)
2. Verify research webhook fires (requirement HOOK-01)
3. Check project status updates to RESEARCH_IN_PROGRESS (requirement STATUS-01)
4. Verify activity log records the webhook call (requirement LOG-02)
5. Test failure case: What if webhook fails? (requirement HOOK-07)

**Don't just verify the fix — verify the entire workflow still works**

**Tools**:
- Manual testing for UI flows
- API testing for endpoints (curl, Postman)
- Database queries to verify data changes
- Check activity logs for audit trail

---

### Step 5: Use GSD Framework for Multi-File Changes
**When to use GSD:**
- Fix touches 3+ files
- Fix requires multiple steps
- Fix needs careful ordering (e.g., schema migration + code changes)

**GSD Commands**:
```bash
/gsd:plan-phase    # Plan the fix (break it into tasks)
/gsd:execute-phase # Execute with tracking and verification
/gsd:verify-work   # Verify requirements are met
```

**Why GSD?**
- Tracks progress (no lost work)
- Atomic commits per step
- Built-in verification loops
- Handles complex multi-file changes safely

---

### Step 6: Update This Audit File After Each Fix
**After fixing a finding:**
1. Update finding status: `[ ] PENDING` → `[✓] FIXED`
2. Add commit hash: `**Fixed In Commit**: abc123`
3. Add verification notes: `**Verified**: Tested HOOK-02 end-to-end, webhooks fire correctly`
4. Update Progress Dashboard counts
5. If all findings in a category are fixed, update **Current Stage**

**This keeps the audit file as single source of truth**

---

## 1.3 TOOLS & TECHNIQUES

### Parallel Explore Agents (Discovery Phase)
**When**: Need to understand large codebase quickly
**How**: Launch 3-5 agents in parallel with different focus areas
**Example**:
```
Agent 1: Read all planning/requirements docs
Agent 2: Audit Prisma schema and data model
Agent 3: Audit all API routes
Agent 4: Audit UI components and pages
Agent 5: Audit services and business logic
```
**Why**: 5x faster than sequential reading, agents cross-validate findings

---

### GSD Framework (Execution Phase)
**When**: Multi-file changes, complex fixes, need tracking
**Commands**:
- `/gsd:plan-phase` - Create detailed execution plan
- `/gsd:execute-phase` - Execute with atomic commits
- `/gsd:verify-work` - Verify requirements met
- `/gsd:progress` - Check status

**Why**: Prevents "fix A, break B" loops, tracks progress, verifiable

---

### Requirement Traceability Matrix
**What**: Spreadsheet/table mapping requirements to code
**Format**:
| Requirement | Code Files | Status | Blocked By |
|-------------|-----------|--------|------------|
| HOOK-02 | webhook-orchestrator.ts:45 | ❌ Broken | Finding B3 |
| SCRIPT-05 | project-actions.ts:250 | ✓ Works | None |

**Why**: Know which fixes unblock which requirements

---

### Verification Loops (After Each Fix)
**What**: Test the requirement end-to-end after fixing
**How**:
1. Identify which requirements the fix affects
2. Test each requirement's happy path
3. Test each requirement's error cases
4. Verify activity logs/audit trail

**Why**: Catch regressions immediately, not 10 fixes later

---

## 1.4 COMMON TRAPS TO AVOID

### ❌ Trap 1: Auditing Code in Isolation
**What it looks like**:
- "This field is never used" → Delete it → Breaks webhook callback
- "This function is too complex" → Refactor it → Breaks 5 callers

**Why it happens**:
- Didn't trace usage across entire codebase
- Didn't understand the domain context
- Assumed "unused" means "safe to delete"

**How to avoid**:
- ✓ Always grep for ALL usages before declaring "unused"
- ✓ Check git history: "Why was this added?"
- ✓ Read requirements: "Is this field required by a webhook callback?"

---

### ❌ Trap 2: Fixing Based on "Smells" Alone
**What it looks like**:
- "This function is 200 lines" → Split it → Now logic is fragmented
- "This uses any type" → Add strict types → Now 50 type errors

**Why it happens**:
- Code smell doesn't mean broken functionality
- Aesthetic fixes don't improve correctness
- Some "smells" exist for good reasons (complex domain logic)

**How to avoid**:
- ✓ Only fix smells if they block a requirement or cause bugs
- ✓ Prioritize correctness over aesthetics
- ✓ Ask: "Does this fix make the product work better or just look prettier?"

---

### ❌ Trap 3: Skipping "Why Does This Exist?"
**What it looks like**:
- "SCRIPT_APPROVED state is never reached" → Delete it → Future feature breaks
- "retryCount is never used" → Delete it → Retry logic half-implemented

**Why it happens**:
- Dead code vs. incomplete feature not distinguished
- Didn't check roadmap for planned usage
- Didn't ask original author's intent

**How to avoid**:
- ✓ Check git history and commit messages
- ✓ Check roadmap: "Is this planned for a future phase?"
- ✓ Check requirements: "Is this referenced anywhere?"
- ✓ If truly dead, mark as `[X] WONT FIX - Dead Code` not `[✓] FIXED`

---

### ❌ Trap 4: Fixing Randomly (No Dependency Order)
**What it looks like**:
- Fix UI bug → Then fix API → Then fix schema → Redo all 3
- Fix service → Then fix database → Service fix no longer works

**Why it happens**:
- Didn't map dependencies first
- Fixed in order of discovery, not dependency order
- Didn't plan the fix sequence

**How to avoid**:
- ✓ Always fix foundation first (schema → services → routes → UI)
- ✓ Map what depends on what BEFORE starting
- ✓ Use `/gsd:plan-phase` for complex multi-layer fixes

---

### ❌ Trap 5: Assuming One Fix is Isolated
**What it looks like**:
- Change field name → 15 files break
- Add validation → 3 endpoints reject valid data
- Fix race condition → Performance drops 10x

**Why it happens**:
- Didn't trace all usages
- Didn't consider performance impact
- Didn't test downstream effects

**How to avoid**:
- ✓ Grep for all usages before changing shared code
- ✓ Test critical paths after each fix
- ✓ Use git to track what changed (atomic commits)
- ✓ Consider: "If this breaks, what's the blast radius?"

---

### ❌ Trap 6: Context Rot (Forgetting What You Learned)
**What it looks like**:
- Audit same code twice, different conclusions
- Fix something you already fixed (lost track)
- Forget why a decision was made

**Why it happens**:
- Long chat sessions without saving state
- Findings not written down
- Progress not tracked

**How to avoid**:
- ✓ Use this audit file as single source of truth
- ✓ Update status checkboxes after each action
- ✓ Write down "why" in commit messages and notes
- ✓ Archive completed audits for future reference

---

# 🏗️ PART 2: DOMAIN CONTEXT

## What is Avatar Agency?

**Avatar Agency** is an internal web application (codename "Thanos") that orchestrates AI avatar video production workflows from idea to completion. It manages the full pipeline: research → scripting → AI video generation → human editing → final approval.

**Purpose**: Centralized command center for managing 30-100 video projects/month with automated webhook orchestration and human checkpoints.

---

## Who Uses It?

### Role 1: ADMIN (1 person)
**Permissions**: Full access
**Responsibilities**:
- Create and manage clients
- Create projects and assign editors
- Review and approve/reject scripts
- Review and approve/reject videos
- Trigger manual webhooks if needed
- View all projects and metrics

### Role 2: EDITOR (1-3 people)
**Permissions**: Limited access
**Responsibilities**:
- View only their assigned projects
- Download raw AI videos
- Access brand/editing guidelines
- Submit final edited videos
- Cannot access admin functions

---

## The 14-Status Workflow (State Machine)

```
1. CREATED
   ↓ (auto-trigger research webhook)
2. RESEARCH_IN_PROGRESS
   ↓ (webhook callback)
3. RESEARCH_COMPLETE
   ↓ (auto-trigger scripting webhook)
4. SCRIPT_IN_PROGRESS
   ↓ (webhook callback)
5. SCRIPT_PENDING_APPROVAL
   ├─ ADMIN APPROVES → (trigger production webhook) → 6
   └─ ADMIN REJECTS → (trigger optimizer webhook) → SCRIPT_IN_PROGRESS → 5

6. PRODUCTION_IN_PROGRESS
   ↓ (webhook callback with video URL)
7. PRODUCTION_PENDING_APPROVAL
   ├─ ADMIN APPROVES → (assign editor, send notification) → 8
   └─ ADMIN REJECTS → (trigger production again with feedback) → 6

8. EDITING_ASSIGNED
   ↓ (editor starts work)
9. EDITING_IN_PROGRESS
   ↓ (editor pastes Google Drive link)
10. FINAL_REVIEW
    ├─ ADMIN APPROVES → 11
    └─ ADMIN SENDS FEEDBACK → (Slack notification to editor, stays at 10)

11. COMPLETED

SPECIAL:
12. CANCELLED (from any status before COMPLETED)
```

**Dead States** (defined but never reached):
- `SCRIPT_APPROVED` (skipped, goes directly to PRODUCTION_IN_PROGRESS)
- `PRODUCTION_APPROVED` (skipped, goes directly to EDITING_ASSIGNED)

---

## The 5 N8N Webhooks ("Infinity Stones")

| # | Name | Trigger | Input | Output | Status Field Updated |
|---|------|---------|-------|--------|---------------------|
| 1 | **Research** | After project creation | videoIdea, clientId | researchOutput | RESEARCH_IN_PROGRESS → RESEARCH_COMPLETE |
| 2 | **Scripting** | After research completes | researchOutput | script | SCRIPT_IN_PROGRESS → SCRIPT_PENDING_APPROVAL |
| 3 | **Script Optimizer** | After script rejection | script + feedback | optimized script | SCRIPT_IN_PROGRESS → SCRIPT_PENDING_APPROVAL |
| 4 | **Video Production** | After script approval OR video rejection | script (+ feedback if rejected) | rawVideoUrl | PRODUCTION_IN_PROGRESS → PRODUCTION_PENDING_APPROVAL |
| 5 | **Notification** | Various events | event type + data | Slack message sent | (no status change) |

**Webhook Flow**:
1. App → Triggers webhook via POST to N8N URL
2. N8N → Processes async (3 AI agents, HeyGen, etc.)
3. N8N → Sends callback to app's `/api/webhooks/callback` endpoint
4. App → Updates project status and data
5. App → Auto-triggers next webhook in chain (if applicable)

---

## The V1 Requirements (54 Total)

### AUTH (Authentication) - 5 Requirements
- **AUTH-01**: Login with email/password
- **AUTH-02**: Session persistence (JWT)
- **AUTH-03**: Logout from any page
- **AUTH-04**: Password reset via email link
- **AUTH-05**: Admin can create editor accounts

### CLIENT (Client Management) - 4 Requirements
- **CLIENT-01**: View list of all clients (admin only)
- **CLIENT-02**: Create client (name, niche, avatarId, voiceId, PDF links)
- **CLIENT-03**: Edit client information (admin only)
- **CLIENT-04**: See project count per client

### PROJ (Project Management) - 6 Requirements
- **PROJ-01**: Create project (client, videoIdea, editor, deadline)
- **PROJ-02**: View list of projects with status
- **PROJ-03**: View full project details + activity history
- **PROJ-04**: Cancel project from any status
- **PROJ-05**: Filter projects by client, status, editor
- **PROJ-06**: Search projects by keyword

### HOOK (Webhook Integration) - 8 Requirements
- **HOOK-01**: Auto-trigger Research webhook after project creation
- **HOOK-02**: Auto-trigger Scripting after research completes
- **HOOK-03**: Auto-trigger Script Optimizer on script rejection
- **HOOK-04**: Auto-trigger Video Production on script approval
- **HOOK-05**: Auto-trigger Notification webhook (5 event types)
- **HOOK-06**: Configurable webhook URLs in settings
- **HOOK-07**: Failed webhooks show error message
- **HOOK-08**: Admin can manually retry failed webhooks

### SCRIPT (Script Review) - 5 Requirements
- **SCRIPT-01**: View generated script
- **SCRIPT-02**: View research output for context
- **SCRIPT-03**: Approve script (triggers production)
- **SCRIPT-04**: Reject script with required feedback text
- **SCRIPT-05**: Rejection triggers optimizer, new script replaces old

### VIDEO (Video Review) - 3 Requirements
- **VIDEO-01**: View/play raw AI video
- **VIDEO-02**: Approve video (assigns to selected editor)
- **VIDEO-03**: Reject video with feedback (triggers regeneration)

### EDITOR (Editor Experience) - 7 Requirements
- **EDTR-01**: See only assigned projects
- **EDTR-02**: View project details (client, deadline, video, PDFs, script)
- **EDTR-03**: Access/download raw AI video
- **EDTR-04**: Access brand guidelines PDF (external link)
- **EDTR-05**: Access editing guidelines PDF (external link)
- **EDTR-06**: Paste Google Drive link for final edited video
- **EDTR-07**: Mark editing as complete

### FINAL (Final Review) - 4 Requirements
- **FINAL-01**: Access final video via Google Drive link
- **FINAL-02**: Approve final video (marks project complete)
- **FINAL-03**: Send feedback to editor via Slack
- **FINAL-04**: Status stays at FINAL_REVIEW until approved

### DASH (Admin Dashboard) - 7 Requirements
- **DASH-01**: Count of active/in-progress projects
- **DASH-02**: Count of projects pending admin action
- **DASH-03**: Count of recently completed projects
- **DASH-04**: List of projects needing immediate action
- **DASH-05**: Editor workload (active projects per editor)
- **DASH-06**: Recent projects with current status
- **DASH-07**: Quick actions available

### LOG (Activity & Logging) - 4 Requirements
- **LOG-01**: All status changes logged with timestamp
- **LOG-02**: Webhook calls (success/failure) logged
- **LOG-03**: Activity log viewable on project detail page
- **LOG-04**: Log entries show who performed action

### STATUS (Status Management) - 4 Requirements
- **STATUS-01**: 14 defined statuses (enumerated)
- **STATUS-02**: Status transitions enforced (no invalid jumps)
- **STATUS-03**: Cancel available from any non-completed status
- **STATUS-04**: Visual status indicator on all project views

### ACCESS (Access Control) - 4 Requirements
- **ACCESS-01**: Admin has full access to all features
- **ACCESS-02**: Editor cannot access other editors' projects
- **ACCESS-03**: Editor cannot access admin functions
- **ACCESS-04**: Unauthenticated users redirected to login

### UX (UI/UX) - 6 Requirements
- **UX-01**: Dark/light mode toggle
- **UX-02**: Loading states for all async operations
- **UX-03**: Toast notifications for action feedback
- **UX-04**: Confirmation dialogs for destructive actions
- **UX-05**: Responsive layout (desktop and tablet)
- **UX-06**: Clear error messages with recovery guidance

---

## Technology Stack

- **Frontend**: Next.js 16.1.5 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM (currently using SQLite for dev)
- **Auth**: NextAuth.js 5.0 (beta)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **External**: N8N webhooks, Slack, HeyGen/Higgsfield AI video, Google Drive

---

## Database Schema (5 Models)

### User
- id, name, email (unique), password (hashed), role (ADMIN/EDITOR)
- passwordResetToken, passwordResetExpires
- isActive (soft delete)
- Relations: assignedProjects (Project[]), activityLogs (ActivityLog[])

### Client
- id, name, contentNiche
- avatarId, voiceId (AI avatar/voice identifiers)
- brandGuidelinesUrl, editingGuidelinesUrl (optional Google Drive links)
- isActive (soft delete)
- Relations: projects (Project[])

### Project (Core data model)
- id, clientId (FK), editorId (FK, nullable)
- videoIdea, deadline
- status (enum: 14 statuses)
- researchOutput, script, scriptFeedback
- rawVideoUrl, finalVideoUrl
- webhookStatus (pending/success/error), webhookError, lastWebhookType
- scriptApprovedAt, videoApprovedAt, retryCount
- Relations: client (Client), editor (User), activityLogs (ActivityLog[])

### ActivityLog (Immutable audit trail)
- id, projectId (FK), userId (FK, nullable)
- action (enum: 12 actions)
- details (JSON), createdAt
- Relations: project (Project), user (User)

### WebhookConfig (Settings)
- id, name (unique: research/scripting/optimizer/production/notification)
- url, isActive
- maxRetries, retryDelayMs, timeoutMs
- No relations

---

## Current Roadmap Status

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Foundation | ✅ COMPLETE |
| 2 | User Management | ✅ COMPLETE |
| 3 | Client Management | ✅ COMPLETE |
| 4 | Project Core | 🔄 IN PROGRESS |
| 5 | Webhook Infrastructure | ⏳ NOT STARTED |
| 6 | Automated Workflows | ⏳ NOT STARTED |
| 7 | Script Review Workflow | ⏳ NOT STARTED |
| 8 | Video Review & Editor Assignment | ⏳ NOT STARTED |
| 9 | Editor Experience | 🟡 PARTIAL |
| 10 | Final Review + Admin Dashboard | 🟡 PARTIAL |

**Recent Work** (per `.planning/AUDIT-REMEDIATION.md`):
- Phase 1-6 remediation completed (2026-02-04)
- All critical blockers fixed (status machine, webhook orchestrator, retry logic, validation)

---

# 🔍 PART 3: AUDIT FINDINGS

## Legend
- **Status**: `[ ]` PENDING | `[→]` IN PROGRESS | `[✓]` FIXED | `[X]` WONT FIX
- **Priority**: CRITICAL > HIGH > MEDIUM > LOW
- **Requirements Blocked**: Which v1 requirements fail if this isn't fixed

---

## CRITICAL FINDINGS (Fix Before Any Production Use)

### Finding C1: Fire-and-Forget Webhooks Leave Projects Stuck
- **Status**: [✓] FIXED (Commit: 9f21247)
- **Priority**: CRITICAL
- **Requirements Blocked**: HOOK-01, HOOK-02, STATUS-02
- **Files**:
  - `src/lib/actions/project-actions.ts:96-98` (research webhook)
  - `src/lib/actions/project-actions.ts:102-104` (scripting webhook)
- **Issue**:
  When a project is created, the research webhook fires as fire-and-forget async:
  ```typescript
  onProjectCreated(project.id).catch((error) => {
    console.error("Failed to trigger research webhook:", error);
    // No retry, no status update, just logging
  });
  ```
  If the webhook fails to trigger, the project stays in `CREATED` status forever. No retry mechanism. No visible error in UI. Admin has no way to know.
- **Impact**:
  - Projects get permanently stuck
  - No recovery path
  - Silent failures in production
  - Violates HOOK-01 (auto-trigger must work reliably)
- **Downstream Risk**:
  - Changing this to await will block project creation (slower UX)
  - Need to add webhook status tracking
  - Need retry mechanism
- **Fix Approach**:
  1. Add `webhookStatus: "pending"` when triggering
  2. Update to `"success"` on callback OR `"error"` on failure
  3. Add retry button in UI for failed webhooks
  4. OR: Use job queue (background workers)
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding C2: Status Machine Validation Bypassed in updateProject()
- **Status**: [✓] FIXED (Commit: 4870ea3)
- **Priority**: CRITICAL
- **Requirements Blocked**: STATUS-02
- **Files**:
  - `src/lib/actions/project-actions.ts:155` (updateProject server action)
  - `src/lib/status-machine.ts` (validation functions exist but not used)
- **Issue**:
  The `updateProject()` server action allows admins to set any status without validation:
  ```typescript
  if (status) updateData.status = status; // No isValidTransition() check
  ```
  Meanwhile, other functions like `completeProject()` DO validate transitions. Inconsistent enforcement means the state machine is a suggestion, not a rule.
- **Impact**:
  - Admin can jump from CREATED → COMPLETED in one API call
  - Invalid status transitions possible
  - State machine exists but isn't enforced consistently
  - Violates STATUS-02 (status transitions enforced)
- **Downstream Risk**:
  - If we enforce validation, existing admin workflows might break
  - Need to check if any admin actions rely on jumping statuses
- **Fix Approach**:
  Add validation before setting status:
  ```typescript
  if (status && status !== project.status) {
    if (!isValidTransition(project.status, status)) {
      const error = validateTransition(project.status, status);
      return { success: false, error };
    }
    updateData.status = status;
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding C3: SSRF Vulnerability in Webhook Test Endpoint
- **Status**: [✓] FIXED (Commit: 72c37a5)
- **Priority**: CRITICAL (Security)
- **Requirements Blocked**: HOOK-06
- **Files**:
  - `src/app/api/webhooks/test/route.ts:27-29`
- **Issue**:
  The test endpoint accepts any URL and does a `fetch()` without validation:
  ```typescript
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ... })
  });
  ```
  No URL scheme check (could be `file://`, `javascript://`)
  No IP range check (could be `127.0.0.1`, `169.254.169.254` cloud metadata)
  No localhost block

  An admin could probe internal infrastructure, cloud metadata endpoints, or internal services.
- **Impact**:
  - Server-Side Request Forgery (SSRF) attack vector
  - Could leak AWS/GCP credentials from metadata endpoint
  - Could scan internal network
  - Security vulnerability
- **Downstream Risk**:
  - If we lock down validation, legitimate test URLs might be rejected
  - Need to define allowed URL patterns
- **Fix Approach**:
  Option A: Delete this endpoint entirely (overlaps with `/trigger` endpoint)
  Option B: Add strict validation:
  - Only allow HTTPS URLs
  - Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
  - Block localhost
  - Block cloud metadata endpoints
- **Recommendation**: DELETE the endpoint (use `/trigger` for testing instead)
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding C4: Race Condition in All Status Transitions
- **Status**: [✓] FIXED (Commit: e5cf110)
- **Priority**: CRITICAL
- **Requirements Blocked**: STATUS-02, HOOK-01, HOOK-02, HOOK-03, HOOK-04
- **Files**:
  - `src/lib/actions/project-actions.ts` (all approval/rejection functions)
  - `src/lib/services/webhook-orchestrator.ts` (status updates)
- **Issue**:
  All status transitions follow a read-then-write pattern:
  ```typescript
  const project = await prisma.project.findUnique({ where: { id } });
  if (project.status !== "EXPECTED_STATUS") return error;
  await prisma.project.update({ where: { id }, data: { status: "NEW_STATUS" } });
  ```
  Two concurrent requests both pass the check, both write, both trigger webhooks.

  Example race:
  1. Request A reads project (status: SCRIPT_PENDING_APPROVAL)
  2. Request B reads project (status: SCRIPT_PENDING_APPROVAL)
  3. Request A checks (OK), updates to PRODUCTION_IN_PROGRESS, triggers webhook
  4. Request B checks (OK), updates to PRODUCTION_IN_PROGRESS, triggers webhook
  5. Result: Webhook fires twice, duplicate video generation
- **Impact**:
  - Duplicate webhook calls (costs money: HeyGen API)
  - Project enters inconsistent state
  - Race conditions in high-traffic scenarios
  - Activity logs show duplicate entries
- **Downstream Risk**:
  - Changing to conditional update might require retry logic in UI
  - Need to handle "0 rows updated" case gracefully
- **Fix Approach**:
  Use Prisma's conditional update:
  ```typescript
  const result = await prisma.project.updateMany({
    where: { id, status: "EXPECTED_STATUS" },
    data: { status: "NEW_STATUS" }
  });

  if (result.count === 0) {
    // Status already changed, race lost
    return { success: false, error: "Status already updated" };
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding C5: No Error Handling on Most API Routes
- **Status**: [✓] FIXED
- **Priority**: CRITICAL (Security + Reliability)
- **Requirements Blocked**: All (any route can crash)
- **Files**:
  - `src/app/api/clients/route.ts` (GET, POST)
  - `src/app/api/clients/[id]/route.ts` (GET, PATCH, DELETE)
  - `src/app/api/projects/route.ts` (GET, POST)
  - `src/app/api/projects/[id]/route.ts` (GET, PATCH, DELETE)
  - `src/app/api/users/route.ts` (GET, POST)
  - `src/app/api/users/[id]/route.ts` (GET, PATCH, DELETE)
  - `src/app/api/webhooks/config/route.ts` (GET, POST)
- **Issue**:
  Most route handlers have zero error handling. Any Prisma error, validation error, or unexpected exception will:
  - Return raw stack traces to the client (security leak)
  - Crash the request (500 error with internals exposed)
  - Leak database query structure
  - Expose Prisma error details

  Only auth routes and webhook callback have try/catch blocks.
- **Impact**:
  - Security: Stack traces expose internal structure
  - Reliability: Unhandled errors crash requests
  - UX: Errors show cryptic messages
  - No graceful degradation
- **Downstream Risk**:
  - Adding try/catch might hide bugs during development
  - Need to ensure errors are logged server-side
- **Fix Approach**:
  Wrap all route handlers in try/catch:
  ```typescript
  export async function GET(request: Request) {
    try {
      // existing code
    } catch (error) {
      console.error("Error in GET /api/clients:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
  ```
- **Fixed In Commit**: a9fed19 (2026-02-06)
- **Verified**: All 16 route handlers now have comprehensive try/catch blocks with server-side logging
- **Notes**: Future enhancement: Add error reporting service (Sentry) for production monitoring

---

### Finding C6: Soft Delete (isActive) Fields Never Filtered
- **Status**: [✓] FIXED
- **Priority**: CRITICAL
- **Requirements Blocked**: CLIENT-01, ACCESS-02
- **Files**:
  - `prisma/schema.prisma` (Client.isActive, User.isActive defined)
  - `src/app/api/clients/route.ts:25` (GET doesn't filter)
  - `src/app/api/users/route.ts` (GET doesn't filter)
  - All client/user dropdowns in forms
- **Issue**:
  The schema has `isActive` fields for soft delete, but:
  - GET /api/clients returns ALL clients (including isActive: false)
  - GET /api/users returns ALL users (including isActive: false)
  - Client dropdowns show deactivated clients
  - Editor lists show deactivated editors

  There's no way to "hide" a deactivated client without deleting them entirely.
- **Impact**:
  - Deactivated clients appear in every list
  - Confusing UX (why are deleted clients still showing?)
  - Can't archive old clients cleanly
  - Violates intent of soft delete
- **Downstream Risk**:
  - If we filter by isActive, need to add "show archived" toggle in admin UI
  - Existing deactivated records might suddenly disappear
- **Fix Approach**:
  Add default filter to all collection queries:
  ```typescript
  const clients = await prisma.client.findMany({
    where: { isActive: true }, // Add this
    orderBy: { createdAt: "desc" }
  });
  ```
  Add optional query param to show archived: `?includeInactive=true` (admin only)
- **Fixed In Commit**: 27c61fc (2026-02-06)
- **Verified**: All queries for Client, User, and WebhookConfig now filter by isActive: true in both API routes and dashboard pages
- **Notes**: Future enhancement: Add admin UI toggle to show/restore archived records

---

## HIGH FINDINGS (Fix Before Launch)

### Finding H1: scriptFeedback Field Overloaded (Semantic Confusion)
- **Status**: [ ] PENDING
- **Priority**: HIGH
- **Requirements Blocked**: SCRIPT-05, VIDEO-03
- **Files**:
  - `prisma/schema.prisma` (Project.scriptFeedback)
  - `src/lib/services/webhook-orchestrator.ts:216` (reuses for video feedback)
- **Issue**:
  The single `scriptFeedback` field stores BOTH:
  - Script rejection feedback (when admin rejects script)
  - Video rejection feedback (when admin rejects video)

  At line 216 of webhook-orchestrator.ts:
  ```typescript
  scriptFeedback: feedback, // Reusing this field for video feedback
  ```

  While the field is cleared after script optimization completes, this is semantically wrong. If someone wants to see historical feedback, it's gone. The field name implies "script feedback" but holds "video feedback" during certain states.
- **Impact**:
  - Semantically confusing (field name doesn't match content)
  - Historical feedback is lost (can't see what script feedback was if video is later rejected)
  - No way to distinguish script feedback from video feedback in activity logs
  - Violates data integrity principle (one field, one meaning)
- **Downstream Risk**:
  - Adding videoFeedback field requires schema migration
  - Need to update webhook callback handler
  - Need to update UI to show both feedbacks
- **Fix Approach**:
  Add separate field:
  ```prisma
  model Project {
    // existing fields
    scriptFeedback  String?
    videoFeedback   String? // NEW
  }
  ```
  Update webhook-orchestrator.ts to use `videoFeedback` instead of reusing `scriptFeedback`.
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Not technically "broken" for v1 (works functionally) but poor design

---

### Finding H2: No Pagination on Any Collection Endpoint
- **Status**: [ ] PENDING
- **Priority**: HIGH
- **Requirements Blocked**: PROJ-02 (at scale), DASH-06 (at scale)
- **Files**:
  - `src/app/api/clients/route.ts` (GET returns all)
  - `src/app/api/projects/route.ts` (GET returns all)
  - `src/app/api/users/route.ts` (GET returns all)
  - `src/app/(dashboard)/dashboard/page.tsx` (dashboard loads all recent projects)
- **Issue**:
  Every collection endpoint returns ALL records unbounded:
  - GET /api/clients → All clients
  - GET /api/projects → All projects (could be 1000+)
  - GET /api/users → All users
  - Dashboard recent projects → All recent (limited to 5 in query, but no pagination controls)

  At 100 projects, the projects page loads 100 records + their related data (client, editor). This is slow and will only get worse.
- **Impact**:
  - Performance degrades as data grows
  - Large API responses slow page loads
  - No way to navigate large lists efficiently
  - Memory usage on client increases
- **Downstream Risk**:
  - Adding pagination changes API contract
  - Need to update UI to show page controls
  - Need to decide: offset-based or cursor-based?
- **Fix Approach**:
  Add limit/offset query params:
  ```typescript
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.project.count({ where });

  return NextResponse.json({ projects, total, limit, offset });
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Default to 20 items per page

---

### Finding H3: WebhookConfig.name Not Enforced as Enum
- **Status**: [ ] PENDING
- **Priority**: HIGH
- **Requirements Blocked**: HOOK-06
- **Files**:
  - `prisma/schema.prisma` (WebhookConfig.name is String, not enum)
  - `src/app/api/webhooks/config/route.ts:33-35` (validates client-side only)
  - `src/lib/services/webhook.ts` (assumes valid names)
- **Issue**:
  The `name` field accepts any string value. Validation only happens in the API route:
  ```typescript
  const validNames = ["research", "scripting", "optimizer", "production", "notification"];
  if (!validNames.includes(name)) {
    return NextResponse.json({ error: "Invalid webhook name" }, { status: 400 });
  }
  ```
  But nothing prevents a direct DB insert of `name: "banana"`, which would silently break webhook routing.

  The schema should enforce this with an enum:
  ```prisma
  enum WebhookType {
    research
    scripting
    optimizer
    production
    notification
  }

  model WebhookConfig {
    name  WebhookType @unique
  }
  ```
- **Impact**:
  - Invalid webhook names possible via direct DB access
  - Webhook routing breaks silently (no match found)
  - Type safety lost (code assumes string, should be enum)
- **Downstream Risk**:
  - Schema change requires migration
  - Existing data might have invalid names (check first)
- **Fix Approach**:
  1. Add enum to Prisma schema
  2. Run migration
  3. Update code to use enum type
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding H4: Missing Input Validation Across Most Routes
- **Status**: [ ] PENDING
- **Priority**: HIGH
- **Requirements Blocked**: Multiple (data integrity)
- **Files**:
  - `src/app/api/clients/route.ts` (POST - no URL validation)
  - `src/app/api/projects/route.ts` (POST - no deadline validation)
  - `src/app/api/users/route.ts` (POST - no email/password validation)
  - Multiple other routes
- **Issue**:
  Most routes have minimal or no input validation:

  **Clients POST**:
  - brandGuidelinesUrl, editingGuidelinesUrl not validated (could be invalid URLs, `javascript://`, etc.)
  - contentNiche not validated (length, format)

  **Projects POST**:
  - deadline not validated (accepts past dates)
  - videoIdea not validated (length)

  **Users POST**:
  - email not validated (format)
  - password strength not checked (only length > 8)
  - name not validated (length)

  **Projects PATCH**:
  - status cast with `as ProjectStatus` without checking enum membership

  Only webhook callback has comprehensive Zod validation.
- **Impact**:
  - Invalid data enters database
  - XSS risks (unvalidated URLs)
  - Poor UX (late error feedback)
  - Data integrity issues
- **Downstream Risk**:
  - Adding validation might reject previously accepted data
  - Need to check existing data for issues
- **Fix Approach**:
  Add Zod schemas for each route:
  ```typescript
  const createProjectSchema = z.object({
    videoIdea: z.string().min(10).max(1000),
    deadline: z.string().datetime().refine(d => new Date(d) > new Date()),
    clientId: z.string().cuid(),
    editorId: z.string().cuid().optional(),
  });

  const body = createProjectSchema.parse(await request.json());
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Use webhook-schemas.ts as example pattern

---

### Finding H5: Dashboard Makes 5 Sequential Queries
- **Status**: [ ] PENDING
- **Priority**: HIGH (Performance)
- **Requirements Blocked**: DASH-01 to DASH-07
- **Files**:
  - `src/app/(dashboard)/dashboard/page.tsx:45-89`
- **Issue**:
  The dashboard runs 5 separate Prisma queries sequentially:
  1. Active projects count
  2. Pending actions count
  3. Completed this week count
  4. Due soon count
  5. Recent projects list

  Each query waits for the previous one to complete. Total time = sum of all queries.
- **Impact**:
  - Slow dashboard load (5 round-trips to DB)
  - Could be 1 aggregated query
  - Poor performance at scale
- **Downstream Risk**:
  - Changing to aggregated query changes data shape
  - Need to test carefully
- **Fix Approach**:
  Use `Promise.all()` to parallelize:
  ```typescript
  const [activeCount, pendingCount, completedCount, dueSoon, recentProjects] = await Promise.all([
    prisma.project.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.project.count({ where: { status: { in: PENDING_STATUSES } } }),
    // etc.
  ]);
  ```
  OR: Use raw SQL with aggregations
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding H6: No Rate Limiting on Auth Endpoints
- **Status**: [ ] PENDING
- **Priority**: HIGH (Security)
- **Requirements Blocked**: AUTH-04
- **Files**:
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/(auth)/login/page.tsx` (login via NextAuth, but no visible rate limit)
- **Issue**:
  The forgot-password endpoint can be called unlimited times:
  - Attacker can flood it to generate tokens
  - Can enumerate valid emails via timing differences (even though response is same)
  - No CAPTCHA, no rate limit, no IP blocking

  The reset-password endpoint has no brute-force protection:
  - Attacker can guess tokens (64-char hex, but still)
  - No limit on attempts
- **Impact**:
  - Password reset token flood
  - Email enumeration possible
  - Brute-force token guessing (unlikely but possible)
- **Downstream Risk**:
  - Rate limiting changes API contract
  - Need to handle rate limit errors gracefully in UI
- **Fix Approach**:
  Add rate limiting middleware (use `@upstash/ratelimit` or similar):
  ```typescript
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour
  });

  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Consider CAPTCHA for public launch

---

### Finding H7: Password Reset Token Stored Plaintext
- **Status**: [ ] PENDING
- **Priority**: HIGH (Security)
- **Requirements Blocked**: AUTH-04
- **Files**:
  - `src/app/api/auth/forgot-password/route.ts:40`
  - `prisma/schema.prisma` (User.passwordResetToken)
- **Issue**:
  The reset token is generated securely:
  ```typescript
  const resetToken = randomBytes(32).toString("hex"); // Good
  ```
  But stored plaintext in the database:
  ```typescript
  passwordResetToken: resetToken, // Bad - not hashed
  ```

  If the database is compromised, attacker can reset any user's password.
- **Impact**:
  - Database compromise = account takeover
  - Token should be hashed like passwords
- **Downstream Risk**:
  - Hashing token requires lookup change (hash incoming token, compare hashes)
  - Schema stays same (still store string)
- **Fix Approach**:
  Hash before storing:
  ```typescript
  const resetToken = randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(resetToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: hashedToken }
  });

  // When validating:
  const user = await prisma.user.findFirst({
    where: { passwordResetExpires: { gt: new Date() } }
  });
  const match = await bcrypt.compare(token, user.passwordResetToken);
  ```
  OR: Use crypto.createHash() for one-way hash
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding H8: Activity Logging Duplicated Across 5+ Files
- **Status**: [ ] PENDING
- **Priority**: HIGH (Maintainability)
- **Requirements Blocked**: LOG-01, LOG-02
- **Files**:
  - `src/app/api/projects/route.ts:91-98`
  - `src/app/api/projects/[id]/route.ts:124-132`
  - `src/app/api/webhooks/callback/route.ts` (multiple places)
  - `src/app/api/webhooks/trigger/route.ts:58-65`
  - `src/lib/actions/project-actions.ts` (multiple places)
- **Issue**:
  Activity log creation is copy-pasted everywhere:
  ```typescript
  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      projectId,
      userId: session.user.id,
      details: { from, to },
    },
  });
  ```

  Each file implements this slightly differently:
  - Some stringify details, some don't
  - Some include userId, some set to null
  - Inconsistent detail field structure
- **Impact**:
  - Duplicated code (maintenance burden)
  - Drift between implementations
  - Hard to add new fields (have to update 5+ places)
  - Inconsistent activity log structure
- **Downstream Risk**:
  - Extracting to service requires updating all call sites
  - Risk of missing a call site during refactor
- **Fix Approach**:
  Create logging service:
  ```typescript
  // lib/services/activity-logger.ts
  export async function logActivity(params: {
    action: ActivityAction;
    projectId: string;
    userId?: string;
    details?: Record<string, unknown>;
  }) {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        projectId: params.projectId,
        userId: params.userId || null,
        details: params.details || {},
      },
    });
  }
  ```
  Replace all instances with: `await logActivity({ action, projectId, ... })`
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding H9: Status Transition Logic Scattered Across 4 Files
- **Status**: [ ] PENDING
- **Priority**: HIGH (Maintainability)
- **Requirements Blocked**: STATUS-02
- **Files**:
  - `src/app/api/projects/[id]/route.ts` (PATCH handler validates)
  - `src/lib/actions/project-actions.ts` (sometimes validates, sometimes doesn't)
  - `src/lib/services/webhook-orchestrator.ts` (updates status directly)
  - `src/app/api/webhooks/trigger/route.ts` (updates status before triggering)
- **Issue**:
  Status transitions happen in 4 different places with 4 different patterns:

  1. API route PATCH: Validates with `validateTransition()`
  2. Server actions: Sometimes validates, sometimes sets directly
  3. Webhook orchestrator: Sets status directly based on callback
  4. Webhook trigger: Sets status based on webhook type

  The state machine file exists (`status-machine.ts`) but isn't the single source of truth. Some code uses it, some bypasses it.
- **Impact**:
  - Inconsistent enforcement of state machine rules
  - Hard to change transition rules (have to update 4 places)
  - Easy to introduce invalid transitions
  - Maintenance nightmare
- **Downstream Risk**:
  - Centralizing requires careful refactor
  - Risk of breaking existing workflows
- **Fix Approach**:
  Create single status transition function:
  ```typescript
  // lib/services/status-manager.ts
  export async function transitionProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!isValidTransition(project.status, newStatus)) {
      return { success: false, error: validateTransition(project.status, newStatus) };
    }

    await prisma.project.update({
      where: { id: projectId, status: project.status }, // Race protection
      data: { status: newStatus }
    });

    await logActivity({ action: "STATUS_CHANGED", projectId, userId, details: { from: project.status, to: newStatus } });

    return { success: true };
  }
  ```
  All status changes route through this function.
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

## MEDIUM FINDINGS (Fix Post-Launch or in v1.1)

### Finding M1: Dead Fields in Project Model
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (fields never used)
- **Files**:
  - `prisma/schema.prisma` (Project.retryCount, Project.scriptApprovedAt, Project.videoApprovedAt)
- **Issue**:
  Three fields exist but are never used:

  1. **retryCount**: Set to 0 at creation, never incremented, never read
  2. **scriptApprovedAt**: Never written anywhere in codebase
  3. **videoApprovedAt**: Never written anywhere in codebase

  These are ghost fields - planned but never implemented.
- **Impact**:
  - Schema clutter
  - Misleads developers ("why is this here?")
  - No functional impact (not used)
- **Downstream Risk**:
  - Removing fields requires migration
  - Check if any external tools reference them
- **Fix Approach**:
  Remove from schema:
  ```prisma
  model Project {
    // Remove these lines:
    // retryCount         Int       @default(0)
    // scriptApprovedAt   DateTime?
    // videoApprovedAt    DateTime?
  }
  ```
  Run migration: `npx prisma migrate dev --name remove-unused-fields`
- **Alternative**: Mark as `[X] WONT FIX - Planned for future` if these are roadmap items
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Check roadmap first - might be planned for Phase 8/9

---

### Finding M2: Dead States in Status Machine
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (states unreachable)
- **Files**:
  - `src/lib/status-machine.ts:87` (SCRIPT_APPROVED)
  - `src/lib/status-machine.ts:106` (PRODUCTION_APPROVED)
- **Issue**:
  Two states are defined but never reached:

  1. **SCRIPT_APPROVED**: Flow jumps from SCRIPT_PENDING_APPROVAL → PRODUCTION_IN_PROGRESS
  2. **PRODUCTION_APPROVED**: Flow jumps from PRODUCTION_PENDING_APPROVAL → EDITING_ASSIGNED

  The code comments even admit this:
  ```typescript
  // Video approved (legacy intermediate state)
  // In practice, we skip this and go directly to EDITING_ASSIGNED
  PRODUCTION_APPROVED: [...]
  ```

  Nothing ever transitions INTO these states, making their outgoing transitions unreachable code.
- **Impact**:
  - Confusing for developers ("can projects be in this state?")
  - Dead code in state machine
  - Misleading documentation
- **Downstream Risk**:
  - If removed, need to check if any external references exist
  - Check activity logs for historical data in these states
- **Fix Approach**:
  Option A: Remove from enum and state machine
  Option B: Mark as `[X] WONT FIX - Legacy, kept for historical data`
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Check if any projects in DB have these statuses before removing

---

### Finding M3: WebhookConfig Retry Settings Stored But Never Read
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: HOOK-08 (retry logic incomplete)
- **Files**:
  - `prisma/schema.prisma` (WebhookConfig.maxRetries, retryDelayMs, timeoutMs)
  - `src/lib/services/webhook.ts` (doesn't read these values)
- **Issue**:
  The WebhookConfig model has three retry-related fields:
  - maxRetries (default: 3)
  - retryDelayMs (default: 5000)
  - timeoutMs (default: 30000)

  These are configurable in the database, but the webhook service code never reads them. Retry behavior is hardcoded or missing entirely.

  This is "config theater" - gives the illusion of tunability with zero actual effect.
- **Impact**:
  - Misleading admin UI (admins think they can configure retry behavior)
  - Wasted database fields
  - Actual retry logic doesn't exist anyway (see Finding C1)
- **Downstream Risk**:
  - Implementing actual retry logic is complex
  - Need exponential backoff, max attempts, etc.
- **Fix Approach**:
  Option A: Implement retry logic that reads these fields
  Option B: Remove fields from schema (retry logic not in v1 scope)

  Recommendation: Option B for v1, Option A for v1.1
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Related to Finding C1 (fire-and-forget webhooks)

---

### Finding M4: Response Format Inconsistency Across Routes
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (API works, just inconsistent)
- **Files**:
  - Multiple API routes
- **Issue**:
  Three different success response patterns exist:

  **Pattern 1**: Return data directly
  ```typescript
  return NextResponse.json(clients); // Array or object
  ```

  **Pattern 2**: Return success flag only
  ```typescript
  return NextResponse.json({ success: true });
  ```

  **Pattern 3**: Return success + data
  ```typescript
  return NextResponse.json({ success: true, data: project });
  ```

  Two different error patterns:

  **Pattern A**: Error with status code
  ```typescript
  return NextResponse.json({ error: "Not found" }, { status: 404 });
  ```

  **Pattern B**: Success:false with status 200
  ```typescript
  return NextResponse.json({ success: false, error: "..." }, { status: 200 });
  ```
- **Impact**:
  - Client code must handle multiple response shapes
  - Inconsistent error handling in UI
  - Harder to build generic API client
- **Downstream Risk**:
  - Standardizing changes API contract
  - Need to update all client code
- **Fix Approach**:
  Standardize on one pattern (recommendation):
  ```typescript
  // Success
  return NextResponse.json({ success: true, data: result });

  // Error
  return NextResponse.json({ success: false, error: "message" }, { status: 4xx });
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Not critical for v1, fix in v1.1

---

### Finding M5: ProjectActions Component is 590 Lines (God Component)
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (works, just unmaintainable)
- **Files**:
  - `src/app/(dashboard)/dashboard/projects/[id]/actions.tsx`
- **Issue**:
  One component handles 7 different responsibilities:
  1. Webhook triggers (research, scripting, optimizer, production, notification)
  2. Script approval
  3. Script rejection (with feedback)
  4. Video approval (with editor assignment)
  5. Video rejection (with feedback)
  6. Final video submission
  7. Project completion/cancellation

  590 lines of code with multiple dialog states, form states, and complex conditional rendering.
- **Impact**:
  - Hard to maintain
  - Hard to test
  - Changes in one area risk breaking others
  - Verbose state management (5 separate dialog states)
- **Downstream Risk**:
  - Splitting requires careful component boundary design
  - Risk of breaking workflows
- **Fix Approach**:
  Split into focused components:
  - `<ScriptApprovalPanel>` - Script review actions
  - `<VideoReviewPanel>` - Video approval/rejection
  - `<ProjectLifecycleActions>` - Complete/cancel
  - `<WebhookTriggers>` - Manual webhook triggers (admin only)
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Not critical, but improves maintainability

---

### Finding M6: Status Label/Color Maps Duplicated in 3 Files
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (works, just duplicated)
- **Files**:
  - `src/app/(dashboard)/dashboard/projects/page.tsx:26-58`
  - `src/app/(dashboard)/dashboard/projects/[id]/page.tsx:15-47`
  - `src/app/(dashboard)/dashboard/projects/project-filters.tsx`
- **Issue**:
  The mapping from status enum to display label and color is duplicated in at least 3 files:
  ```typescript
  const statusLabels: Record<ProjectStatus, string> = {
    CREATED: "Created",
    RESEARCH_IN_PROGRESS: "Researching",
    // ... 14 statuses
  };

  const statusColors: Record<ProjectStatus, string> = {
    CREATED: "bg-gray-500",
    RESEARCH_IN_PROGRESS: "bg-blue-500",
    // ... 14 statuses
  };
  ```

  Changes to labels or colors require updating 3+ files.
- **Impact**:
  - Duplicated code (DRY violation)
  - Risk of inconsistency (labels differ across pages)
  - Hard to maintain
- **Downstream Risk**:
  - Extracting to constants file is low risk
- **Fix Approach**:
  Create constants file:
  ```typescript
  // lib/constants/statuses.ts
  export const STATUS_LABELS: Record<ProjectStatus, string> = { ... };
  export const STATUS_COLORS: Record<ProjectStatus, string> = { ... };
  ```
  Import everywhere: `import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants/statuses";`
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Easy win, low risk

---

### Finding M7: No Health Check Endpoint
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (deployment concern, not user-facing)
- **Files**:
  - (missing) `src/app/api/health/route.ts`
- **Issue**:
  There's no `/api/health` endpoint for monitoring and deployment platforms to check if the app is alive.

  Deployment platforms (Vercel, Railway, etc.) need this to:
  - Know if deployment succeeded
  - Health checks for load balancers
  - Uptime monitoring
  - Database connectivity check
- **Impact**:
  - Can't easily monitor if app is up
  - Deployment platforms can't verify health
  - No way to check DB connectivity programmatically
- **Downstream Risk**:
  - None (adding is safe)
- **Fix Approach**:
  Create health endpoint:
  ```typescript
  // src/app/api/health/route.ts
  import { prisma } from "@/lib/prisma";
  import { NextResponse } from "next/server";

  export async function GET() {
    try {
      // Check DB connectivity
      await prisma.$queryRaw`SELECT 1`;

      return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } catch (error) {
      return NextResponse.json({
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected"
      }, { status: 503 });
    }
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: (empty)

---

### Finding M8: No Activity Log Query Endpoint
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: LOG-03 (partial - works via project detail, but no API)
- **Files**:
  - (missing) `src/app/api/projects/[id]/activity/route.ts`
- **Issue**:
  Activity logs are created everywhere but there's no dedicated endpoint to query them.

  The project detail page fetches logs via server component (line 23-40 of projects/[id]/page.tsx), but:
  - No standalone API endpoint exists
  - Can't query activity across all projects
  - Can't query by date range
  - Can't query by action type
  - Can't query by user
- **Impact**:
  - Limited audit trail functionality
  - Can't build admin "recent activity" view
  - Can't answer "what did user X do today?"
- **Downstream Risk**:
  - None (adding is safe)
- **Fix Approach**:
  Create activity log endpoint:
  ```typescript
  // src/app/api/activity/route.ts
  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true } },
        project: { select: { id: true, videoIdea: true } }
      }
    });

    return NextResponse.json(logs);
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Nice to have for admin debugging

---

### Finding M9: Missing Indexes on Common Queries
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: Performance (not functional)
- **Files**:
  - `prisma/schema.prisma`
- **Issue**:
  Several common query patterns lack indexes:

  **Missing**:
  - `(Project.status, Project.deadline)` - Dashboard "due soon" queries
  - `(Project.status, Project.webhookStatus)` - Finding failed webhooks to retry
  - `(Client.isActive, Client.createdAt)` - Active clients sorted
  - `(User.isActive)` - Active users filter

  **Existing** (good):
  - Project.status
  - Project.clientId
  - Project.editorId
  - (Project.editorId, Project.status)
  - (Project.status, Project.createdAt)
- **Impact**:
  - Slow queries as data grows
  - Full table scans on filtered queries
  - Not noticeable at 100 projects, bad at 10,000
- **Downstream Risk**:
  - Adding indexes is safe (no breaking changes)
  - Slight write performance cost (negligible)
- **Fix Approach**:
  Add composite indexes:
  ```prisma
  model Project {
    // existing fields

    @@index([status, deadline])
    @@index([status, webhookStatus])
  }

  model Client {
    @@index([isActive, createdAt])
  }

  model User {
    @@index([isActive])
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Run `EXPLAIN` queries to verify index usage

---

### Finding M10: No Error Boundaries in UI
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: UX-06 (error recovery)
- **Files**:
  - (missing) `src/app/(dashboard)/error.tsx`
  - (missing) `src/app/(auth)/error.tsx`
  - (missing) `src/app/error.tsx`
- **Issue**:
  Next.js App Router supports error boundaries via `error.tsx` files, but none exist.

  If any page component throws an error:
  - Entire app crashes (white screen)
  - No user-friendly error message
  - No recovery path (must refresh)
  - No error reporting
- **Impact**:
  - Poor UX on errors
  - Lost user context (form data, navigation state)
  - No visibility into production errors
- **Downstream Risk**:
  - None (adding is safe)
- **Fix Approach**:
  Add error boundaries:
  ```typescript
  // src/app/error.tsx
  "use client";

  export default function Error({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </div>
    );
  }
  ```
  Repeat for dashboard and auth route groups.
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Consider error reporting service (Sentry)

---

### Finding M11: Webhook Trigger/Retry/Test Endpoints Overlap
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: None (works, just confusing)
- **Files**:
  - `src/app/api/webhooks/trigger/route.ts`
  - `src/app/api/webhooks/retry/route.ts`
  - `src/app/api/webhooks/test/route.ts`
- **Issue**:
  Three endpoints with overlapping purposes:

  1. **trigger**: Manually fire a webhook for a project (admin action)
  2. **retry**: Retry a failed webhook (admin action)
  3. **test**: Test webhook connectivity (admin action)

  `trigger` and `retry` do almost the same thing with different preconditions:
  - `trigger` sets status to IN_PROGRESS, then calls webhook
  - `retry` checks status is "error", increments retryCount, then calls webhook

  These could be unified into one endpoint with a `mode` parameter.
- **Impact**:
  - Confusion about which endpoint to use
  - Duplicated webhook calling logic
  - Maintenance burden (3 endpoints instead of 1)
- **Downstream Risk**:
  - Consolidating changes API contract
  - Need to update UI to use new unified endpoint
- **Fix Approach**:
  Option A: Keep separate (clear intent)
  Option B: Unify into `/api/webhooks/execute` with `{ mode: "trigger" | "retry" | "test" }`

  Recommendation: Option A for v1 (clarity over DRY), Option B for refactor later
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Not critical, but could simplify

---

### Finding M12: Missing Suspense Boundaries in Dashboard Pages
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: UX-02 (loading states)
- **Files**:
  - `src/app/(dashboard)/dashboard/page.tsx` (no Suspense)
  - `src/app/(dashboard)/dashboard/clients/page.tsx` (no Suspense)
  - `src/app/(dashboard)/dashboard/editors/page.tsx` (no Suspense)
- **Issue**:
  Only the projects page uses Suspense:
  ```typescript
  <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
    <ProjectFilters />
  </Suspense>
  ```

  Other pages load all data synchronously:
  - Dashboard loads 5 queries before rendering
  - Clients page loads all clients before rendering
  - Editors page loads all editors before rendering

  This causes full-page blocking on slow DB queries.
- **Impact**:
  - Slow perceived load time
  - No progressive rendering
  - "White screen" while loading
- **Downstream Risk**:
  - Adding Suspense requires async components
  - Need to design loading states
- **Fix Approach**:
  Wrap async components in Suspense:
  ```typescript
  <Suspense fallback={<StatsCardsSkeleton />}>
    <DashboardStats />
  </Suspense>

  <Suspense fallback={<ProjectListSkeleton />}>
    <RecentProjects />
  </Suspense>
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Improves perceived performance

---

### Finding M13: Inconsistent Empty States
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: UX-06 (clear messaging)
- **Files**:
  - `src/app/(dashboard)/dashboard/page.tsx:181`
  - `src/app/(dashboard)/dashboard/projects/page.tsx:215-217`
- **Issue**:
  Empty states have inconsistent messaging:

  Dashboard:
  - Shows "No projects yet" OR "Waiting for project assignments" (context-aware, good)

  Projects page:
  - Shows "No projects match your filters" OR "No projects found" (context-aware, good)

  But some tables just show:
  - "No [items] found" (generic, not helpful)

  No guidance on what to do next.
- **Impact**:
  - Confusing UX (why no results?)
  - No call to action
  - User doesn't know next step
- **Downstream Risk**:
  - None (improving messages is safe)
- **Fix Approach**:
  Standardize empty states:
  ```typescript
  {projects.length === 0 && (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        {filters ? "No projects match your filters." : "No projects yet."}
      </p>
      {!filters && session.user.role === "ADMIN" && (
        <Button onClick={() => router.push("/dashboard/projects/new")}>
          Create your first project
        </Button>
      )}
    </div>
  )}
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority polish

---

### Finding M14: ActivityLog.details Field Untyped (JSON)
- **Status**: [ ] PENDING
- **Priority**: MEDIUM
- **Requirements Blocked**: LOG-03 (queryability)
- **Files**:
  - `prisma/schema.prisma` (ActivityLog.details is `Json?`)
  - All code that writes activity logs
- **Issue**:
  The `details` field stores arbitrary JSON:
  ```typescript
  details: { from: "CREATED", to: "RESEARCH_IN_PROGRESS" }
  details: { videoIdea: "..." }
  details: { editorId: "...", editorName: "..." }
  details: { error: "..." }
  ```

  No schema validation. No type checking. At query time, you can't trust what's in there.

  Different actions store different shapes. No consistency.
- **Impact**:
  - Can't reliably query details (structure unknown)
  - Risk of storage overflow (no max size)
  - No validation on write
  - Hard to build activity feed UI (unknown shape)
- **Downstream Risk**:
  - Typing this requires discriminated union or separate tables
  - Breaking change to storage format
- **Fix Approach**:
  Option A: Use Zod to validate details before storing:
  ```typescript
  const statusChangedDetails = z.object({
    from: z.string(),
    to: z.string(),
    source: z.string().optional()
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      details: statusChangedDetails.parse(details)
    }
  });
  ```

  Option B: Create typed detail tables (more complex)
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority for v1, important for analytics later

---

## LOW FINDINGS (Code Quality, Not Functional)

### Finding L1: Hardcoded Magic Numbers
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None
- **Files**:
  - `src/app/(dashboard)/dashboard/projects/new/form.tsx:46` (7 days)
  - `src/app/(dashboard)/dashboard/page.tsx:80` (take: 5)
  - Multiple files
- **Issue**:
  Magic numbers scattered throughout:
  - `7 * 24 * 60 * 60 * 1000` (milliseconds in 7 days)
  - `take: 5` (recent projects count)
  - `take: 10` (activity logs count)
  - `max-w-2xl` (form max-width)
- **Impact**:
  - Hard to change consistently
  - Unclear intent ("why 7?")
  - No central config
- **Fix Approach**:
  Extract to constants:
  ```typescript
  // lib/constants/defaults.ts
  export const DEFAULT_DEADLINE_DAYS = 7;
  export const RECENT_PROJECTS_LIMIT = 5;
  export const ACTIVITY_LOG_LIMIT = 10;
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority polish

---

### Finding L2: Missing JSDoc Comments
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None (documentation)
- **Files**:
  - All components and functions
- **Issue**:
  No JSDoc comments on exported components or functions.

  Example:
  ```typescript
  export default function ProjectActions({ project, session }: Props) {
    // 590 lines of code, no documentation
  }
  ```

  Should be:
  ```typescript
  /**
   * Project action panel - handles script/video approval, webhook triggers
   * @param project - Full project object with relations
   * @param session - Current user session (determines permissions)
   */
  export default function ProjectActions({ project, session }: Props) {
  ```
- **Impact**:
  - Hard for new developers to understand code
  - No IDE hints
  - No auto-generated docs
- **Fix Approach**:
  Add JSDoc to all exported functions/components
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority, improves maintainability

---

### Finding L3: Inconsistent Naming Conventions
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None
- **Files**:
  - Multiple
- **Issue**:
  Inconsistent naming across codebase:
  - Booleans: `isAdmin`, `isPending` vs. `search`, `status`
  - Variables: Some have `Id` suffix, some don't
  - Components: `ProjectActions` (noun) vs. `NewProjectForm` (adjective + noun + type)
- **Impact**:
  - Slightly confusing
  - No actual functional impact
- **Fix Approach**:
  Standardize naming in style guide
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority, cosmetic

---

### Finding L4: No TypeScript Strict Mode
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None
- **Files**:
  - `tsconfig.json`
- **Issue**:
  Check if strict mode is enabled. If not, enable it.

  Current config should have:
  ```json
  {
    "compilerOptions": {
      "strict": true
    }
  }
  ```
- **Impact**:
  - Less type safety without strict mode
  - Easier to introduce bugs
- **Fix Approach**:
  Enable if not already enabled
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Check current config first

---

### Finding L5: Unused Imports
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None
- **Files**:
  - (run linter to find)
- **Issue**:
  Likely some unused imports exist (haven't audited all files)
- **Impact**:
  - Slightly larger bundle
  - Code clutter
- **Fix Approach**:
  Run `npm run lint` and fix warnings
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority cleanup

---

### Finding L6: Missing .env.example File
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None (developer experience)
- **Files**:
  - (missing) `.env.example`
- **Issue**:
  No `.env.example` file in repo showing required environment variables.

  New developers don't know what to configure.
- **Impact**:
  - Harder to onboard new developers
  - No documentation of required env vars
- **Fix Approach**:
  Create `.env.example`:
  ```bash
  DATABASE_URL="postgresql://..."
  NEXTAUTH_SECRET="..."
  NEXTAUTH_URL="http://localhost:3000"
  WEBHOOK_SECRET="..."
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Good practice

---

### Finding L7: No Database Seed Script Execution Instructions
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None (documentation)
- **Files**:
  - `README.md` or `prisma/seed.ts`
- **Issue**:
  There's a seed script (`prisma/seed.ts`) but no instructions in README on how to use it.
- **Impact**:
  - New developers don't know how to set up test data
- **Fix Approach**:
  Add to README:
  ```markdown
  ## Database Setup
  1. `npm run db:push` - Push schema to database
  2. `npm run db:seed` - Seed with test data
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Documentation improvement

---

### Finding L8: Reset Password Flow Could Be Server-Side
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None (works, just could be better)
- **Files**:
  - `src/app/(auth)/reset-password/page.tsx`
- **Issue**:
  The reset password page validates token client-side in useEffect:
  ```typescript
  useEffect(() => {
    if (!token) {
      router.push("/forgot-password");
    }
  }, [token, router]);
  ```

  This causes:
  1. Client renders
  2. useEffect runs
  3. Redirect happens

  Could be validated server-side in the page component (before rendering).
- **Impact**:
  - Slight UX issue (flash of content before redirect)
  - Not critical
- **Fix Approach**:
  Validate server-side:
  ```typescript
  export default async function ResetPasswordPage({ searchParams }: Props) {
    const { token } = await searchParams;
    if (!token) {
      redirect("/forgot-password");
    }
    // render form
  }
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority polish

---

### Finding L9: No Favicon or App Metadata
- **Status**: [ ] PENDING
- **Priority**: LOW
- **Requirements Blocked**: None (branding)
- **Files**:
  - `src/app/layout.tsx`
- **Issue**:
  Check if proper metadata exists:
  - App title
  - Description
  - Favicon
  - Open Graph tags
- **Impact**:
  - Poor SEO (if applicable)
  - Generic browser tab title
- **Fix Approach**:
  Add metadata to root layout:
  ```typescript
  export const metadata = {
    title: "Avatar Agency - Thanos",
    description: "AI Avatar Video Production Workflow Manager",
    icons: {
      icon: "/favicon.ico"
    }
  };
  ```
- **Fixed In Commit**: (empty)
- **Verified**: (empty)
- **Notes**: Low priority branding

---

# 🛠️ PART 4: REMEDIATION ROADMAP

## Fixing Order (Foundation-First)

### Phase 1: Database & Schema (Foundation)
**Goal**: Fix data model issues before touching code

**Findings to Fix**:
1. H1 - Add `videoFeedback` field (separate from `scriptFeedback`)
2. H3 - Make `WebhookConfig.name` an enum
3. M1 - Remove dead fields (retryCount, scriptApprovedAt, videoApprovedAt)
4. M2 - Remove dead states OR mark as legacy
5. M9 - Add missing indexes

**Verification**:
- Run `npx prisma migrate dev`
- Check migrations apply cleanly
- Verify no data loss
- Verify existing code still compiles (will have type errors to fix next)

**Estimated Effort**: 2-3 hours

---

### Phase 2: Services & Business Logic (Core)
**Goal**: Fix webhook orchestration, status machine, activity logging

**Findings to Fix**:
1. C1 - Fix fire-and-forget webhooks (CRITICAL)
2. C2 - Enforce status machine validation (CRITICAL)
3. C4 - Fix race conditions with conditional updates (CRITICAL)
4. H8 - Extract activity logging to service
5. H9 - Centralize status transition logic
6. M3 - Remove or implement WebhookConfig retry settings

**Verification**:
- Test project creation → research webhook → callback flow
- Test status transitions (valid and invalid)
- Test concurrent status changes (race condition)
- Verify activity logs created consistently

**Estimated Effort**: 6-8 hours

---

### Phase 3: API Routes (Input/Output Layer)
**Goal**: Fix security, validation, error handling, pagination

**Findings to Fix**:
1. C3 - Fix SSRF vulnerability (DELETE test endpoint) (CRITICAL)
2. C5 - Add error handling to all routes (CRITICAL)
3. C6 - Filter soft-deleted records (CRITICAL)
4. H2 - Add pagination to collection endpoints
5. H4 - Add input validation (Zod schemas)
6. H6 - Add rate limiting to auth endpoints
7. H7 - Hash password reset tokens
8. M4 - Standardize response format
9. M7 - Add health check endpoint
10. M8 - Add activity log query endpoint

**Verification**:
- Test all API routes with invalid input
- Test pagination with large datasets
- Test error cases return proper errors (not stack traces)
- Test rate limiting on forgot-password
- Verify soft-deleted records hidden

**Estimated Effort**: 8-10 hours

---

### Phase 4: UI & Components (Presentation Layer)
**Goal**: Fix component issues, add error boundaries, improve UX

**Findings to Fix**:
1. H5 - Parallelize dashboard queries
2. M5 - Split ProjectActions component (optional)
3. M6 - Extract status constants
4. M10 - Add error boundaries
5. M12 - Add Suspense boundaries
6. M13 - Improve empty states
7. L8 - Move reset password validation server-side

**Verification**:
- Test dashboard loads faster
- Test error boundary triggers on component error
- Test Suspense shows loading states
- Visual inspection of empty states

**Estimated Effort**: 4-6 hours

---

### Phase 5: Cleanup & Polish (Nice-to-Have)
**Goal**: Remove dead code, improve maintainability

**Findings to Fix**:
1. M11 - Consider consolidating webhook endpoints (optional)
2. M14 - Type ActivityLog.details (optional)
3. L1-L9 - All LOW priority findings (constants, docs, naming)

**Verification**:
- Code review
- Run linter
- Check TypeScript strict mode
- Verify all tests pass

**Estimated Effort**: 3-4 hours

---

## Total Estimated Effort: 23-31 hours

---

## Blocking Dependencies

| Finding | Blocks These Findings | Reason |
|---------|----------------------|--------|
| C1 (Webhooks) | All HOOK-* requirements | Core workflow depends on webhooks working |
| C2 (Status machine) | C4 (Race conditions) | Both fix status transitions |
| H1 (videoFeedback field) | None | Schema change, do early |
| H3 (WebhookConfig enum) | None | Schema change, do early |
| Phase 1 (Schema) | Phases 2-4 | Code depends on schema shape |
| Phase 2 (Services) | Phase 3 (API) | API routes call services |

---

## Critical Path (Must Fix Before Production)

1. C3 - SSRF vulnerability (security breach)
2. C1 - Fire-and-forget webhooks (projects get stuck)
3. C2 - Status machine bypass (invalid states)
4. C4 - Race conditions (duplicate webhooks)
5. C5 - Error handling (stack trace leaks)
6. C6 - Soft delete filter (data integrity)

**Everything else can be deferred to v1.1**

---

# 📊 PART 5: REQUIREMENTS COVERAGE ANALYSIS

## Requirements Blocked by Critical Findings

| Requirement | Status | Blocked By | Impact |
|-------------|--------|-----------|--------|
| HOOK-01 | ❌ Broken | C1 | Research webhook fails silently |
| HOOK-02 | ❌ Broken | C1 | Scripting webhook fails silently |
| HOOK-03 | ❌ Broken | C1 | Optimizer webhook fails silently |
| HOOK-04 | ❌ Broken | C1 | Production webhook fails silently |
| HOOK-07 | ❌ Broken | C1 | Failed webhooks not visible |
| HOOK-08 | ⚠️ Partial | C1 | Retry exists but webhook trigger broken |
| STATUS-02 | ❌ Broken | C2, C4 | Invalid transitions possible, race conditions |
| CLIENT-01 | ❌ Broken | C6 | Deleted clients shown in lists |
| ACCESS-02 | ❌ Broken | C6 | Inactive users not filtered |
| SCRIPT-05 | ⚠️ Partial | H1 | Works but feedback field confusing |
| VIDEO-03 | ⚠️ Partial | H1 | Works but feedback field confusing |
| AUTH-04 | ⚠️ Partial | H7 | Works but token not hashed |

**Total Requirements Blocked**: 12 of 54 (22%)

---

## Requirements with No Issues Found

✅ AUTH-01, AUTH-02, AUTH-03, AUTH-05
✅ CLIENT-02, CLIENT-03, CLIENT-04
✅ PROJ-01, PROJ-03, PROJ-04, PROJ-05, PROJ-06
✅ SCRIPT-01, SCRIPT-02, SCRIPT-03, SCRIPT-04
✅ VIDEO-01, VIDEO-02
✅ EDTR-01 through EDTR-07 (all)
✅ FINAL-01 through FINAL-04 (all)
✅ DASH-01 through DASH-07 (all, though H5 affects performance)
✅ LOG-01, LOG-02, LOG-04
✅ STATUS-01, STATUS-03, STATUS-04
✅ ACCESS-01, ACCESS-03, ACCESS-04
✅ UX-01, UX-03, UX-04, UX-05

**Total Working**: 42 of 54 (78%)

---

# 🔄 AUDIT COMPLETION CHECKLIST

When all findings are fixed, update this section:

- [ ] All CRITICAL findings fixed and verified
- [ ] All HIGH findings fixed and verified
- [ ] All MEDIUM findings addressed (fix or defer)
- [ ] All LOW findings addressed (fix or defer)
- [ ] All blocked requirements now working
- [ ] End-to-end workflow tested (create → research → script → approve → video → approve → edit → complete)
- [ ] Regression testing complete (nothing broke during fixes)
- [ ] Update **Current Stage** to "Complete"
- [ ] Archive this audit file
- [ ] Celebrate 🎉

---

# 📝 NOTES & DECISIONS LOG

Use this section to record decisions made during remediation:

**Example**:
```
2026-02-06: Decided to DELETE /api/webhooks/test endpoint instead of fixing SSRF.
Reason: Overlaps with /trigger endpoint, not worth securing.
Decision by: [Name]
```

---

**END OF AUDIT REPORT**
