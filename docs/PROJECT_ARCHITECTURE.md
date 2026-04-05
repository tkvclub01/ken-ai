# KEN AI - PROJECT ARCHITECTURE

## Overview

KEN AI is a modern student management and AI-powered assistant platform built with Next.js 14, Supabase, and TypeScript. The system features role-based access control (RBAC), document OCR processing, AI chat capabilities, and comprehensive analytics dashboards.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Base UI
- **State Management**: Zustand (client store), React Query (server state)
- **Authentication**: Supabase Auth with RBAC
- **Rich Text Editor**: Tiptap
- **Toast Notifications**: Sonner

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Storage**: Supabase Storage
- **Vector Database**: pgvector for semantic search

### Infrastructure
- **Deployment**: Vercel (Next.js) + Supabase (Database)
- **Environment**: Development, Staging, Production
- **CI/CD**: Git-based deployment with Supabase migrations

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  ┌──────────┐  ┌──────────  ┌──────────┐  ┌─────────┐ │
│  │  Admin   │  │ Employee │  │ Student  │  │  Auth   │ │
│  │ Dashboard│  │ Dashboard│  │ Dashboard│  │  Pages  │ │
│  └──────────┘  └──────────┘  └──────────  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS MIDDLEWARE                     │
│  • Authentication validation                            │
│  • Role-based access control                            │
│  • Route protection                                     │
│  • Session management                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Server       │  │ React Query  │  │ Zustand      │  │
│  │ Actions      │  │ Hooks        │  │ Stores       │  │
│  │ (auth/chat/  │  │ (analytics/  │  │ (sidebar/    │  │
│  │  knowledge)  │  │  students/   │  │  theme/      │  │
│  │              │  │  documents)  │  │  user)       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │ Auth Service │  │ Edge         │  │
│  │ Database     │  │ • OAuth      │  │ Functions    │  │
│  │ • RLS        │  │ • Magic Link │  │ • OCR        │  │
│  │ • Triggers   │  │ • Sessions   │  │ • Knowledge  │  │
│  │ • Views      │  │ • RBAC       │  │   Ingest     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ken-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Dashboard routes (protected)
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── analytics/            # Analytics page
│   │   │   ├── chat/                 # AI Chat interface
│   │   │   ├── documents/            # Document management
│   │   │   ├── employee/             # Employee dashboard
│   │   │   ├── knowledge/            # Knowledge base
│   │   │   ├── settings/             # Settings pages
│   │   │   │   └── users/            # User management (admin only)
│   │   │   ├── student/              # Student dashboard
│   │   │   ├── students/             # Student management
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   └── page.tsx              # Dashboard home
│   │   ├── auth/                     # Auth routes
│   │   │   └── callback/             # OAuth callback
│   │   ├── login/                    # Login page
│   │   ├── signup/                   # Signup page
│   │   ├── 403-unauthorized/         # Access denied page
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   └── page.tsx                  # Landing page
│   │
│   ├── actions/                      # Server Actions
│   │   ├── chat.ts                   # AI chat operations
│   │   └── knowledge.ts              # Knowledge base operations
│   │
│   ├── components/                   # React Components
│   │   ├── auth/                     # Auth components
│   │   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   │   ├── chat/                     # Chat components
│   │   │   └── AIChatPanel.tsx       # AI chat interface
│   │   ├── dashboard/                # Dashboard components
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── documents/                # Document components
│   │   │   ├── FileUpload.tsx
│   │   │   └── OCRVerification.tsx
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── ai/                   # AI features
│   │   │   │   └── RichTextEditor.tsx
│   │   │   ├── analytics/            # Analytics widgets
│   │   │   │   ├── AISummaryWidget.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   ├── PipelineChart.tsx
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   └── RevenueTracking.tsx
│   │   │   ├── documents/            # Document features
│   │   │   │   ├── DocumentTable.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   └── OCRResultsPanel.tsx
│   │   │   └── students/             # Student features
│   │   │       ├── KanbanBoard.tsx
│   │   │       ├── StudentForm.tsx
│   │   │       └── StudentTable.tsx
│   │   ├── knowledge/                # Knowledge base components
│   │   │   └── KnowledgeBaseSearch.tsx
│   │   ├── shared/                   # Shared components
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeProvider.tsx
│   │   └── ui/                       # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── ... (40+ UI components)
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── services/                 # Service hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useAnalytics.ts           # Analytics hook
│   │   ├── useDocuments.ts           # Documents hook
│   │   ├── useStudents.ts            # Students hook
│   │   └── ReactQueryProvider.tsx    # React Query provider
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── ai/                       # AI utilities
│   │   ├── supabase/                 # Supabase clients
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── auth.ts               # Auth actions
│   │   ├── utils.ts                  # Utility functions
│   │   ├── constants.ts              # App constants
│   │   └── accessibility.ts          # Accessibility utilities
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── useSidebarStore.ts        # Sidebar state
│   │   ├── useThemeStore.ts          # Theme state
│   │   └── useUserStore.ts           # User state
│   │
│   ├── types/                        # TypeScript types
│   │   └── index.ts                  # Database & app types
│   │
│   └── proxy.ts                      # Next.js middleware
│
├── supabase/                         # Supabase configuration
│   ├── functions/                    # Edge Functions
│   │   ├── ingest-knowledge/         # Knowledge base ingestion
│   │   │   └── index.ts
│   │   └── ocr-process/              # OCR processing
│   │       └── index.ts
│   ├── migrations/                   # Database migrations
│   │   ├── 000_extensions.sql        # PostgreSQL extensions
│   │   ├── 002_main_migration.sql    # Main schema
│   │   ├── 003_rbac_migration.sql    # RBAC system
│   │   ├── 004_rls_policies.sql      # RLS policies
│   │   ├── 005_fix_profiles_signup.sql
│   │   └── 006_audit_logging.sql     # Audit logging
│   └── config.toml                   # Supabase config
│
├── public/                           # Static assets
├── .env                              # Environment variables
├── middleware.ts                     # Next.js middleware
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
└── package.json                      # Dependencies
```

---

## Key Architectural Decisions

### 1. Server-Client Architecture
- **Server Actions**: Used for mutations (auth, knowledge base operations)
- **React Query**: Used for data fetching and caching
- **Zustand**: Used for client-side state (theme, sidebar, user preferences)

### 2. Role-Based Access Control (RBAC)
- **Middleware Level**: Route protection based on user role
- **Database Level**: Row Level Security (RLS) policies
- **Application Level**: Permission checks in components

### 3. Data Flow
```
User Action → Component → Hook/Store → Server Action → Supabase → Database
                    ↓
              React Query Cache
                    ↓
              Component Re-render
```

### 4. Security Layers
1. **Next.js Middleware**: Authentication & route protection
2. **ProtectedRoute Component**: Fine-grained access control
3. **Supabase RLS**: Database-level row security
4. **Role Permissions**: Permission-based feature access

### 5. Performance Optimizations
- **React Query**: Automatic caching and background refetching
- **Next.js Caching**: Server component caching
- **Database Indexes**: Optimized query performance
- **Vector Indexes**: IVFFLAT for semantic search

---

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

### Database Migrations
```bash
# Apply migrations
supabase db push

# Create new migration
supabase migration new migration_name
```

### Edge Functions
```bash
# Deploy edge functions
supabase functions deploy ocr-process
supabase functions deploy ingest-knowledge
```

---

## Deployment

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server only)
- `GOOGLE_GEMINI_API_KEY`: Google Gemini API key
- `NEXT_PUBLIC_SITE_URL`: Application URL

### Deployment Platforms
- **Frontend**: Vercel (automatic Git deployments)
- **Backend**: Supabase (managed PostgreSQL)
- **Edge Functions**: Supabase Edge Runtime

---

## Best Practices

### Code Organization
- Components organized by feature/domain
- Server actions separated from UI components
- Types defined in centralized `types/index.ts`
- Reusable UI components in `components/ui/`

### Security
- All database access through RLS policies
- Admin actions require role verification
- Sensitive operations logged to audit_logs
- Input validation on all forms

### Performance
- React Query for server state caching
- Lazy loading for heavy components
- Optimized database queries with indexes
- Vector similarity search with IVFFLAT

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly components
- High contrast mode support

---

*Last Updated: April 2025*
