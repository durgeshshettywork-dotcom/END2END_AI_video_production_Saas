# 🎬 Avatar Agency - AI-Powered Video Production Platform ( Completion in progress. )

A full-stack video production management platform built with Next.js 16, enabling agencies to manage clients, projects, and automated video workflows with AI-powered avatars.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

## 🌟 Features

### 🔐 Authentication & Authorization
- Secure user authentication with NextAuth.js v5
- Role-based access control (Admin/User)
- Password encryption with bcrypt
- Session management with JWT

### 👥 Client Management
- Create and manage multiple clients
- Track client information and contact details
- Client-specific project portfolios
- Activity logging per client

### 📊 Project Workflow System
- Multi-stage video production pipeline:
  - **Research Phase** - Content planning and research
  - **Scripting Phase** - Script generation and refinement
  - **Optimization Phase** - Content optimization
  - **Production Phase** - Final video production
- Real-time project status tracking
- Project archiving and filtering
- Secure API key management with encryption

### 🔗 Webhook Integration
- Configurable webhooks for each production stage
- Automated workflow notifications
- External service integration support

### 📱 Modern UI/UX
- Fully responsive design with Tailwind CSS 4
- Dark mode support with next-themes
- Radix UI components for accessibility
- Toast notifications with Sonner
- Form validation with React Hook Form + Zod

### 📈 Activity Tracking
- Comprehensive activity logging
- User action history
- Project timeline tracking

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI Components
- Lucide React Icons

**Backend:**
- Next.js API Routes
- NextAuth.js v5
- Prisma ORM
- SQLite (Development) / PostgreSQL Ready

**Form & Validation:**
- React Hook Form
- Zod Schema Validation
- Hookform Resolvers

**Security:**
- bcrypt password hashing
- Custom encryption for API keys
- Environment-based secrets management

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm/yarn/pnpm/bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/avatar-agency.git
   cd avatar-agency
   ```

2. **Install dependencies**
   ```bash
   cd avatar-agency
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:
   ```env
   # Generate AUTH_SECRET: openssl rand -base64 32
   AUTH_SECRET="your-generated-secret"

   # Generate ENCRYPTION_SECRET: openssl rand -hex 32
   ENCRYPTION_SECRET="your-generated-encryption-key"
   ```

4. **Initialize the database**
   ```bash
   npm run db:push      # Push schema to database
   npm run db:seed      # Seed with initial data (optional)
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## 📁 Project Structure

```
avatar-agency/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (dashboard)/     # Dashboard & main app pages
│   │   └── api/             # API routes
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── actions/         # Server actions
│   │   ├── services/        # Business logic
│   │   └── utils.ts         # Utility functions
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding
└── public/                  # Static assets
```

## 🗄️ Database Schema

**Core Models:**
- `User` - User accounts with authentication
- `Client` - Client management
- `Project` - Video production projects with multi-stage workflow
- `ActivityLog` - Audit trail of user actions
- `WebhookConfig` - Webhook endpoint configurations

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based session management
- ✅ API key encryption at rest
- ✅ Environment variable isolation
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React defaults)
- ✅ CSRF protection (NextAuth)
- ✅ Soft delete implementation

## 🎨 Key Features Showcase

### Authentication Flow
- Secure login/logout with NextAuth.js
- Session persistence across pages
- Protected routes with middleware

### Project Management
- Create projects linked to clients
- Track progress through production stages
- Manage API keys for AI services
- Archive completed projects

### Activity Monitoring
- Real-time activity feed
- Filter by user or action type
- Comprehensive audit trail

## 🚧 Roadmap

- [ ] Email notifications for workflow stages
- [ ] AI avatar generation integration
- [ ] Video preview and management
- [ ] Client portal access
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## 📄 License

This project is private and for portfolio demonstration purposes.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [yourwebsite.com](https://yourwebsite.com)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**⭐ If you find this project interesting, please consider giving it a star!**
