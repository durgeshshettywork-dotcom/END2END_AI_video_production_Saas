# Avatar Agency

## What This Is

An internal web application for managing AI avatar video production workflows. The app serves as a central command center ("Thanos") that orchestrates the entire video creation pipeline - from idea input through research, scripting, AI video generation, to final human editing.

## Core Value

**The ONE thing that must work:** Seamless workflow orchestration that reliably triggers N8N webhooks at the right time with the right data, tracks project status accurately, and gives visibility into the entire pipeline.

## Who It's For

- **Admin (You):** Full control - creates projects, manages clients, assigns editors, approves/rejects at decision points, views all metrics
- **Editor (1-3 people):** Limited access - views assigned projects, accesses resources, submits final videos

## The Problem It Solves

Currently there's no centralized system to:
- Track where each video project is in the pipeline
- Trigger AI automation (research, scripting, video generation) at the right moments
- Manage client information and project assignments
- Give editors clear visibility into their work queue
- Provide admin with workload and progress metrics

## How It Works

1. **Admin creates project** → triggers Research webhook → triggers Scripting webhook
2. **Admin reviews script** → approves (triggers Video Production) or rejects (triggers Script Optimizer)
3. **Admin reviews raw AI video** → approves → assigns to editor
4. **Editor edits video** → submits final link → Admin does final review
5. **Slack notifications** sent at key moments via Notification webhook

## The 5 N8N Webhooks ("Infinity Stones")

| # | Webhook | Purpose | Trigger Point |
|---|---------|---------|---------------|
| 1 | Research | 3 AIs research the video idea | After project creation |
| 2 | Scripting | Generate script using hook/content/reward | After research completes |
| 3 | Script Optimizer | Improve rejected script with feedback | When admin rejects script |
| 4 | Video Production | Generate AI avatar video (HeyGen/Higgsfield) | When admin approves script |
| 5 | Notification | Send Slack notifications | Various events |

## Tech Stack Decisions

**Frontend:**
- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS + shadcn/ui components
- Light/dark mode toggle

**Backend:**
- Next.js API Routes (serverless)
- PostgreSQL database
- Prisma ORM

**Auth:**
- Email + Password authentication
- Role-based access (admin vs editor)

**Deployment:**
- Local development first
- GitHub repository for version control
- Vercel deployment with auto-deploy on push

## Constraints

- Internal use only (no public registration)
- Webhook URLs configurable (not hardcoded) - will be set up later
- File storage via external links (Google Drive) - not file uploads
- 30-100 projects/month volume
- Small team (1-3 editors)

## What We're NOT Building

- Client-facing portal (clients don't access this)
- File upload/storage (using Google Drive links instead)
- Video editing features (done externally)
- Complex user management (just admin creates editors)
- Client deletion (not needed)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack | Single codebase, easy Vercel deploy, great DX | Pending |
| PostgreSQL + Prisma | Reliable, relational data fits well, type-safe | Pending |
| shadcn/ui components | Customizable, accessible, modern design | Pending |
| Configurable webhooks | N8N URLs set up separately, need flexibility | Pending |
| No file storage | External links reduce complexity, use Google Drive | Pending |

## Success Criteria

- [ ] Admin can create clients with all required fields
- [ ] Admin can create projects and assign editors
- [ ] Webhooks trigger automatically at correct pipeline stages
- [ ] Script approval/rejection workflow works with feedback loop
- [ ] Video approval/rejection workflow works with retry capability
- [ ] Editors see only their assigned projects
- [ ] Status transitions are accurate and visible
- [ ] Slack notifications fire at key moments
- [ ] Dashboard shows workload and project metrics
- [ ] Error handling with retry capability for failed webhooks

---
*Last updated: 2026-01-27 after initialization*
