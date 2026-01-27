# Stack Research: Avatar Agency

## Recommended Stack (2025)

### Frontend Framework
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **Next.js** | 14.2+ | HIGH | App Router is stable, excellent DX, built-in API routes, perfect Vercel integration |

**Why not alternatives:**
- Remix: Good but less ecosystem support, more complex deployment
- Vite + React: No built-in API routes, need separate backend
- SvelteKit: Smaller ecosystem, harder to hire for

### UI Components
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **shadcn/ui** | latest | HIGH | Copy-paste components, fully customizable, Radix primitives, great accessibility |
| **Tailwind CSS** | 3.4+ | HIGH | Industry standard, perfect with shadcn, great DX |

**Why not alternatives:**
- MUI/Chakra: Heavier, harder to customize, opinionated styling
- Ant Design: Enterprise-focused, complex, large bundle

### Database
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **PostgreSQL** | 15+ | HIGH | Relational data fits perfectly, JSONB for flexible fields, excellent with Prisma |
| **Prisma ORM** | 5.x | HIGH | Type-safe, great migrations, excellent DX |

**Why not alternatives:**
- MongoDB: Overkill for relational workflow data
- Drizzle: Newer, less ecosystem support
- Raw SQL: Loses type safety, more error-prone

### Authentication
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **NextAuth.js (Auth.js)** | 5.x | HIGH | Built for Next.js, Credentials provider for email/password, easy role management |

**Why not alternatives:**
- Clerk: Paid, overkill for internal app
- Supabase Auth: Requires Supabase ecosystem
- Custom JWT: More work, security risks

### Form Handling
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **React Hook Form** | 7.x | HIGH | Performant, great DX, works well with Zod |
| **Zod** | 3.x | HIGH | Type-safe validation, works with Prisma types |

### State Management
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **Server Components + React Query** | 5.x | MEDIUM | Most state is server data, minimal client state needed |

**Why not alternatives:**
- Redux: Overkill for this app
- Zustand: Probably not needed, but good fallback

### HTTP Client (for webhooks)
| Choice | Version | Confidence | Rationale |
|--------|---------|------------|-----------|
| **Native fetch** | - | HIGH | Built into Node.js 18+, no extra dependency |

### Additional Libraries
| Library | Purpose | Confidence |
|---------|---------|------------|
| **date-fns** | Date formatting/manipulation | HIGH |
| **lucide-react** | Icons (works with shadcn) | HIGH |
| **next-themes** | Dark/light mode toggle | HIGH |
| **sonner** | Toast notifications | HIGH |

### Database Hosting
| Choice | Confidence | Rationale |
|--------|------------|-----------|
| **Vercel Postgres** or **Neon** | HIGH | Serverless PostgreSQL, great Vercel integration |

## Full Stack Summary

```
Frontend:     Next.js 14+ (App Router) + TypeScript
Styling:      Tailwind CSS + shadcn/ui
Database:     PostgreSQL (Vercel Postgres or Neon)
ORM:          Prisma 5.x
Auth:         NextAuth.js 5.x (Credentials provider)
Forms:        React Hook Form + Zod
State:        React Query (TanStack Query) for server state
Icons:        Lucide React
Theme:        next-themes
Toasts:       Sonner
Deployment:   Vercel
```

## Package.json Dependencies (Estimated)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "@prisma/client": "^5.x",
    "next-auth": "^5.0.0",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "latest",
    "next-themes": "^0.3.x",
    "sonner": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.4.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x"
  }
}
```

## Gaps Identified

1. **Email sending** - May need for password reset (Resend or nodemailer)
2. **File uploads** - Not needed (using Google Drive links)
3. **Real-time updates** - Not critical, polling is fine for this scale
4. **Testing** - Consider Vitest + Playwright for later phases

---
*Confidence: HIGH = validated approach, MEDIUM = good choice but alternatives exist*
