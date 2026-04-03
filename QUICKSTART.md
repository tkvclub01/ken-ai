# KEN AI - Quick Start Guide

## 🎯 What Has Been Implemented

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Next.js 14 project with App Router, TypeScript, Tailwind CSS
- [x] Shadcn UI components with dark mode theme
- [x] Supabase client configuration (browser & server)
- [x] Authentication middleware and helpers
- [x] Gemini AI integration utilities
- [x] Email template system and prompt library

### ✅ Phase 2: Database (COMPLETE)
- [x] Complete database schema with 10+ tables
- [x] Row Level Security policies for all tables
- [x] Audit logging triggers
- [x] Vector search functions for knowledge base
- [x] Auto-updated timestamps and user profile creation

### ✅ Phase 3: OCR Pipeline (COMPLETE)
- [x] Supabase Edge Function for OCR processing
- [x] Drag-and-drop file upload component
- [x] Split-view verification UI
- [x] Real-time status updates

## 🚀 Next Steps to Get Running

### Step 1: Set Up Supabase (15 minutes)

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **New Project**: Click "New Project" → Choose organization → Name it "ken-ai"
3. **Set Database Password**: Save this securely!
4. **Wait for Setup**: Takes ~2 minutes

### Step 2: Run Database Migrations (5 minutes)

Once your project is ready:

1. Go to **Dashboard** → **SQL Editor**
2. **Copy the entire contents of** `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor and click **Run**
4. Repeat for `supabase/migrations/002_rls_policies.sql`

✅ You should see: "Success. No rows returned"

### Step 3: Enable Extensions (1 minute)

1. Go to **Database** → **Extensions**
2. Search for "vector" 
3. Click **Enable** on the `vector` extension

### Step 4: Create Storage Buckets (2 minutes)

1. Go to **Storage** → Click "New Bucket"
2. Create bucket named: `documents-original` (set to **Private**)
3. Create bucket named: `documents-processed` (set to **Private**)

Then run this SQL in **SQL Editor**:

```sql
-- Allow uploads
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents-original'
  AND auth.role() = 'authenticated'
);

-- Allow reading
CREATE POLICY "Users can read relevant documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents-original'
  AND (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id::text = (storage.foldername(objects.name))[1]
      AND (students.counselor_id = auth.uid() OR auth.role() = 'admin')
    )
  )
);
```

### Step 5: Get API Keys (5 minutes)

#### Supabase Keys
1. Go to **Settings** → **API**
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` (e.g., `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (starts with `eyJ...`)
   - `SUPABASE_SERVICE_ROLE_KEY` (starts with `eyJ...`) ⚠️ Keep secret!

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Copy to `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`

### Step 6: Configure Environment Variables (2 minutes)

Create `.env.local` file in project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

### Step 7: Install Supabase CLI (Optional but Recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

Deploy Edge Function:

```bash
supabase functions deploy ocr-process
supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

### Step 8: Start Development Server (1 minute)

```bash
npm install  # If not already done
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎨 What You'll See

### Login Page
- Clean, modern authentication screen
- Email/password login
- Link to signup page

### Future Pages (To Be Built)
- **Dashboard**: Analytics and KPIs
- **Students Kanban Board**: Drag-and-drop pipeline management
- **Document Upload**: File upload with OCR processing
- **Verification UI**: Split-view for reviewing AI extractions
- **Knowledge Base**: Semantic search interface
- **AI Chat Panel**: Context-aware assistant

## 🧪 Testing the Setup

### Test 1: Database Connection
1. Open browser console on login page
2. Run:
```javascript
const { createClient } = await import('@/lib/supabase/client')
const supabase = createClient()
const { data, error } = await supabase.from('pipeline_stages').select('*')
console.log(data)
```
3. Should return 6 pipeline stages

### Test 2: Authentication
1. Go to `/signup` page
2. Create a test account
3. Check email for confirmation link
4. After confirming, try logging in

### Test 3: Manual Document Insert (Advanced)
In Supabase Dashboard → SQL Editor:

```sql
INSERT INTO students (full_name, email, status)
VALUES ('Test Student', 'test@example.com', 'active');
```

Check if you can query it from your app.

## 📋 Checklist

Before considering setup complete:

- [ ] Supabase project created
- [ ] Database migrations executed successfully
- [ ] pgvector extension enabled
- [ ] Storage buckets created with policies
- [ ] Environment variables configured
- [ ] Can access login page at localhost:3000
- [ ] Can create account via signup
- [ ] Can log in successfully
- [ ] Console shows no errors
- [ ] Edge Function deployed (optional for now)

## 🐛 Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: You haven't run the migrations yet. Go to SQL Editor and run the migration files.

### Issue: "Invalid API key"
**Solution**: Double-check your `.env.local` values. Make sure there are no extra spaces.

### Issue: "Failed to fetch" on upload
**Solution**: Check that storage bucket exists and RLS policies are in place.

### Issue: TypeScript errors
**Solution**: Run `npx supabase gen types typescript --project-id xxx > src/lib/supabase/types.ts`

## 🎓 Learning Resources

### New to Next.js?
- [Next.js Official Tutorial](https://nextjs.org/learn)
- [App Router Explained](https://nextjs.org/docs/app)

### New to Supabase?
- [Supabase Docs](https://supabase.com/docs)
- [RLS Explained](https://supabase.com/docs/guides/auth/row-level-security)

### New to Shadcn UI?
- [Shadcn UI Docs](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/examples)

## 🆘 Getting Help

If you get stuck:

1. **Check Console**: Browser and terminal often show helpful errors
2. **Supabase Logs**: Dashboard → Logs → Realtime logs
3. **Documentation**: Refer to README.md for detailed info
4. **Community**: Supabase Discord, Next.js Discord

## ➡️ What's Next?

After setup is complete, you can:

1. **Build Dashboard**: Analytics charts with Recharts
2. **Create Kanban Board**: Drag-and-drop student pipeline
3. **Test OCR Flow**: Upload a passport image and verify extraction
4. **Add Knowledge Base**: Seed with policy documents
5. **Implement AI Chat**: Real-time chat panel with context

---

**Estimated Total Setup Time**: 30-45 minutes

**Need help?** Check the full README.md for detailed documentation.

Good luck! 🚀
