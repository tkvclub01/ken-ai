# KEN AI - Intelligent Student Management Platform

A modern, web-centric platform for managing student consultations and visa processing workflows, powered by Next.js, Supabase, and Gemini AI.

## 🚀 Features

### Core Capabilities
- **OCR Pipeline**: Automated document scanning and data extraction using Gemini 1.5 Flash
- **Smart Verification**: Split-view UI for reviewing AI-extracted data against original documents
- **Role-Based Access Control**: Secure RBAC with RLS policies (Admin, Manager, Counselor, Processor)
- **Audit Trail**: Complete logging of all data changes for compliance
- **Knowledge Base**: Vector-powered semantic search for policies and procedures
- **AI Assistant**: Context-aware chat for staff support

### Technical Highlights
- **Next.js 14+** with App Router and Server Components
- **Supabase** for backend (Auth, Database, Storage, Edge Functions)
- **Gemini AI** for OCR and natural language processing
- **Shadcn UI** with dark mode and glassmorphism design
- **TypeScript** throughout for type safety
- **Real-time updates** via Supabase Realtime

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([Sign up free](https://supabase.com))
- Google AI API key for Gemini ([Get one here](https://makersuite.google.com/app/apikey))

## 🛠️ Setup Instructions

### 1. Clone Repository

```bash
cd ken-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Supabase Setup

#### A. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the database to initialize

#### B. Run Database Migrations

In Supabase Dashboard → SQL Editor, run the migrations in order:

1. **Copy contents of `supabase/migrations/001_initial_schema.sql`**
   - Execute in SQL Editor
   - This creates tables, types, indexes, and triggers

2. **Copy contents of `supabase/migrations/002_rls_policies.sql`**
   - Execute in SQL Editor
   - This sets up Row Level Security policies

#### C. Enable pgvector Extension

In Supabase Dashboard → Database → Extensions:
- Enable `vector` extension (for semantic search)

#### D. Create Storage Buckets

In Supabase Dashboard → Storage:

1. Create bucket: `documents-original`
   - Set to **Private**
   
2. Create bucket: `documents-processed`
   - Set to **Private**

Add storage policies (in SQL Editor):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents-original'
  AND auth.role() = 'authenticated'
);

-- Allow users to read documents they have access to
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents-original'
  AND auth.uid()::text IN (
    SELECT students.counselor_id::text
    FROM students
    JOIN documents ON documents.student_id = students.id
    WHERE documents.file_path = storage.objects.name
  )
);
```

### 5. Deploy Edge Function

Install Supabase CLI:

```bash
npm install -g supabase
```

Login to Supabase:

```bash
supabase login
```

Link to your project:

```bash
supabase link --project-ref your-project-ref
```

Deploy OCR function:

```bash
supabase functions deploy ocr-process
```

Set environment variables for Edge Function:

```bash
supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 6. Generate TypeScript Types (Optional but Recommended)

```bash
npx supabase gen types typescript --project-id your-project-ref > src/lib/supabase/types.ts
```

This auto-generates types from your database schema.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ken-ai/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── page.tsx         # Dashboard home
│   │   ├── students/        # Student management
│   │   └── documents/       # Document management
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── documents/           # Document-related components
│   │   ├── FileUpload.tsx
│   │   └── OCRVerification.tsx
│   └── layout/              # Layout components
├── lib/
│   ├── supabase/            # Supabase client & utilities
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── auth.ts
│   │   └── types.ts
│   └── ai/                  # AI integration
│       ├── gemini.ts
│       └── prompts.ts
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── ocr-process/
│   ├── migrations/          # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── config.toml
└── .env.local.example
```

## 🔐 Authentication & Authorization

### User Roles

- **Admin**: Full system access, user management, audit log viewing
- **Manager**: Team oversight, knowledge base management, reporting
- **Counselor**: Manage assigned students, upload documents, verify data
- **Processor**: Document processing and verification only

### Row Level Security (RLS)

The system implements strict RLS policies:
- Counselors can only access their assigned students
- Documents are accessible only by relevant staff
- Knowledge base is read-only for most roles
- Audit logs are admin-only

## 🤖 AI Features

### OCR Pipeline

1. Upload document (passport, transcript, ID card)
2. Automatic trigger to Edge Function
3. Gemini extracts structured data
4. Staff review and verify in split-view UI
5. Verified data updates student records

### Semantic Search

- Vector embeddings stored in pgvector
- Natural language queries return relevant policies
- Continuous learning from user feedback

### Email Drafting

Pre-built templates for common scenarios:
- University inquiries
- Visa appeals
- Welcome emails
- Document reminders

## 🧪 Testing

Run tests (when implemented):

```bash
npm test
```

## 🚀 Deployment

### Production Deployment on Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Update Edge Function in Production

```bash
supabase functions deploy ocr-process --prod
```

## 📊 Database Schema Overview

### Core Tables

- **profiles**: User accounts with role-based permissions
- **students**: Student records and application data
- **documents**: Document metadata and OCR results
- **pipeline_stages**: Kanban board workflow stages
- **student_pipeline**: Track student progress through stages
- **knowledge_base**: Vector embeddings for semantic search
- **audit_logs**: Complete change tracking
- **conversations**: AI chat history

## 🛡️ Security Considerations

- All tables have RLS policies enabled
- Service role key never exposed to client
- Signed URLs with expiration for file access
- Audit logging for compliance
- Input validation with Zod schemas

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | ✅ |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-side only) | ✅ |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key | ✅ |
| `NEXT_PUBLIC_APP_URL` | Frontend URL for callbacks | ❌ |

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch" errors:**
- Check that Supabase URL and keys are correct
- Ensure RLS policies allow the operation
- Verify Edge Function is deployed

**OCR not working:**
- Confirm Gemini API key is valid
- Check Edge Function logs in Supabase Dashboard
- Ensure storage bucket policies allow access

**TypeScript errors:**
- Run `npx supabase gen types` to update types
- Make sure database migrations are complete

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini AI Documentation](https://ai.google.dev)
- [Shadcn UI Documentation](https://ui.shadcn.com)

## 👥 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ using Next.js, Supabase, and Gemini AI**
