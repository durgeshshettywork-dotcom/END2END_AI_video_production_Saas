# Research Summary: Avatar Agency

## Key Findings

### Stack (HIGH Confidence)
- **Frontend:** Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (serverless)
- **Database:** PostgreSQL with Prisma ORM (Vercel Postgres or Neon)
- **Auth:** NextAuth.js 5.x with Credentials provider
- **Forms:** React Hook Form + Zod validation
- **Deployment:** Vercel with GitHub CI/CD

### Table Stakes Features
1. User authentication (email/password)
2. Role-based access (admin/editor)
3. Client management (CRUD)
4. Project management (CRUD + status)
5. Webhook integration with 5 N8N workflows
6. Status tracking and visualization
7. Activity logging
8. Error handling with retry capability

### Architecture
- **Monolithic Next.js app** (appropriate for scale)
- **PostgreSQL** relational database with 4 main tables: User, Client, Project, ActivityLog
- **RESTful API** routes under /api/*
- **Async webhook calls** with callback pattern
- **Role-based middleware** for access control

### Critical Pitfalls to Avoid
1. **No idempotency** on webhooks → use idempotency keys
2. **Invalid state transitions** → enforce state machine
3. **No retry mechanism** → implement retry with exponential backoff
4. **Client-side only auth** → server-side session validation
5. **No activity logging** → log all status changes

## Recommended Build Order

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| 1 | Foundation | Next.js setup, Prisma schema, auth system |
| 2 | Core Data | Client CRUD, User management |
| 3 | Projects | Project CRUD, status management, editor assignment |
| 4 | Webhooks | Webhook infrastructure, error handling, retry |
| 5 | Workflows | Script review, video review, final review flows |
| 6 | Editor Experience | Editor dashboard, project view, submission |
| 7 | Admin Dashboard | Metrics, workload view, project overview |
| 8 | Polish | Dark mode, keyboard shortcuts, optimization |

## Technical Decisions Summary

| Area | Decision | Confidence |
|------|----------|------------|
| Framework | Next.js 14+ App Router | HIGH |
| Database | PostgreSQL + Prisma | HIGH |
| Auth | NextAuth.js Credentials | HIGH |
| UI | shadcn/ui + Tailwind | HIGH |
| State | React Query + Server Components | MEDIUM |
| Hosting | Vercel | HIGH |
| Webhook pattern | Async with callback | HIGH |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Webhook failures | Retry mechanism with activity log |
| State consistency | Database as single source of truth |
| Auth bypass | Server-side checks on all routes |
| Data loss | PostgreSQL reliability + activity log |

## Files Created
- [STACK.md](./STACK.md) - Technology choices
- [FEATURES.md](./FEATURES.md) - Feature analysis
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [PITFALLS.md](./PITFALLS.md) - Common mistakes to avoid

---
*Research completed: 2026-01-27*
