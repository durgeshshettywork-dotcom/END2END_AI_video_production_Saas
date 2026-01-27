# Avatar Agency - Requirements

## v1 Requirements

### Authentication (AUTH)
- [ ] **AUTH-01**: User can log in with email and password
- [ ] **AUTH-02**: User session persists across browser sessions
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: Admin can create editor accounts with name and email

### Client Management (CLIENT)
- [ ] **CLIENT-01**: Admin can view list of all clients
- [ ] **CLIENT-02**: Admin can create a new client with name, niche, avatar ID, voice ID, and PDF links
- [ ] **CLIENT-03**: Admin can edit any client's information
- [ ] **CLIENT-04**: Admin can see how many projects each client has

### Project Management (PROJ)
- [ ] **PROJ-01**: Admin can create a new project by selecting client, entering video idea, assigning editor, and setting deadline
- [ ] **PROJ-02**: Admin can view list of all projects with current status
- [ ] **PROJ-03**: Admin can view full project details including all data and history
- [ ] **PROJ-04**: Admin can cancel a project at any status (except completed)
- [ ] **PROJ-05**: Project status is clearly visible at all times
- [ ] **PROJ-06**: Admin can filter/search projects by client, status, editor, or date

### Webhook Integration (HOOK)
- [ ] **HOOK-01**: System automatically triggers Research webhook after project creation
- [ ] **HOOK-02**: System automatically triggers Scripting webhook after research completes
- [ ] **HOOK-03**: System triggers Script Optimizer webhook when admin rejects script with feedback
- [ ] **HOOK-04**: System triggers Video Production webhook when admin approves script
- [ ] **HOOK-05**: System triggers Notification webhook for all key events (5 event types)
- [ ] **HOOK-06**: Webhook URLs are configurable in settings (not hardcoded)
- [ ] **HOOK-07**: Failed webhooks display error message on the project
- [ ] **HOOK-08**: Admin can retry failed webhooks with a button

### Script Review Workflow (SCRIPT)
- [ ] **SCRIPT-01**: Admin can view the generated script on project detail page
- [ ] **SCRIPT-02**: Admin can view research output for context
- [ ] **SCRIPT-03**: Admin can approve the script (triggers production webhook)
- [ ] **SCRIPT-04**: Admin can reject the script with required feedback text
- [ ] **SCRIPT-05**: Rejected script triggers optimizer, new script replaces old one

### Video Review Workflow (VIDEO)
- [ ] **VIDEO-01**: Admin can view/play the raw AI video on project detail page
- [ ] **VIDEO-02**: Admin can approve the raw video (assigns to editor)
- [ ] **VIDEO-03**: Admin can reject the raw video (triggers regeneration)

### Editor Experience (EDITOR)
- [ ] **EDITOR-01**: Editor can only see projects assigned to them
- [ ] **EDITOR-02**: Editor can view project details: client, deadline, video, PDFs, script
- [ ] **EDITOR-03**: Editor can access/download the raw AI video
- [ ] **EDITOR-04**: Editor can access brand guidelines PDF (external link)
- [ ] **EDITOR-05**: Editor can access editing guidelines PDF (external link)
- [ ] **EDITOR-06**: Editor can paste Google Drive link for final edited video
- [ ] **EDITOR-07**: Editor can mark their editing as complete

### Final Review Workflow (FINAL)
- [ ] **FINAL-01**: Admin can access final video via Google Drive link
- [ ] **FINAL-02**: Admin can approve final video (marks project complete)
- [ ] **FINAL-03**: Admin can send feedback notification to editor (via Slack webhook)
- [ ] **FINAL-04**: Status stays at final_review until admin approves

### Admin Dashboard (DASH)
- [ ] **DASH-01**: Dashboard shows count of active/in-progress projects
- [ ] **DASH-02**: Dashboard shows count of projects pending admin action
- [ ] **DASH-03**: Dashboard shows count of recently completed projects
- [ ] **DASH-04**: Dashboard shows list of projects needing immediate action
- [ ] **DASH-05**: Dashboard shows editor workload (active projects per editor)
- [ ] **DASH-06**: Dashboard shows recent projects with current status
- [ ] **DASH-07**: Quick actions available from dashboard (e.g., jump to pending approvals)

### Editor Dashboard (EDASH)
- [ ] **EDASH-01**: Editor dashboard shows their assigned projects only
- [ ] **EDASH-02**: Editor dashboard shows count of their active projects
- [ ] **EDASH-03**: Editor dashboard shows their completed project count

### Activity & Logging (LOG)
- [ ] **LOG-01**: All status changes are logged with timestamp
- [ ] **LOG-02**: Webhook calls (success/failure) are logged
- [ ] **LOG-03**: Admin can view activity log on project detail page
- [ ] **LOG-04**: Log entries show who performed the action (if applicable)

### Status Management (STATUS)
- [ ] **STATUS-01**: Project progresses through defined status flow (13 statuses)
- [ ] **STATUS-02**: Status transitions are enforced (cannot skip steps)
- [ ] **STATUS-03**: Cancelled status available from any non-completed status
- [ ] **STATUS-04**: Visual status indicator shows pipeline progress

### Access Control (ACCESS)
- [ ] **ACCESS-01**: Admin has full access to all features
- [ ] **ACCESS-02**: Editor cannot access other editors' projects
- [ ] **ACCESS-03**: Editor cannot access admin functions (clients, approvals, etc.)
- [ ] **ACCESS-04**: Unauthenticated users redirected to login

### UI/UX (UX)
- [ ] **UX-01**: Dark/light mode toggle
- [ ] **UX-02**: Loading states for all async operations
- [ ] **UX-03**: Toast notifications for action feedback
- [ ] **UX-04**: Confirmation dialogs for destructive actions
- [ ] **UX-05**: Responsive layout (desktop and tablet)
- [ ] **UX-06**: Clear error messages with recovery guidance

---

## v2 Requirements (Deferred)

- [ ] Email notifications (backup to Slack)
- [ ] Bulk actions on multiple projects
- [ ] Export projects to CSV
- [ ] Pipeline visualization diagram
- [ ] Real-time status updates (WebSocket)
- [ ] Advanced analytics and trends
- [ ] Keyboard shortcuts for power users

---

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Client portal/access | Internal tool only |
| File uploads | Using Google Drive links |
| Video editing features | Done externally |
| User self-registration | Admin creates accounts |
| Client deletion | Not needed per spec |
| Multi-tenant | Single agency use |
| Mobile-first design | Desktop is primary |
| Internationalization | English only |
| Two-factor auth | Overkill for internal |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-* | Phase 1 | Pending |
| CLIENT-* | Phase 2 | Pending |
| PROJ-* | Phase 3 | Pending |
| HOOK-* | Phase 4 | Pending |
| SCRIPT-* | Phase 5 | Pending |
| VIDEO-* | Phase 5 | Pending |
| EDITOR-* | Phase 6 | Pending |
| FINAL-* | Phase 5 | Pending |
| DASH-* | Phase 7 | Pending |
| EDASH-* | Phase 6 | Pending |
| LOG-* | Phase 4 | Pending |
| STATUS-* | Phase 3 | Pending |
| ACCESS-* | Phase 1 | Pending |
| UX-* | Phase 8 | Pending |

---

**Total v1 Requirements:** 54
**Categories:** 14

---
*Last updated: 2026-01-27*
