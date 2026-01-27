# Architecture Research: Avatar Agency

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AVATAR AGENCY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Admin     │    │    Editor    │    │   N8N        │      │
│  │   Browser    │    │   Browser    │    │  Webhooks    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Next.js Application                     │       │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │       │
│  │  │  React Frontend │  │    API Routes           │   │       │
│  │  │  (App Router)   │  │    /api/*               │   │       │
│  │  └─────────────────┘  └─────────────────────────┘   │       │
│  │                              │                       │       │
│  │                              ▼                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │              Prisma ORM                      │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              PostgreSQL Database                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      External Services        │
              │  ┌─────┐ ┌─────┐ ┌─────────┐  │
              │  │ N8N │ │Slack│ │HeyGen/  │  │
              │  │     │ │     │ │Higgsfield│ │
              │  └─────┘ └─────┘ └─────────┘  │
              └───────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login)
│   │   └── login/
│   ├── (dashboard)/         # Protected routes
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx     # Project list
│   │   │   ├── new/         # Create project
│   │   │   └── [id]/        # Project detail
│   │   ├── clients/
│   │   │   ├── page.tsx     # Client list
│   │   │   ├── new/         # Create client
│   │   │   └── [id]/        # Client detail
│   │   ├── editors/         # Admin only
│   │   │   └── page.tsx     # Editor management
│   │   └── settings/
│   └── api/                 # API routes
│       ├── auth/
│       ├── projects/
│       ├── clients/
│       ├── users/
│       └── webhooks/        # Webhook handlers
├── components/
│   ├── ui/                  # shadcn components
│   ├── layout/              # Layout components
│   ├── projects/            # Project-specific components
│   ├── clients/             # Client-specific components
│   └── dashboard/           # Dashboard widgets
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Auth configuration
│   ├── webhooks.ts         # Webhook utilities
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript types
```

### Database Schema

```
┌─────────────────┐       ┌─────────────────┐
│     User        │       │     Client      │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ name            │       │ name            │
│ email           │       │ contentNiche    │
│ password        │       │ avatarId        │
│ role (enum)     │       │ voiceId         │
│ createdAt       │       │ brandGuidelinesUrl
│ updatedAt       │       │ editingGuidelinesUrl
└─────────────────┘       │ createdAt       │
         │                │ updatedAt       │
         │                └─────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│                  Project                     │
├─────────────────────────────────────────────┤
│ id                                          │
│ clientId (FK)                               │
│ editorId (FK)                               │
│ videoIdea                                   │
│ deadline                                    │
│ status (enum)                               │
│ researchOutput (text)                       │
│ script (text)                               │
│ scriptFeedback (text)                       │
│ rawVideoUrl                                 │
│ finalVideoUrl                               │
│ createdAt                                   │
│ updatedAt                                   │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              ActivityLog                     │
├─────────────────────────────────────────────┤
│ id                                          │
│ projectId (FK)                              │
│ action (enum)                               │
│ details (json)                              │
│ userId (FK, nullable)                       │
│ createdAt                                   │
└─────────────────────────────────────────────┘
```

### API Structure

```
/api/auth/
  POST   /login              # Authenticate user
  POST   /logout             # End session
  GET    /session            # Get current session

/api/users/
  GET    /                   # List users (admin)
  POST   /                   # Create user (admin)
  GET    /:id                # Get user
  PATCH  /:id                # Update user (admin)

/api/clients/
  GET    /                   # List clients
  POST   /                   # Create client (admin)
  GET    /:id                # Get client
  PATCH  /:id                # Update client (admin)

/api/projects/
  GET    /                   # List projects (filtered by role)
  POST   /                   # Create project (admin)
  GET    /:id                # Get project
  PATCH  /:id                # Update project
  POST   /:id/approve-script # Approve script (admin)
  POST   /:id/reject-script  # Reject script (admin)
  POST   /:id/approve-video  # Approve video (admin)
  POST   /:id/reject-video   # Reject video (admin)
  POST   /:id/complete       # Mark complete (admin)
  POST   /:id/cancel         # Cancel project (admin)
  POST   /:id/submit-final   # Submit final video (editor)
  POST   /:id/retry-webhook  # Retry failed webhook (admin)

/api/webhooks/
  POST   /n8n/callback       # Receive N8N webhook responses
```

### Webhook Flow

```
Project Created
      │
      ▼
┌─────────────────┐     ┌─────────────────┐
│ Call Research   │────►│ N8N Research    │
│ Webhook         │     │ Workflow        │
└─────────────────┘     └────────┬────────┘
                                 │
                    Callback to /api/webhooks/n8n/callback
                                 │
                                 ▼
┌─────────────────┐     ┌─────────────────┐
│ Call Scripting  │────►│ N8N Scripting   │
│ Webhook         │     │ Workflow        │
└─────────────────┘     └────────┬────────┘
                                 │
                    Callback to /api/webhooks/n8n/callback
                                 │
                                 ▼
                        Admin Reviews Script
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
        [Approve]                              [Reject]
              │                                     │
              ▼                                     ▼
┌─────────────────┐                    ┌─────────────────┐
│ Call Production │                    │ Call Optimizer  │
│ Webhook         │                    │ Webhook         │
└─────────────────┘                    └─────────────────┘
```

### Data Flow

1. **Admin creates project** → Project saved with status "created"
2. **Webhook service called** → Research webhook triggered async
3. **N8N processes** → Calls back to /api/webhooks/n8n/callback
4. **Callback handler** → Updates project, triggers next webhook
5. **Status updates** → Activity log entries created
6. **Frontend polls/refreshes** → Sees updated status

### Key Design Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Webhook calls | Async, fire-and-forget with callback | Don't block UI, N8N handles retry |
| Status updates | Single source of truth in DB | No race conditions |
| Activity log | Append-only | Full audit trail |
| Role checks | Middleware + DB queries | Defense in depth |
| API responses | Consistent JSON format | Predictable client handling |

### Security Considerations

1. **API routes protected** by NextAuth session check
2. **Role-based access** enforced in each route
3. **Webhook callbacks** validated by shared secret
4. **Input validation** using Zod on all inputs
5. **SQL injection** prevented by Prisma parameterization

### Build Order (Dependencies)

```
1. Database Schema + Prisma Setup
   └── Required by everything

2. Auth System (NextAuth)
   └── Required for protected routes

3. User Management
   └── Required for role-based access

4. Client CRUD
   └── Required for project creation

5. Project CRUD (basic)
   └── Core functionality

6. Webhook Infrastructure
   └── Required for automation

7. Status Workflow
   └── Depends on webhooks

8. Activity Logging
   └── Wraps around operations

9. Dashboards
   └── Depends on all data being available
```

---
*This architecture supports the 30-100 projects/month scale with room to grow*
