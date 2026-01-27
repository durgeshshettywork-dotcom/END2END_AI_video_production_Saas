# Avatar Agency - Roadmap

## Overview

**Total Phases:** 10
**Total Requirements:** 54
**Mode:** Comprehensive

---

## Phase 1: Foundation

**Goal:** Set up the project infrastructure, database schema, authentication system, and base layout.

**Requirements:**
- AUTH-01: User can log in with email and password
- AUTH-02: User session persists across browser sessions
- AUTH-03: User can log out from any page
- ACCESS-01: Admin has full access to all features
- ACCESS-04: Unauthenticated users redirected to login

**Success Criteria:**
1. Next.js project initialized with TypeScript, Tailwind, shadcn/ui
2. PostgreSQL database connected via Prisma
3. User, Client, Project, ActivityLog schemas defined and migrated
4. NextAuth.js configured with Credentials provider
5. Login page functional with session creation
6. Protected route middleware redirects unauthenticated users
7. Basic layout with sidebar navigation renders

**Deliverables:**
- `/app/(auth)/login/page.tsx`
- `/app/(dashboard)/layout.tsx`
- `/prisma/schema.prisma`
- `/lib/auth.ts`
- `/middleware.ts`

---

## Phase 2: User Management

**Goal:** Enable admin to create and manage editor accounts with role-based access.

**Requirements:**
- AUTH-05: Admin can create editor accounts with name and email
- ACCESS-02: Editor cannot access other editors' projects
- ACCESS-03: Editor cannot access admin functions

**Success Criteria:**
1. User creation form works (admin only)
2. User list shows all users with their roles
3. Role-based route protection enforced
4. Editor sees different navigation than admin
5. Password is hashed securely on creation

**Deliverables:**
- `/app/(dashboard)/editors/page.tsx`
- `/app/api/users/route.ts`
- Role-based middleware enhancement

---

## Phase 3: Client Management

**Goal:** Full CRUD operations for clients with all required fields.

**Requirements:**
- CLIENT-01: Admin can view list of all clients
- CLIENT-02: Admin can create a new client with all fields
- CLIENT-03: Admin can edit any client's information
- CLIENT-04: Admin can see how many projects each client has

**Success Criteria:**
1. Client list page shows all clients with project counts
2. Create client form captures all fields (name, niche, IDs, PDF links)
3. Edit client form pre-populates and saves changes
4. Validation prevents empty required fields
5. Clients are usable in project creation

**Deliverables:**
- `/app/(dashboard)/clients/page.tsx`
- `/app/(dashboard)/clients/new/page.tsx`
- `/app/(dashboard)/clients/[id]/page.tsx`
- `/app/api/clients/route.ts`
- `/app/api/clients/[id]/route.ts`

---

## Phase 4: Project Core & Status

**Goal:** Project CRUD with status management and activity logging foundation.

**Requirements:**
- PROJ-01: Admin can create a new project with all fields
- PROJ-02: Admin can view list of all projects with status
- PROJ-03: Admin can view full project details
- PROJ-04: Admin can cancel a project
- PROJ-05: Project status is clearly visible
- PROJ-06: Admin can filter/search projects
- STATUS-01: Project progresses through defined status flow
- STATUS-02: Status transitions are enforced
- STATUS-03: Cancelled status available from any non-completed status
- STATUS-04: Visual status indicator shows pipeline progress
- LOG-01: All status changes are logged with timestamp
- LOG-04: Log entries show who performed the action

**Success Criteria:**
1. Project creation form with client selection, editor assignment, deadline
2. Project list with status badges and filtering
3. Project detail page shows all information
4. Status changes logged to ActivityLog table
5. Cancel button works and updates status
6. Status badge uses color coding (pending=yellow, complete=green, etc.)

**Deliverables:**
- `/app/(dashboard)/projects/page.tsx`
- `/app/(dashboard)/projects/new/page.tsx`
- `/app/(dashboard)/projects/[id]/page.tsx`
- `/app/api/projects/route.ts`
- `/app/api/projects/[id]/route.ts`
- `/lib/status.ts` (status machine)
- `/components/projects/StatusBadge.tsx`

---

## Phase 5: Webhook Infrastructure

**Goal:** Build the webhook calling system with error handling, retry, and callback processing.

**Requirements:**
- HOOK-06: Webhook URLs are configurable in settings
- HOOK-07: Failed webhooks display error message on the project
- HOOK-08: Admin can retry failed webhooks
- LOG-02: Webhook calls (success/failure) are logged

**Success Criteria:**
1. Webhook configuration stored in database or env
2. Generic webhook caller function with timeout and error handling
3. Webhook status stored on project (pending, success, error, message)
4. Retry button triggers webhook again
5. Callback endpoint receives and validates N8N responses
6. Activity log records all webhook attempts

**Deliverables:**
- `/lib/webhooks.ts`
- `/app/api/webhooks/n8n/callback/route.ts`
- `/app/(dashboard)/settings/page.tsx` (webhook URLs)
- Webhook status fields in Project model

---

## Phase 6: Automated Workflows (Research & Scripting)

**Goal:** Implement the automatic research and scripting workflow triggered on project creation.

**Requirements:**
- HOOK-01: System automatically triggers Research webhook after project creation
- HOOK-02: System automatically triggers Scripting webhook after research completes
- HOOK-05: System triggers Notification webhook for key events

**Success Criteria:**
1. Creating a project triggers research webhook automatically
2. Research callback updates project and triggers scripting webhook
3. Scripting callback updates project with script and sends notification
4. Status transitions: created → research_in_progress → research_complete → script_in_progress → script_pending_approval
5. Errors at any step are captured and displayed

**Deliverables:**
- Enhanced project creation flow
- Webhook chain orchestration
- Notification webhook integration

---

## Phase 7: Script Review Workflow

**Goal:** Admin can review, approve, or reject scripts with feedback loop.

**Requirements:**
- SCRIPT-01: Admin can view the generated script
- SCRIPT-02: Admin can view research output for context
- SCRIPT-03: Admin can approve the script
- SCRIPT-04: Admin can reject the script with required feedback
- SCRIPT-05: Rejected script triggers optimizer, new script replaces old
- HOOK-03: System triggers Script Optimizer webhook on rejection
- HOOK-04: System triggers Video Production webhook on approval

**Success Criteria:**
1. Project detail shows script in readable format
2. Research output expandable/collapsible
3. Approve button triggers production webhook, status → production_in_progress
4. Reject button requires feedback text input
5. Rejection triggers optimizer webhook
6. Optimized script replaces original, loops back to pending approval

**Deliverables:**
- Script review UI on project detail
- `/app/api/projects/[id]/approve-script/route.ts`
- `/app/api/projects/[id]/reject-script/route.ts`

---

## Phase 8: Video Review & Editor Assignment

**Goal:** Admin reviews raw AI video and assigns to editor on approval.

**Requirements:**
- VIDEO-01: Admin can view/play the raw AI video
- VIDEO-02: Admin can approve the raw video (assigns to editor)
- VIDEO-03: Admin can reject the raw video (triggers regeneration)
- HOOK-05: Notification sent to editor on assignment

**Success Criteria:**
1. Video player embedded or link to video URL
2. Approve transitions: production_pending_approval → production_approved → editing_assigned
3. Notification webhook called with editor details
4. Reject triggers production webhook again (retry)
5. Project now visible in editor's list

**Deliverables:**
- Video review UI on project detail
- `/app/api/projects/[id]/approve-video/route.ts`
- `/app/api/projects/[id]/reject-video/route.ts`

---

## Phase 9: Editor Experience

**Goal:** Complete editor workflow from receiving project to submitting final video.

**Requirements:**
- EDITOR-01: Editor can only see projects assigned to them
- EDITOR-02: Editor can view project details
- EDITOR-03: Editor can access/download raw AI video
- EDITOR-04: Editor can access brand guidelines PDF
- EDITOR-05: Editor can access editing guidelines PDF
- EDITOR-06: Editor can paste Google Drive link for final video
- EDITOR-07: Editor can mark editing complete
- EDASH-01: Editor dashboard shows assigned projects only
- EDASH-02: Editor dashboard shows active project count
- EDASH-03: Editor dashboard shows completed project count
- LOG-03: Admin can view activity log on project detail

**Success Criteria:**
1. Editor dashboard only shows their projects
2. Editor project view shows video, PDFs (as links), script
3. Final video URL field accepts Google Drive link
4. "Mark Complete" button transitions to final_review
5. Notification sent to admin
6. Activity log visible on project detail for admin

**Deliverables:**
- Editor-specific dashboard and project list
- `/app/api/projects/[id]/submit-final/route.ts`
- Activity log component

---

## Phase 10: Final Review & Admin Dashboard

**Goal:** Complete the final review flow and build comprehensive admin dashboard.

**Requirements:**
- FINAL-01: Admin can access final video via Google Drive link
- FINAL-02: Admin can approve final video (marks complete)
- FINAL-03: Admin can send feedback notification to editor
- FINAL-04: Status stays at final_review until approved
- AUTH-04: User can reset password via email link
- DASH-01: Count of active/in-progress projects
- DASH-02: Count of pending admin action
- DASH-03: Count of recently completed
- DASH-04: List of projects needing action
- DASH-05: Editor workload view
- DASH-06: Recent projects with status
- DASH-07: Quick actions from dashboard
- UX-01: Dark/light mode toggle
- UX-02: Loading states for all async operations
- UX-03: Toast notifications
- UX-04: Confirmation dialogs
- UX-05: Responsive layout
- UX-06: Clear error messages

**Success Criteria:**
1. Final review UI with approve and "Send Feedback" buttons
2. Approve marks project completed
3. Send Feedback triggers Slack notification
4. Password reset flow works (email link)
5. Admin dashboard shows all metrics
6. Workload widget shows projects per editor
7. Pending actions list links directly to projects
8. Dark mode toggle in header
9. All buttons show loading state
10. Toast feedback on all actions
11. Mobile-responsive layout

**Deliverables:**
- Final review actions
- Admin dashboard page
- `/app/api/projects/[id]/complete/route.ts`
- `/app/api/projects/[id]/send-feedback/route.ts`
- Password reset flow
- Theme toggle
- Dashboard widgets

---

## Phase Summary

| # | Phase | Requirements | Goal |
|---|-------|--------------|------|
| 1 | Foundation | AUTH-01,02,03, ACCESS-01,04 | Project setup, auth, layout |
| 2 | User Management | AUTH-05, ACCESS-02,03 | Editor accounts, roles |
| 3 | Client Management | CLIENT-01,02,03,04 | Client CRUD |
| 4 | Project Core | PROJ-*, STATUS-*, LOG-01,04 | Project CRUD, status |
| 5 | Webhook Infrastructure | HOOK-06,07,08, LOG-02 | Webhook system |
| 6 | Automated Workflows | HOOK-01,02,05 | Research + scripting chain |
| 7 | Script Review | SCRIPT-*, HOOK-03,04 | Approve/reject scripts |
| 8 | Video Review | VIDEO-*, HOOK-05 | Approve/reject videos |
| 9 | Editor Experience | EDITOR-*, EDASH-*, LOG-03 | Editor workflow |
| 10 | Final Review + Dashboard | FINAL-*, AUTH-04, DASH-*, UX-* | Completion + polish |

---

## Requirement Coverage

All 54 v1 requirements are mapped to phases. No gaps.

---
*Created: 2026-01-27*
